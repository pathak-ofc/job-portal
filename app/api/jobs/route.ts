import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Job from "@/models/Job";
import { auth } from "@/auth";
import type { SessionUser } from "@/types/job";
import { JOB_CATEGORIES } from "@/lib/jobCategories";
import { VALID_JOB_TYPES, PAGINATION, SORT_OPTIONS, EXPERIENCE_LEVELS } from "@/lib/constants";
import { jobCreateSchema, formatZodError } from "@/lib/validation";
import Application from "@/models/Application";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

// GET /api/jobs — public job listing, with search/filter/pagination
// Pass ?mine=true while logged in as a company to get all of your own jobs
// (any status), instead of the public approved-only listing.
export async function GET(req: NextRequest) {
  try {
    await connectDb();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const location = searchParams.get("location");
    const jobType = searchParams.get("jobType");
    const isRemote = searchParams.get("isRemote");
    const experienceLevel = searchParams.get("experienceLevel");
    const sort = searchParams.get("sort") || "newest";
    const mine = searchParams.get("mine") === "true";

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const pageSize = Math.min(
      PAGINATION.JOBS_MAX,
      Math.max(1, parseInt(searchParams.get("pageSize") || String(PAGINATION.JOBS_DEFAULT), 10) || PAGINATION.JOBS_DEFAULT)
    );

    let query: Record<string, unknown> = { status: "approved" };

    if (mine) {
      const session = await auth();
      if (!session?.user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
      const user = session.user as SessionUser;
      if (user.role !== "company") {
        return NextResponse.json(
          { message: "Forbidden — companies only" },
          { status: 403 }
        );
      }
      query = { companyId: user.id };
    }

    if (search) {
      // escape regex special characters to avoid ReDoS / broken patterns from user input
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.title = { $regex: escaped, $options: "i" };
    }
    if (category) {
      if (!JOB_CATEGORIES.includes(category as typeof JOB_CATEGORIES[number])) {
        return NextResponse.json({ message: "Invalid category filter" }, { status: 400 });
      }
      query.category = category;
    }
    if (location) {
      // case-insensitive partial match for location to improve UX and index use
      const escapedLoc = location.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.location = { $regex: escapedLoc, $options: "i" };
    }
    if (jobType) {
      if (!VALID_JOB_TYPES.includes(jobType as typeof VALID_JOB_TYPES[number])) {
        return NextResponse.json({ message: "Invalid jobType filter" }, { status: 400 });
      }
      query.jobType = jobType;
    }
    if (isRemote === "true") {
      query.isRemote = true;
    }
    if (experienceLevel) {
      if (!EXPERIENCE_LEVELS.includes(experienceLevel as typeof EXPERIENCE_LEVELS[number])) {
        return NextResponse.json({ message: "Invalid experienceLevel" }, { status: 400 });
      }
      query.experienceLevel = experienceLevel;
    }
    if (!SORT_OPTIONS.includes(sort as typeof SORT_OPTIONS[number])) {
      return NextResponse.json({ message: "Invalid sort option" }, { status: 400 });
    }

    // sorting
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 },
      deadline: { deadline: 1 },
      salaryHigh: { salaryMax: -1, salaryMin: -1 },
      popular: { viewCount: -1 },
    };
    const sortSpec = sortMap[sort] || sortMap.newest;

    const total = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .sort(sortSpec)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    // For company dashboard (mine=true), attach applicant counts for analytics
    let jobsWithMeta: unknown = jobs;
    if (mine && jobs.length > 0) {
      const jobIds = jobs.map((j: unknown) => (j as { _id: unknown })._id);
      const counts = await Application.aggregate([
        { $match: { jobId: { $in: jobIds } } },
        { $group: { _id: "$jobId", count: { $sum: 1 } } },
      ]);
      const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
      jobsWithMeta = jobs.map((j: unknown) => ({
        ...(j as Record<string, unknown>),
        applicantCount: countMap.get(String((j as { _id: unknown })._id)) || 0,
      }));
    }

    return NextResponse.json({
      jobs: jobsWithMeta,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

// POST /api/jobs — create a job (company only, companyId derived from session)
export async function POST(req: NextRequest) {
  try {
    // Rate limit job creation: 10 jobs per 15 min per user + 20 per IP
    const ip = getClientIp(req);
    const ipLimit = await rateLimit(`create-job-ip:${ip}`, { limit: 20, windowMs: 15 * 60 * 1000 });
    if (!ipLimit.allowed) {
      return NextResponse.json({ message: "Too many job posts — please slow down" }, { status: 429 });
    }

    await connectDb();

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    if (user.role !== "company") {
      return NextResponse.json(
        { message: "Only companies can post jobs" },
        { status: 403 }
      );
    }

    const userLimit = await rateLimit(`create-job-user:${user.id}`, { limit: 10, windowMs: 15 * 60 * 1000 });
    if (!userLimit.allowed) {
      return NextResponse.json({ message: "Too many job posts — please try again later" }, { status: 429 });
    }

    const raw = await req.json();
    const parsed = jobCreateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ message: formatZodError(parsed.error) }, { status: 400 });
    }
    const { title, description, category, location, jobType, deadline, salaryRange, salaryMin, salaryMax, experienceLevel, isRemote } = parsed.data;

    if (salaryMin !== undefined && salaryMax !== undefined && salaryMin > salaryMax) {
      return NextResponse.json({ message: "salaryMin must be <= salaryMax" }, { status: 400 });
    }

    const deadlineDate = new Date(deadline);

    // companyId always comes from the session — never trust the client for this
    const job = await Job.create({
      companyId: user.id,
      title,
      description,
      category,
      location,
      jobType,
      deadline: deadlineDate,
      salaryRange: salaryRange || "",
      salaryMin,
      salaryMax,
      experienceLevel,
      isRemote: isRemote || location.toLowerCase().includes("remote"),
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to create job" },
      { status: 500 }
    );
  }
}

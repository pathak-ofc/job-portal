import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Job from "@/models/Job";
import { auth } from "@/auth";
import type { Session } from "next-auth";
import { JOB_CATEGORIES } from "@/lib/jobCategories";

type SessionUser = Session["user"] & { id: string; role: "student" | "company" | "admin" };

const VALID_JOB_TYPES = ["full-time", "part-time", "internship"] as const;
const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;

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
    const mine = searchParams.get("mine") === "true";

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
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
      query.location = location;
    }
    if (jobType) {
      if (!VALID_JOB_TYPES.includes(jobType as typeof VALID_JOB_TYPES[number])) {
        return NextResponse.json({ message: "Invalid jobType filter" }, { status: 400 });
      }
      query.jobType = jobType;
    }

    const total = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return NextResponse.json({
      jobs,
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

    const body = await req.json();
    const { title, description, category, location, jobType, deadline, salaryRange } = body;

    if (!title || !description || !category || !location || !jobType || !deadline) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!VALID_JOB_TYPES.includes(jobType)) {
      return NextResponse.json({ message: "Invalid job type" }, { status: 400 });
    }

    if (!JOB_CATEGORIES.includes(category)) {
      return NextResponse.json({ message: "Invalid category" }, { status: 400 });
    }

    const deadlineDate = new Date(deadline);
    if (Number.isNaN(deadlineDate.getTime())) {
      return NextResponse.json({ message: "Invalid deadline date" }, { status: 400 });
    }
    if (deadlineDate.getTime() <= Date.now()) {
      return NextResponse.json(
        { message: "Deadline must be a future date" },
        { status: 400 }
      );
    }

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

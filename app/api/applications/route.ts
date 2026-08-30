import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDb from "@/lib/db";
import Application from "@/models/Application";
import Job from "@/models/Job";
import StudentProfile from "@/models/StudentProfile";
import { auth } from "@/auth";
import { applicationCreateSchema, formatZodError } from "@/lib/validation";
import { isValidCloudinaryUrl } from "@/lib/cloudinary";
import { PAGINATION } from "@/lib/constants";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

// POST /api/applications — student applies to a job
export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "student") {
      return NextResponse.json(
        { message: "Only students can apply to jobs" },
        { status: 403 }
      );
    }

    const ip = getClientIp(req);
    const ipLimit = await rateLimit(`apply-ip:${ip}`, { limit: 20, windowMs: 15 * 60 * 1000 });
    const userLimit = await rateLimit(`apply-user:${session.user.id}`, { limit: 10, windowMs: 60 * 60 * 1000 });
    if (!ipLimit.allowed || !userLimit.allowed) {
      return NextResponse.json({ message: "Too many applications — please try again later" }, { status: 429 });
    }

    const raw = await req.json();
    const parsed = applicationCreateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ message: formatZodError(parsed.error) }, { status: 400 });
    }
    const { jobId, resumeUrl, coverLetter } = parsed.data;

    if (!mongoose.isValidObjectId(jobId)) {
      return NextResponse.json({ message: "Invalid jobId" }, { status: 400 });
    }

    if (!isValidCloudinaryUrl(resumeUrl)) {
      return NextResponse.json(
        { message: "resumeUrl must be a valid Cloudinary URL from this project" },
        { status: 400 }
      );
    }

    // confirm the job actually exists, is open, and hasn't passed its deadline
    const job = await Job.findById(jobId);
    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }
    if (job.status !== "approved") {
      return NextResponse.json(
        { message: "This job is not currently accepting applications" },
        { status: 400 }
      );
    }
    if (job.deadline.getTime() <= Date.now()) {
      return NextResponse.json(
        { message: "The application deadline for this job has passed" },
        { status: 400 }
      );
    }

    try {
      const application = await Application.create({
        jobId,
        studentId: session.user.id,
        resumeUrl,
        coverLetter: coverLetter || "",
      });
      return NextResponse.json({ application }, { status: 201 });
    } catch (err: unknown) {
      // duplicate key from the unique (jobId, studentId) index
      if ((err as { code?: number }).code === 11000) {
        return NextResponse.json(
          { message: "You already applied to this job" },
          { status: 409 }
        );
      }
      throw err;
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to apply" },
      { status: 500 }
    );
  }
}

// GET /api/applications — role-aware list
// Students: pass ?jobId=... to check whether you've applied to one specific
// job (used by the job detail page to persist "Applied" state across reloads).
// Companies: pass ?jobId=... to scope results to a single job you own,
// instead of pulling every application across all your jobs.
export async function GET(req: NextRequest) {
  try {
    await connectDb();

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const role = session.user.role;
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");

    if (role === "student") {
      const filter: Record<string, unknown> = { studentId: userId };
      if (jobId) {
        if (!mongoose.isValidObjectId(jobId)) {
          return NextResponse.json({ message: "Invalid jobId" }, { status: 400 });
        }
        filter.jobId = jobId;
      }

      const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
      const pageSize = Math.min(
        PAGINATION.APPLICATIONS_MAX,
        Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10) || 20)
      );

      const total = await Application.countDocuments(filter);
      const applications = await Application.find(filter)
        .populate("jobId", "title companyId location jobType")
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean();

      return NextResponse.json({
        applications,
        pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
      });
    }

    if (role === "company") {
      if (jobId) {
        // scoped to a single job — verify ownership first
        const job = await Job.findById(jobId).select("companyId");
        if (!job) {
          return NextResponse.json({ message: "Job not found" }, { status: 404 });
        }
        if (job.companyId.toString() !== userId) {
          return NextResponse.json(
            { message: "Forbidden — not your job" },
            { status: 403 }
          );
        }

        const applications = await Application.find({ jobId })
          .populate("jobId", "title")
          .populate("studentId", "name email")
          .sort({ createdAt: -1 })
          .lean();

        // Attach each applicant's profile (skills/bio/phone) so the company
        // can review it alongside the resume/cover letter — fetched
        // separately since StudentProfile isn't a ref on Application/User.
        const studentIds = (applications as unknown as Array<{ studentId: { _id: unknown } | null }>)
          .map((a) => (a.studentId as unknown as { _id: unknown })?._id)
          .filter(Boolean);
        const profiles = await StudentProfile.find({ userId: { $in: studentIds } })
          .select("userId bio skills phone")
          .lean();
        const profileByUserId = new Map(
          (profiles as unknown as Array<{ userId: unknown } & Record<string, unknown>>).map((p) => [
            String(p.userId),
            p,
          ])
        );

        const applicationsWithProfile = applications.map((a) => {
          const typed = a as unknown as { studentId: { _id: unknown } | null } & Record<string, unknown>;
          const studentId = typed.studentId ? String((typed.studentId as { _id: unknown })._id) : null;
          return {
            ...a,
            studentProfile: studentId ? profileByUserId.get(studentId) || null : null,
          };
        });

        return NextResponse.json({ applications: applicationsWithProfile });
      }

      // companies see applications for all jobs they own
      const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
      const pageSize = Math.min(
        PAGINATION.APPLICATIONS_MAX,
        Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10) || 20)
      );
      const myJobs = await Job.find({ companyId: userId }).select("_id").lean();
      const myJobIds = myJobs.map((job) => (job as unknown as { _id: unknown })._id);

      if (myJobIds.length === 0) {
        return NextResponse.json({
          applications: [],
          pagination: { page, pageSize, total: 0, totalPages: 1 },
        });
      }

      const total = await Application.countDocuments({ jobId: { $in: myJobIds } });
      const applications = await Application.find({ jobId: { $in: myJobIds } })
        .populate("jobId", "title")
        .populate("studentId", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean();

      return NextResponse.json({
        applications,
        pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
      });
    }

    return NextResponse.json({ message: "Invalid role" }, { status: 403 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

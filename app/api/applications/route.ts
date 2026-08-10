import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Application from "@/models/Application";
import Job from "@/models/Job";
import StudentProfile from "@/models/StudentProfile";
import { auth } from "@/auth";

const MAX_COVER_LETTER_LENGTH = 5000;

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

    const body = await req.json();
    const { jobId, resumeUrl, coverLetter } = body;

    if (!jobId || typeof jobId !== "string" || !resumeUrl || typeof resumeUrl !== "string") {
      return NextResponse.json(
        { message: "jobId and resumeUrl are required" },
        { status: 400 }
      );
    }

    if (typeof coverLetter === "string" && coverLetter.length > MAX_COVER_LETTER_LENGTH) {
      return NextResponse.json(
        { message: `Cover letter must be under ${MAX_COVER_LETTER_LENGTH} characters` },
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
      if (jobId) filter.jobId = jobId;

      const applications = await Application.find(filter)
        .populate("jobId", "title companyId location jobType")
        .sort({ createdAt: -1 });

      return NextResponse.json({ applications });
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
          .sort({ createdAt: -1 });

        // Attach each applicant's profile (skills/bio/phone) so the company
        // can review it alongside the resume/cover letter — fetched
        // separately since StudentProfile isn't a ref on Application/User.
        const studentIds = applications.map((a) => a.studentId?._id).filter(Boolean);
        const profiles = await StudentProfile.find({ userId: { $in: studentIds } }).select(
          "userId bio skills phone"
        );
        const profileByUserId = new Map(profiles.map((p) => [p.userId.toString(), p]));

        const applicationsWithProfile = applications.map((a) => {
          const obj = a.toObject();
          const studentId = a.studentId?._id?.toString();
          return {
            ...obj,
            studentProfile: studentId ? profileByUserId.get(studentId) || null : null,
          };
        });

        return NextResponse.json({ applications: applicationsWithProfile });
      }

      // companies see applications for all jobs they own
      const myJobs = await Job.find({ companyId: userId }).select("_id");
      const myJobIds = myJobs.map((job) => job._id);

      const applications = await Application.find({ jobId: { $in: myJobIds } })
        .populate("jobId", "title")
        .populate("studentId", "name email")
        .sort({ createdAt: -1 });

      return NextResponse.json({ applications });
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

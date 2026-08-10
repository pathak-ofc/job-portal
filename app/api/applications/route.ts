import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Application from "@/models/Application";
import Job from "@/models/Job";
import { auth } from "@/auth";

// POST /api/applications — student applies to a job
export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as any).role !== "student") {
      return NextResponse.json(
        { message: "Only students can apply to jobs" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { jobId, resumeUrl, coverLetter } = body;

    if (!jobId || !resumeUrl) {
      return NextResponse.json(
        { message: "jobId and resumeUrl are required" },
        { status: 400 }
      );
    }

    // confirm the job actually exists
    const job = await Job.findById(jobId);
    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    // prevent duplicate applications to the same job
    const existing = await Application.findOne({
      jobId,
      studentId: (session.user as any).id,
    });
    if (existing) {
      return NextResponse.json(
        { message: "You already applied to this job" },
        { status: 409 }
      );
    }

    const application = await Application.create({
      jobId,
      studentId: (session.user as any).id,
      resumeUrl,
      coverLetter: coverLetter || "",
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to apply", error: (error as Error).message },
      { status: 500 }
    );
  }
}

// GET /api/applications — role-aware list
export async function GET() {
  try {
    await connectDb();

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    if (role === "student") {
      // students see their own applications
      const applications = await Application.find({ studentId: userId })
        .populate("jobId", "title companyId location jobType")
        .sort({ createdAt: -1 });

      return NextResponse.json({ applications });
    }

    if (role === "company") {
      // companies see applications for jobs they own
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
    return NextResponse.json(
      { message: "Failed to fetch applications", error: (error as Error).message },
      { status: 500 }
    );
  }
}
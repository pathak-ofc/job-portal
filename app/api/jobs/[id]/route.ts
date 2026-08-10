import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Job from "@/models/Job";
import { auth } from "@/auth";
import type { Session } from "next-auth";
import { JOB_CATEGORIES } from "@/lib/jobCategories";

type SessionUser = Session["user"] & { id: string; role: "student" | "company" | "admin" };

const VALID_JOB_TYPES = ["full-time", "part-time", "internship"] as const;

// Fields a company is allowed to edit on their own job. Never allow the
// client to set `status` or `companyId` directly — status changes go
// through the admin approval routes, and companyId is derived from the session.
const EDITABLE_FIELDS = [
  "title",
  "description",
  "category",
  "location",
  "salaryRange",
  "jobType",
  "deadline",
] as const;

// GET /api/jobs/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const { id } = await params;

    const job = await Job.findById(id).populate("companyId", "name");
    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch {
    return NextResponse.json({ message: "Job not found" }, { status: 404 });
  }
}

// PATCH /api/jobs/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const { id } = await params;

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const user = session.user as SessionUser;

    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    if (job.companyId.toString() !== user.id) {
      return NextResponse.json(
        { message: "Forbidden — not your job" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Whitelist fields — never trust the client with status/companyId.
    const update: Record<string, unknown> = {};
    for (const key of EDITABLE_FIELDS) {
      if (body[key] !== undefined) update[key] = body[key];
    }

    if (update.jobType !== undefined && !VALID_JOB_TYPES.includes(update.jobType as typeof VALID_JOB_TYPES[number])) {
      return NextResponse.json({ message: "Invalid job type" }, { status: 400 });
    }

    if (update.category !== undefined && !JOB_CATEGORIES.includes(update.category as typeof JOB_CATEGORIES[number])) {
      return NextResponse.json({ message: "Invalid category" }, { status: 400 });
    }

    if (update.deadline !== undefined) {
      const deadlineDate = new Date(update.deadline as string);
      if (Number.isNaN(deadlineDate.getTime())) {
        return NextResponse.json({ message: "Invalid deadline date" }, { status: 400 });
      }
      if (deadlineDate.getTime() <= Date.now()) {
        return NextResponse.json(
          { message: "Deadline must be a future date" },
          { status: 400 }
        );
      }
      update.deadline = deadlineDate;
    }

    // A job edited by its owner goes back to pending review, since the
    // content admins previously approved may have changed.
    update.status = "pending";

    const updatedJob = await Job.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    return NextResponse.json({ job: updatedJob });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to update job" },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const { id } = await params;

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const user = session.user as SessionUser;

    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    if (job.companyId.toString() !== user.id) {
      return NextResponse.json(
        { message: "Forbidden — not your job" },
        { status: 403 }
      );
    }

    await Job.findByIdAndDelete(id);
    return NextResponse.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to delete job" },
      { status: 500 }
    );
  }
}

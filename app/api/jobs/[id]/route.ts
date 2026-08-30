import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDb from "@/lib/db";
import Job from "@/models/Job";
import Application from "@/models/Application";
import Bookmark from "@/models/Bookmark";
import { auth } from "@/auth";
import type { SessionUser } from "@/types/job";
import { VALID_JOB_TYPES, EXPERIENCE_LEVELS } from "@/lib/constants";
import { JOB_CATEGORIES } from "@/lib/jobCategories";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

// Fields a company is allowed to edit on their own job. Never allow the
// client to set `status` or `companyId` directly — status changes go
// through the admin approval routes, and companyId is derived from the session.
const EDITABLE_FIELDS = [
  "title",
  "description",
  "category",
  "location",
  "salaryRange",
  "salaryMin",
  "salaryMax",
  "jobType",
  "deadline",
  "experienceLevel",
  "isRemote",
] as const;

// GET /api/jobs/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    const job = await Job.findById(id).populate("companyId", "name").lean();
    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    // Hide pending/rejected jobs from public unless requester is owner or admin
    const typedJob = job as unknown as { status: string; companyId: unknown };
    if (typedJob.status !== "approved") {
      const session = await auth();
      const user = session?.user as SessionUser | undefined;
      const companyIdStr =
        typeof typedJob.companyId === "object" && typedJob.companyId !== null && "_id" in (typedJob.companyId as Record<string, unknown>)
          ? String((typedJob.companyId as { _id: unknown })._id)
          : String(typedJob.companyId);
      const isOwner = user?.id === companyIdStr;
      const isAdmin = user?.role === "admin";
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ message: "Job not found" }, { status: 404 });
      }
    }

    // Increment viewCount atomically for analytics (popular sort) — don't block response
    try {
      await Job.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
      // also increment in returned object for immediate UI feedback
      (job as unknown as Record<string, unknown>).viewCount = ((job as unknown as Record<string, unknown>).viewCount as number || 0) + 1;
    } catch {
      // ignore analytics failure
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
    const ip = getClientIp(req);
    const ipLimit = await rateLimit(`edit-job-ip:${ip}`, { limit: 30, windowMs: 15 * 60 * 1000 });
    if (!ipLimit.allowed) {
      return NextResponse.json({ message: "Too many requests — please slow down" }, { status: 429 });
    }

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

    if (update.experienceLevel !== undefined && update.experienceLevel !== "" && !EXPERIENCE_LEVELS.includes(update.experienceLevel as typeof EXPERIENCE_LEVELS[number])) {
      return NextResponse.json({ message: "Invalid experience level" }, { status: 400 });
    }

    if (update.salaryMin !== undefined && typeof update.salaryMin !== "number") {
      const n = Number(update.salaryMin);
      if (Number.isNaN(n)) return NextResponse.json({ message: "salaryMin must be a number" }, { status: 400 });
      update.salaryMin = n;
    }
    if (update.salaryMax !== undefined && typeof update.salaryMax !== "number") {
      const n = Number(update.salaryMax);
      if (Number.isNaN(n)) return NextResponse.json({ message: "salaryMax must be a number" }, { status: 400 });
      update.salaryMax = n;
    }
    if (update.salaryMin !== undefined && update.salaryMax !== undefined && (update.salaryMin as number) > (update.salaryMax as number)) {
      return NextResponse.json({ message: "salaryMin must be <= salaryMax" }, { status: 400 });
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
    // cascade: clean up orphans so no dangling applications/bookmarks leak past-deleted job data
    await Promise.all([
      Application.deleteMany({ jobId: id }),
      Bookmark.deleteMany({ jobId: id }),
    ]);
    return NextResponse.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to delete job" },
      { status: 500 }
    );
  }
}

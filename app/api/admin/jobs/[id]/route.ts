import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Job from "@/models/Job";
import { auth } from "@/auth";

const VALID_STATUSES = ["approved", "rejected", "closed"] as const;

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

    if (session.user.role !== "admin") {
      return NextResponse.json({ message: "Forbidden — admin only" }, { status: 403 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { message: "Status must be approved, rejected, or closed" },
        { status: 400 }
      );
    }

    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    // don't let an admin approve a job whose deadline has already passed —
    // the company should update the deadline first, then it goes back to pending
    if (status === "approved" && job.deadline.getTime() <= Date.now()) {
      return NextResponse.json(
        { message: "Cannot approve a job whose deadline has already passed" },
        { status: 400 }
      );
    }

    job.status = status;
    await job.save();

    return NextResponse.json({ job });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to update job status" },
      { status: 500 }
    );
  }
}

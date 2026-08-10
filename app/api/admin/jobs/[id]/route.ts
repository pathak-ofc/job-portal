import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Job from "@/models/Job";
import { auth } from "@/auth";

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

    if ((session.user as any).role !== "admin") {
      return NextResponse.json({ message: "Forbidden — admin only" }, { status: 403 });
    }

    const body = await req.json();
    const { status } = body;

    const validStatuses = ["approved", "rejected", "closed"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { message: "Status must be approved, rejected, or closed" },
        { status: 400 }
      );
    }

    const job = await Job.findByIdAndUpdate(id, { status }, { new: true });
    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update job status", error: (error as Error).message },
      { status: 500 }
    );
  }
}
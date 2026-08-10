import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Application from "@/models/Application";
import type { IJob } from "@/models/Job";
import { auth } from "@/auth";

const VALID_STATUSES = ["applied", "reviewed", "shortlisted", "rejected"] as const;

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

    if (session.user.role !== "company") {
      return NextResponse.json(
        { message: "Only companies can update application status" },
        { status: 403 }
      );
    }

    const application = await Application.findById(id).populate<{ jobId: IJob }>("jobId");
    if (!application) {
      return NextResponse.json(
        { message: "Application not found" },
        { status: 404 }
      );
    }

    // ownership check: does this company own the job this application is for?
    const job = application.jobId;
    if (!job || job.companyId.toString() !== session.user.id) {
      return NextResponse.json(
        { message: "Forbidden — not your job's application" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { message: "Invalid status value" },
        { status: 400 }
      );
    }

    application.status = status;
    await application.save();

    return NextResponse.json({ application });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to update application" },
      { status: 500 }
    );
  }
}

// DELETE /api/applications/[id] — student withdraws their own application
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

    if (session.user.role !== "student") {
      return NextResponse.json(
        { message: "Only students can withdraw an application" },
        { status: 403 }
      );
    }

    const application = await Application.findById(id);
    if (!application) {
      return NextResponse.json({ message: "Application not found" }, { status: 404 });
    }

    if (application.studentId.toString() !== session.user.id) {
      return NextResponse.json(
        { message: "Forbidden — not your application" },
        { status: 403 }
      );
    }

    await Application.findByIdAndDelete(id);
    return NextResponse.json({ message: "Application withdrawn" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to withdraw application" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDb from "@/lib/db";
import Application from "@/models/Application";
import type { IJob } from "@/models/Job";
import { auth } from "@/auth";
import { applicationStatusSchema, formatZodError } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(req);
    const ipLimit = await rateLimit(`app-status-ip:${ip}`, { limit: 40, windowMs: 15 * 60 * 1000 });
    if (!ipLimit.allowed) {
      return NextResponse.json({ message: "Too many requests — please slow down" }, { status: 429 });
    }

    await connectDb();
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ message: "Invalid application id" }, { status: 400 });
    }

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

    const raw = await req.json();
    const parsed = applicationStatusSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ message: formatZodError(parsed.error) }, { status: 400 });
    }
    const { status } = parsed.data;

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

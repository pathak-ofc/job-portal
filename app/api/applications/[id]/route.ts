import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Application from "@/models/Application";
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

    if ((session.user as any).role !== "company") {
      return NextResponse.json(
        { message: "Only companies can update application status" },
        { status: 403 }
      );
    }

    const application = await Application.findById(id).populate("jobId");
    if (!application) {
      return NextResponse.json(
        { message: "Application not found" },
        { status: 404 }
      );
    }

    // ownership check: does this company own the job this application is for?
    const job = application.jobId as any;
    if (job.companyId.toString() !== (session.user as any).id) {
      return NextResponse.json(
        { message: "Forbidden — not your job's application" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { status } = body;

    const validStatuses = ["applied", "reviewed", "shortlisted", "rejected"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { message: "Invalid status value" },
        { status: 400 }
      );
    }

    application.status = status;
    await application.save();

    return NextResponse.json({ application });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update application", error: (error as Error).message },
      { status: 500 }
    );
  }
}
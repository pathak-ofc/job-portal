import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Job from "@/models/Job";
import { auth } from "@/auth";

export async function GET() {
  try {
    await connectDb();

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as any).role !== "admin") {
      return NextResponse.json({ message: "Forbidden — admin only" }, { status: 403 });
    }

    const jobs = await Job.find({ status: "pending" })
      .populate("companyId", "name email")
      .sort({ createdAt: -1 });

    return NextResponse.json({ jobs });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch pending jobs", error: (error as Error).message },
      { status: 500 }
    );
  }
}
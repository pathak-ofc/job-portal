import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Job from "@/models/Job";

// GET /api/jobs — list all jobs
export async function GET() {
  try {
    await connectDb();
    const jobs = await Job.find().sort({ createdAt: -1 });
    return NextResponse.json({ jobs });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch jobs", error: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST /api/jobs — create a job
export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const body = await req.json();

    const { companyId, title, description, category, location, jobType, deadline } = body;

    if (!companyId || !title || !description || !category || !location || !jobType || !deadline) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const job = await Job.create(body);
    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create job", error: (error as Error).message },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Job from "@/models/Job";

// GET /api/jobs — public job listing, with search/filter
export async function GET(req: NextRequest) {
  try {
    await connectDb();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const location = searchParams.get("location");
    const jobType = searchParams.get("jobType");

    const query: any = { status: "approved" };

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }
    if (category) {
      query.category = category;
    }
    if (location) {
      query.location = location;
    }
    if (jobType) {
      query.jobType = jobType;
    }

    const jobs = await Job.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ jobs });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch jobs", error: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST /api/jobs — create a job (your existing code, unchanged)
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
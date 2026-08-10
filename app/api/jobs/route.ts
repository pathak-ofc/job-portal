import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Job from "@/models/Job";
import { auth } from "@/auth";

// GET /api/jobs — public job listing, with search/filter
// Pass ?mine=true while logged in as a company to get all of your own jobs
// (any status), instead of the public approved-only listing.
export async function GET(req: NextRequest) {
  try {
    await connectDb();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const location = searchParams.get("location");
    const jobType = searchParams.get("jobType");
    const mine = searchParams.get("mine") === "true";

    let query: any = { status: "approved" };

    if (mine) {
      const session = await auth();
      if (!session?.user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
      if ((session.user as any).role !== "company") {
        return NextResponse.json(
          { message: "Forbidden — companies only" },
          { status: 403 }
        );
      }
      query = { companyId: (session.user as any).id };
    }

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

// POST /api/jobs — create a job (company only, companyId derived from session)
export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as any).role !== "company") {
      return NextResponse.json(
        { message: "Only companies can post jobs" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, category, location, jobType, deadline, salaryRange } = body;

    if (!title || !description || !category || !location || !jobType || !deadline) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // companyId always comes from the session — never trust the client for this
    const job = await Job.create({
      companyId: (session.user as any).id,
      title,
      description,
      category,
      location,
      jobType,
      deadline,
      salaryRange: salaryRange || "",
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create job", error: (error as Error).message },
      { status: 500 }
    );
  }
}
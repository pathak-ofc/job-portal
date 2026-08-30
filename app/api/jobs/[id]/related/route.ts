import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDb from "@/lib/db";
import Job from "@/models/Job";

// GET /api/jobs/[id]/related — similar jobs by category/location for job detail sidebar
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ jobs: [] });
    }
    const job = await Job.findById(id).select("category location").lean();
    if (!job) return NextResponse.json({ jobs: [] });

    const typed = job as unknown as { category: string; location: string };
    const related = await Job.find({
      _id: { $ne: id },
      status: "approved",
      $or: [{ category: typed.category }, { location: typed.location }],
    })
      .select("title category location salaryRange jobType deadline viewCount")
      .sort({ viewCount: -1, createdAt: -1 })
      .limit(4)
      .lean();

    return NextResponse.json({ jobs: related });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ jobs: [] });
  }
}

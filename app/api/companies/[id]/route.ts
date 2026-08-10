import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDb from "@/lib/db";
import CompanyProfile from "@/models/CompanyProfile";
import Job from "@/models/Job";

// GET /api/companies/[id] — public company profile + their open (approved) jobs.
// [id] is the company's User._id (same id used as Job.companyId).
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ message: "Company not found" }, { status: 404 });
    }

    const profile = await CompanyProfile.findOne({ userId: id }).select(
      "companyName logoUrl website description verified createdAt"
    );
    if (!profile) {
      return NextResponse.json({ message: "Company not found" }, { status: 404 });
    }

    const jobs = await Job.find({ companyId: id, status: "approved" })
      .select("title category location salaryRange jobType deadline createdAt")
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({ company: profile, jobs });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to fetch company profile" },
      { status: 500 }
    );
  }
}

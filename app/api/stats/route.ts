import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Job from "@/models/Job";
import User from "@/models/User";

// GET /api/stats — public, aggregate counts for the homepage.
// No user-identifying data, safe to expose without auth.
export async function GET() {
  try {
    await connectDb();

    const [totalJobs, totalCompanies, totalStudents] = await Promise.all([
      Job.countDocuments({ status: "approved" }),
      User.countDocuments({ role: "company" }),
      User.countDocuments({ role: "student" }),
    ]);

    const res = NextResponse.json({ totalJobs, totalCompanies, totalStudents });
    // cache at edge for 60s, stale-while-revalidate 300s — stats don't need to be real-time
    res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

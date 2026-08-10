import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Job from "@/models/Job";
import { auth } from "@/auth";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

export async function GET(req: NextRequest) {
  try {
    await connectDb();

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ message: "Forbidden — admin only" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
    );

    const total = await Job.countDocuments({ status: "pending" });
    const jobs = await Job.find({ status: "pending" })
      .populate("companyId", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to fetch pending jobs" },
      { status: 500 }
    );
  }
}

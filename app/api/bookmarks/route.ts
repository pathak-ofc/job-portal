import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDb from "@/lib/db";
import Bookmark from "@/models/Bookmark";
import Job from "@/models/Job";
import { auth } from "@/auth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

// POST /api/bookmarks — toggle bookmark on/off
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const ipLimit = await rateLimit(`bookmark-ip:${ip}`, { limit: 40, windowMs: 15 * 60 * 1000 });
    if (!ipLimit.allowed) {
      return NextResponse.json({ message: "Too many requests — please slow down" }, { status: 429 });
    }

    await connectDb();

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "student") {
      return NextResponse.json(
        { message: "Only students can bookmark jobs" },
        { status: 403 }
      );
    }

    const userLimit = await rateLimit(`bookmark-user:${session.user.id}`, { limit: 30, windowMs: 15 * 60 * 1000 });
    if (!userLimit.allowed) {
      return NextResponse.json({ message: "Too many bookmarks — please try again later" }, { status: 429 });
    }

    const body = await req.json();
    const { jobId } = body;

    if (!jobId || !mongoose.isValidObjectId(jobId)) {
      return NextResponse.json({ message: "Valid jobId is required" }, { status: 400 });
    }

    const jobExists = await Job.exists({ _id: jobId });
    if (!jobExists) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    const studentId = session.user.id;

    const existing = await Bookmark.findOne({ studentId, jobId });

    if (existing) {
      // already bookmarked — remove it (toggle off)
      await Bookmark.findByIdAndDelete(existing._id);
      return NextResponse.json({ bookmarked: false });
    } else {
      // not bookmarked yet — add it (toggle on)
      await Bookmark.create({ studentId, jobId });
      return NextResponse.json({ bookmarked: true });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to toggle bookmark" },
      { status: 500 }
    );
  }
}

// GET /api/bookmarks — list the logged-in student's bookmarks
export async function GET(req: NextRequest) {
  try {
    await connectDb();

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "student") {
      return NextResponse.json(
        { message: "Only students can view bookmarks" },
        { status: 403 }
      );
    }

    const studentId = session.user.id;
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10) || 20));

    // Support single-job check for efficient isBookmarked without fetching all
    if (jobId) {
      if (!mongoose.isValidObjectId(jobId)) {
        return NextResponse.json({ message: "Valid jobId is required" }, { status: 400 });
      }
      const bookmark = await Bookmark.findOne({ studentId, jobId }).lean();
      return NextResponse.json({ bookmarked: !!bookmark });
    }

    const total = await Bookmark.countDocuments({ studentId });
    const bookmarks = await Bookmark.find({ studentId })
      .populate("jobId")
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    // Filter out bookmarks where job was deleted or is no longer approved
    // (prevents leaking pending/rejected jobs after they are reverted to pending on edit)
    const filtered = bookmarks.filter((b) => {
      const job = b.jobId as unknown as { _id?: string; status?: string } | null;
      return job && job._id;
    });

    return NextResponse.json({ bookmarks: filtered, pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to fetch bookmarks" },
      { status: 500 }
    );
  }
}

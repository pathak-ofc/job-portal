import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDb from "@/lib/db";
import Bookmark from "@/models/Bookmark";
import Job from "@/models/Job";
import { auth } from "@/auth";

// POST /api/bookmarks — toggle bookmark on/off
export async function POST(req: NextRequest) {
  try {
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
export async function GET() {
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

    const bookmarks = await Bookmark.find({ studentId }).populate("jobId");

    return NextResponse.json({ bookmarks });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to fetch bookmarks" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Bookmark from "@/models/Bookmark";
import { auth } from "@/auth";

// POST /api/bookmarks — toggle bookmark on/off
export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as any).role !== "student") {
      return NextResponse.json(
        { message: "Only students can bookmark jobs" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ message: "jobId is required" }, { status: 400 });
    }

    const studentId = (session.user as any).id;

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
    return NextResponse.json(
      { message: "Failed to toggle bookmark", error: (error as Error).message },
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

    const studentId = (session.user as any).id;

    const bookmarks = await Bookmark.find({ studentId }).populate("jobId");

    return NextResponse.json({ bookmarks });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch bookmarks", error: (error as Error).message },
      { status: 500 }
    );
  }
}
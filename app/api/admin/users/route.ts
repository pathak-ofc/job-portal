import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import User from "@/models/User";
import { auth } from "@/auth";

export async function GET() {
  try {
    await connectDb();

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as any).role !== "admin") {
      return NextResponse.json({ message: "Forbidden — admin only" }, { status: 403 });
    }

    const users = await User.find().sort({ createdAt: -1 });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch users", error: (error as Error).message },
      { status: 500 }
    );
  }
}
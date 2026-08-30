import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import StudentProfile from "@/models/StudentProfile";
import { auth } from "@/auth";
import { studentProfilePatchSchema, formatZodError } from "@/lib/validation";
import { isValidCloudinaryUrl } from "@/lib/cloudinary";

// GET /api/profile/student — get the logged-in student's profile
export async function GET() {
  try {
    await connectDb();

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "student") {
      return NextResponse.json(
        { message: "Forbidden — students only" },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    // profile is created at registration, but fall back to creating one
    // if it's somehow missing so this route never 404s on a valid student
    let profile = await StudentProfile.findOne({ userId });
    if (!profile) {
      profile = await StudentProfile.create({ userId });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PATCH /api/profile/student — update phone, bio, skills, resumeUrl
export async function PATCH(req: NextRequest) {
  try {
    await connectDb();

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "student") {
      return NextResponse.json(
        { message: "Forbidden — students only" },
        { status: 403 }
      );
    }

    const userId = session.user.id;
    const raw = await req.json();
    const parsed = studentProfilePatchSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ message: formatZodError(parsed.error) }, { status: 400 });
    }
    const { phone, bio, skills, resumeUrl } = parsed.data;

    if (resumeUrl && resumeUrl.length > 0 && !isValidCloudinaryUrl(resumeUrl)) {
      return NextResponse.json(
        { message: "resumeUrl must be a valid Cloudinary URL from this project" },
        { status: 400 }
      );
    }

    const update: Record<string, unknown> = {};
    if (phone !== undefined) update.phone = phone;
    if (bio !== undefined) update.bio = bio;
    if (skills !== undefined) update.skills = skills;
    if (resumeUrl !== undefined) update.resumeUrl = resumeUrl;

    const profile = await StudentProfile.findOneAndUpdate(
      { userId },
      { $set: update },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({ profile });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 }
    );
  }
}

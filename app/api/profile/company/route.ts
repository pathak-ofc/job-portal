import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import CompanyProfile from "@/models/CompanyProfile";
import { auth } from "@/auth";

// GET /api/profile/company — get the logged-in company's profile
export async function GET() {
  try {
    await connectDb();

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "company") {
      return NextResponse.json(
        { message: "Forbidden — companies only" },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    let profile = await CompanyProfile.findOne({ userId });
    if (!profile) {
      // fallback so this route never 404s on a valid company account
      profile = await CompanyProfile.create({
        userId,
        companyName: session.user.name || "Unnamed Company",
      });
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

// PATCH /api/profile/company — update companyName, logoUrl, website, description
export async function PATCH(req: NextRequest) {
  try {
    await connectDb();

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "company") {
      return NextResponse.json(
        { message: "Forbidden — companies only" },
        { status: 403 }
      );
    }

    const userId = session.user.id;
    const body = await req.json();

    // only allow these fields — never let the client set userId or verified
    const { companyName, logoUrl, website, description } = body;

    if (companyName !== undefined && (!companyName || !companyName.trim())) {
      return NextResponse.json({ message: "Company name cannot be empty" }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if (companyName !== undefined) update.companyName = companyName;
    if (logoUrl !== undefined) update.logoUrl = logoUrl;
    if (website !== undefined) update.website = website;
    if (description !== undefined) update.description = description;

    const profile = await CompanyProfile.findOneAndUpdate(
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

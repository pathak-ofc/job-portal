import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import CompanyProfile from "@/models/CompanyProfile";

// GET /api/companies — public list of companies with open jobs info
export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const pageSize = Math.min(20, Math.max(1, parseInt(searchParams.get("pageSize") || "12", 10) || 12));
    const search = searchParams.get("search");

    const query: Record<string, unknown> = {};
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.companyName = { $regex: escaped, $options: "i" };
    }

    const total = await CompanyProfile.countDocuments(query);
    const companies = await CompanyProfile.find(query)
      .select("userId companyName logoUrl website description verified industry size location")
      .sort({ verified: -1, createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    return NextResponse.json({
      companies,
      pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to fetch companies" }, { status: 500 });
  }
}

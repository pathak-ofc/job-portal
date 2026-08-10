import type { Metadata } from "next";
import connectDb from "@/lib/db";
import CompanyProfile from "@/models/CompanyProfile";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    await connectDb();
    const company = await CompanyProfile.findOne({ userId: id })
      .select("companyName description")
      .lean();

    if (!company) {
      return { title: "Company not found | NepJob" };
    }

    return {
      title: `${company.companyName} | NepJob`,
      description:
        company.description?.slice(0, 160) ||
        `View ${company.companyName}'s open positions on NepJob.`,
    };
  } catch {
    return { title: "Company | NepJob" };
  }
}

export default function CompanyProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}

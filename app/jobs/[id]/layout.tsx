import type { Metadata } from "next";
import connectDb from "@/lib/db";
import Job from "@/models/Job";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    await connectDb();
    const job = await Job.findById(id).select("title category location").lean();

    if (!job) {
      return { title: "Job not found | NepJob" };
    }

    return {
      title: `${job.title} | NepJob`,
      description: `${job.title} — ${job.category} position in ${job.location}. Apply now on NepJob.`,
    };
  } catch {
    return { title: "Job | NepJob" };
  }
}

export default function JobDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MapPin, Briefcase, Clock } from "lucide-react";
type Job = {
  _id: string;
  title: string;
  category: string;
  location: string;
  salaryRange?: string;
  jobType: string;
  deadline: string;
  viewCount?: number;
  isRemote?: boolean;
  experienceLevel?: string;
  applicantCount?: number;
  createdAt?: string;
};

function timeAgo(dateStr?: string) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function JobCard({ job, index = 0 }: { job: Job; index?: number }) {
  const jobTypeColors: Record<string, string> = {
    "full-time": "bg-primary text-white",
    "part-time": "bg-accent text-white",
    internship: "bg-primary-2 text-white",
  };

  const posted = timeAgo(job.createdAt);
  // eslint-disable-next-line react-hooks/purity -- isNew is derived from createdAt and current time, safe for UI badge
  const isNew = job.createdAt ? Date.now() - new Date(job.createdAt).getTime() < 3 * 24 * 60 * 60 * 1000 : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      whileHover={{ y: -3 }}
    >
      <Link
        href={`/jobs/${job._id}`}
        className="group relative block h-full rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/20"
      >
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <span className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bg border border-border text-text-muted group-hover:border-primary/20">
              <Briefcase size={16} />
            </span>
            <div>
              <h3 className="font-[family-name:var(--font-heading)] text-[15px] font-semibold leading-tight text-text line-clamp-2 group-hover:text-primary">
                {job.title}
              </h3>
              <p className="mt-1 text-xs font-medium text-text-muted">{job.category}</p>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize tracking-wide ${jobTypeColors[job.jobType] || "bg-text-muted text-white"}`}
          >
            {job.jobType}
          </span>
        </div>

        {/* Meta chips */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {isNew && <span className="rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">New</span>}
          {job.isRemote && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">Remote</span>}
          {job.experienceLevel && <span className="rounded-full bg-bg border border-border px-2 py-0.5 text-[11px] font-medium text-text-muted capitalize">{job.experienceLevel}</span>}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <MapPin size={12} />
            {job.location}
          </span>
          {job.salaryRange && (
            <span className="flex items-center gap-1.5">
              <Briefcase size={12} />
              {job.salaryRange}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <Clock size={12} />
            {posted ? `Posted ${posted}` : `Apply by ${new Date(job.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
          </span>
          <span className="flex items-center gap-2">
            {typeof job.viewCount === "number" && <span>{job.viewCount} views</span>}
            {typeof job.applicantCount === "number" && <span>• {job.applicantCount} applicants</span>}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
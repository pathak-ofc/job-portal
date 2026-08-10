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
};

export default function JobCard({ job, index = 0 }: { job: Job; index?: number }) {
  const jobTypeColors: Record<string, string> = {
    "full-time": "bg-primary/10 text-primary",
    "part-time": "bg-accent/10 text-accent",
    internship: "bg-primary-2/10 text-primary-2",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
    >
      <Link
        href={`/jobs/${job._id}`}
        className="block h-full rounded-2xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-text">
            {job.title}
          </h3>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
              jobTypeColors[job.jobType] || "bg-text-muted/10 text-text-muted"
            }`}
          >
            {job.jobType}
          </span>
        </div>

        <p className="mt-1 text-sm text-text-muted">{job.category}</p>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-text-muted">
          <span className="flex items-center gap-1.5">
            <MapPin size={14} />
            {job.location}
          </span>
          {job.salaryRange && (
            <span className="flex items-center gap-1.5">
              <Briefcase size={14} />
              {job.salaryRange}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Clock size={14} />
            {new Date(job.deadline).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
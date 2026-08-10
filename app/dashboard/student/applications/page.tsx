"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, FileText } from "lucide-react";

type Application = {
  _id: string;
  status: "applied" | "reviewed" | "shortlisted" | "rejected";
  resumeUrl: string;
  coverLetter: string;
  createdAt: string;
  jobId: {
    _id: string;
    title: string;
    location: string;
    jobType: string;
  } | null;
};

const statusStyles: Record<string, string> = {
  applied: "bg-text-muted/10 text-text-muted",
  reviewed: "bg-accent/10 text-accent",
  shortlisted: "bg-primary/10 text-primary",
  rejected: "bg-primary-2/10 text-primary-2",
};

export default function StudentApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/applications")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load applications");
        return res.json();
      })
      .then((data) => setApplications(data.applications || []))
      .catch(() => setError("Failed to load your applications"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text">
        My Applications
      </h1>
      <p className="mt-1 text-text-muted">
        Track the status of every job you&apos;ve applied to.
      </p>

      <div className="mt-6 space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-surface" />
          ))
        ) : error ? (
          <p className="text-sm text-primary-2">{error}</p>
        ) : applications.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-12 text-center">
            <p className="text-text">You haven&apos;t applied to any jobs yet.</p>
            <Link
              href="/jobs"
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              Browse jobs
            </Link>
          </div>
        ) : (
          applications.map((app, i) => (
            <motion.div
              key={app._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="rounded-2xl border border-border bg-surface p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  {app.jobId ? (
                    <Link
                      href={`/jobs/${app.jobId._id}`}
                      className="font-[family-name:var(--font-heading)] text-lg font-semibold text-text hover:text-primary"
                    >
                      {app.jobId.title}
                    </Link>
                  ) : (
                    <span className="font-[family-name:var(--font-heading)] text-lg font-semibold text-text-muted">
                      Job no longer available
                    </span>
                  )}
                  {app.jobId && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-text-muted">
                      <MapPin size={14} />
                      {app.jobId.location}
                      <span className="capitalize">· {app.jobId.jobType}</span>
                    </p>
                  )}
                </div>

                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize ${
                    statusStyles[app.status] || statusStyles.applied
                  }`}
                >
                  {app.status}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-sm text-text-muted">
                <span>
                  Applied{" "}
                  {new Date(app.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <a
                  href={app.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-medium text-primary hover:underline"
                >
                  <FileText size={14} />
                  Resume
                </a>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

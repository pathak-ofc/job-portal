"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Trash2, Pencil, X, Check, Eye, Calendar, Briefcase, TrendingUp } from "lucide-react";
import { toast } from "sonner";

type Job = {
  _id: string;
  title: string;
  category: string;
  location: string;
  salaryRange?: string;
  jobType: string;
  deadline: string;
  status: "pending" | "approved" | "rejected" | "closed";
  viewCount?: number;
  applicantCount?: number;
  isRemote?: boolean;
  experienceLevel?: string;
};

const statusStyles: Record<string, string> = {
  pending: "bg-accent/10 text-accent",
  approved: "bg-primary/10 text-primary",
  rejected: "bg-primary-2/10 text-primary-2",
  closed: "bg-text-muted/10 text-text-muted",
};

export default function CompanyJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const loadJobs = () => {
    fetch("/api/jobs?mine=true&pageSize=50")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load jobs");
        return res.json();
      })
      .then((data) => setJobs(data.jobs || []))
      .catch(() => toast.error("Failed to load your job posts"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      if (res.ok) {
        setJobs((prev) => prev.filter((j) => j._id !== id));
        toast.success("Job deleted");
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to delete job");
      }
    } catch {
      toast.error("Something went wrong deleting the job");
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  };

  const totals = {
    jobs: jobs.length,
    views: jobs.reduce((s, j) => s + (j.viewCount || 0), 0),
    applicants: jobs.reduce((s, j) => s + (j.applicantCount || 0), 0),
    pending: jobs.filter((j) => j.status === "pending").length,
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text">
            My Job Posts
          </h1>
          <p className="mt-1 text-text-muted">Track performance and manage the jobs you&apos;ve posted.</p>
        </div>
        <Link href="/dashboard/company/jobs/new" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-primary-hover">
          Post a job
        </Link>
      </div>

      {/* Analytics */}
      {!loading && jobs.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total jobs", value: totals.jobs, icon: Briefcase },
            { label: "Total views", value: totals.views, icon: Eye },
            { label: "Applicants", value: totals.applicants, icon: Users },
            { label: "Pending review", value: totals.pending, icon: TrendingUp },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-center gap-2 text-text-muted">
                  <Icon size={14} className="text-primary" />
                  <span className="text-xs">{c.label}</span>
                </div>
                <p className="mt-1 text-2xl font-bold text-text">{c.value}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-surface" />
          ))
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-12 text-center">
            <p className="text-text">You haven&apos;t posted any jobs yet.</p>
            <Link
              href="/dashboard/company/jobs/new"
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              Post your first job
            </Link>
          </div>
        ) : (
          jobs.map((job, i) => (
            <motion.div
              key={job._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="rounded-2xl border border-border bg-surface p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-text truncate">
                    {job.title}
                  </h3>
                  <p className="mt-1 text-sm text-text-muted">
                    {job.category} · {job.location} {job.isRemote && "• Remote"} {job.experienceLevel && `• ${job.experienceLevel}`}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-muted">
                    <span className="inline-flex items-center gap-1 rounded-full bg-bg border border-border px-2 py-1"><Eye size={12} /> {job.viewCount ?? 0} views</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-primary font-medium"><Users size={12} /> {job.applicantCount ?? 0} applicants</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-bg border border-border px-2 py-1 capitalize"><Briefcase size={12} /> {job.jobType}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-bg border border-border px-2 py-1"><Calendar size={12} /> {new Date(job.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize ${statusStyles[job.status] || statusStyles.pending}`}>{job.status}</span>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                <Link href={`/dashboard/company/jobs/${job._id}/applicants`} className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary hover:text-white">
                  <Users size={15} />
                  View applicants {job.applicantCount ? `(${job.applicantCount})` : ""}
                </Link>

                <div className="flex items-center gap-3">
                  {confirmId === job._id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-muted">Delete this job?</span>
                      <button
                        onClick={() => handleDelete(job._id)}
                        disabled={deletingId === job._id}
                        className="flex items-center gap-1 rounded-lg bg-primary-2 px-2.5 py-1 text-xs font-medium text-white disabled:opacity-60"
                      >
                        <Check size={12} />
                        {deletingId === job._id ? "Deleting..." : "Confirm"}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-text-muted"
                      >
                        <X size={12} />
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <Link
                        href={`/dashboard/company/jobs/${job._id}/edit`}
                        className="flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text"
                      >
                        <Pencil size={14} />
                        Edit
                      </Link>
                      <button
                        onClick={() => setConfirmId(job._id)}
                        className="flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-primary-2"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
      <AnimatePresence />
    </div>
  );
}

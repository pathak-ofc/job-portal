"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Trash2, Pencil, X, Check } from "lucide-react";
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

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text">
            My Job Posts
          </h1>
          <p className="mt-1 text-text-muted">Manage the jobs you&apos;ve posted.</p>
        </div>
        <Link
          href="/dashboard/company/jobs/new"
          className="rounded-xl bg-linear-to-r from-primary to-primary-2 px-5 py-2 text-sm font-medium text-white"
        >
          Post a job
        </Link>
      </div>

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
                <div>
                  <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-text">
                    {job.title}
                  </h3>
                  <p className="mt-1 text-sm text-text-muted">
                    {job.category} · {job.location}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize ${
                    statusStyles[job.status] || statusStyles.pending
                  }`}
                >
                  {job.status}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                <Link
                  href={`/dashboard/company/jobs/${job._id}/applicants`}
                  className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <Users size={15} />
                  View applicants
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

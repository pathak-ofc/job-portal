"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Users, Clock, Check, X } from "lucide-react";

type PendingJob = {
  _id: string;
  title: string;
  category: string;
  location: string;
  jobType: string;
  createdAt: string;
  companyId: { _id: string; name: string; email: string } | string;
};

export default function AdminOverviewPage() {
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>([]);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/jobs").then((res) => {
        if (!res.ok) throw new Error("Failed to load pending jobs");
        return res.json();
      }),
      fetch("/api/admin/users").then((res) => {
        if (!res.ok) throw new Error("Failed to load users");
        return res.json();
      }),
    ])
      .then(([jobsData, usersData]) => {
        setPendingJobs(jobsData.jobs || []);
        setTotalUsers((usersData.users || []).length);
      })
      .catch(() => setError("Failed to load dashboard data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (jobId: string, status: "approved" | "rejected") => {
    setActingId(jobId);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setPendingJobs((prev) => prev.filter((j) => j._id !== jobId));
      } else {
        const data = await res.json();
        setError(data.message || "Failed to update job status");
      }
    } catch {
      setError("Something went wrong updating the job");
    } finally {
      setActingId(null);
    }
  };

  const stats = [
    { label: "Total Users", value: totalUsers, icon: Users },
    { label: "Pending Jobs", value: pendingJobs.length, icon: Clock },
  ];

  return (
    <div>
      <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text">
        Admin Overview
      </h1>
      <p className="mt-1 text-text-muted">
        Review pending job postings and monitor platform activity.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-text">
                  {loading ? "—" : s.value}
                </p>
                <p className="text-sm text-text-muted">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="mt-8 font-[family-name:var(--font-heading)] text-lg font-semibold text-text">
        Pending Job Approvals
      </h2>

      <div className="mt-4 space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-surface" />
          ))
        ) : error ? (
          <p className="text-sm text-primary-2">{error}</p>
        ) : pendingJobs.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-12 text-center">
            <p className="text-text">No pending jobs — you&apos;re all caught up.</p>
          </div>
        ) : (
          pendingJobs.map((job, i) => {
            const company =
              typeof job.companyId === "string" ? null : job.companyId;
            return (
              <motion.div
                key={job._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="rounded-2xl border border-border bg-surface p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-lg font-semibold text-text">
                      <Briefcase size={16} className="text-text-muted" />
                      {job.title}
                    </h3>
                    <p className="mt-1 text-sm text-text-muted">
                      {job.category} · {job.location} ·{" "}
                      <span className="capitalize">{job.jobType}</span>
                    </p>
                    {company && (
                      <p className="mt-1 text-sm text-text-muted">
                        Posted by {company.name} ({company.email})
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAction(job._id, "approved")}
                      disabled={actingId === job._id}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                    >
                      <Check size={13} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(job._id, "rejected")}
                      disabled={actingId === job._id}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:text-primary-2 disabled:opacity-60"
                    >
                      <X size={13} />
                      Reject
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

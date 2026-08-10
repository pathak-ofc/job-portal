"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, ArrowLeft, Phone } from "lucide-react";
import { toast } from "sonner";

type StudentProfile = {
  bio?: string;
  skills?: string[];
  phone?: string;
};

type Application = {
  _id: string;
  status: "applied" | "reviewed" | "shortlisted" | "rejected";
  resumeUrl: string;
  coverLetter: string;
  createdAt: string;
  jobId: { _id: string; title: string } | string;
  studentId: { _id: string; name: string; email: string } | null;
  studentProfile?: StudentProfile | null;
};

const statusOptions = ["applied", "reviewed", "shortlisted", "rejected"];

const statusStyles: Record<string, string> = {
  applied: "bg-text-muted/10 text-text-muted",
  reviewed: "bg-accent/10 text-accent",
  shortlisted: "bg-primary/10 text-primary",
  rejected: "bg-primary-2/10 text-primary-2",
};

export default function JobApplicantsPage() {
  const { id } = useParams();

  const [applications, setApplications] = useState<Application[]>([]);
  const [jobTitle, setJobTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/applications?jobId=${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load applicants");
        return res.json();
      })
      .then((data) => {
        const forThisJob = (data.applications || []) as Application[];
        setApplications(forThisJob);
        const first = forThisJob[0]?.jobId;
        if (first && typeof first !== "string") setJobTitle(first.title);
      })
      .catch(() => toast.error("Failed to load applicants"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (appId: string, status: string) => {
    setUpdatingId(appId);
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        setApplications((prev) =>
          prev.map((a) => (a._id === appId ? { ...a, status: data.application.status } : a))
        );
        toast.success("Status updated");
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch {
      toast.error("Something went wrong updating status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <Link
        href="/dashboard/company/jobs"
        className="flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text"
      >
        <ArrowLeft size={14} />
        Back to my job posts
      </Link>

      <h1 className="mt-3 font-[family-name:var(--font-heading)] text-2xl font-bold text-text">
        Applicants{jobTitle ? ` — ${jobTitle}` : ""}
      </h1>
      <p className="mt-1 text-text-muted">Review and update the status of each applicant.</p>

      <div className="mt-6 space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-surface" />
          ))
        ) : applications.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-12 text-center">
            <p className="text-text">No applicants yet for this job.</p>
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
                  <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-text">
                    {app.studentId?.name || "Unknown applicant"}
                  </h3>
                  <p className="mt-1 text-sm text-text-muted">{app.studentId?.email}</p>
                  {app.studentProfile?.phone && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-text-muted">
                      <Phone size={13} />
                      {app.studentProfile.phone}
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

              {app.studentProfile?.bio && (
                <p className="mt-3 whitespace-pre-line text-sm text-text-muted">
                  {app.studentProfile.bio}
                </p>
              )}

              {app.studentProfile?.skills && app.studentProfile.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {app.studentProfile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {app.coverLetter && (
                <p className="mt-3 whitespace-pre-line border-t border-border pt-3 text-sm text-text">
                  {app.coverLetter}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                <a
                  href={app.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <FileText size={14} />
                  View resume
                </a>

                <select
                  value={app.status}
                  disabled={updatingId === app._id}
                  onChange={(e) => handleStatusChange(app._id, e.target.value)}
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text capitalize outline-none focus:border-primary disabled:opacity-60"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s} className="capitalize">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

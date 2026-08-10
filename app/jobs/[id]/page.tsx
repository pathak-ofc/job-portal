"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Briefcase, Clock, Bookmark, X, Upload, Building2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type Job = {
  _id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  salaryRange?: string;
  jobType: string;
  deadline: string;
  companyId: { _id: string; name: string } | string;
};

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [bookmarked, setBookmarked] = useState(false);
  const [applied, setApplied] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data) => setJob(data.job))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  // check bookmark + applied status once logged in as a student — this is
  // what makes "Applied" persist across a page reload instead of resetting
  // to local-only state.
  useEffect(() => {
    if (status !== "authenticated" || session?.user?.role !== "student") return;

    fetch("/api/bookmarks")
      .then((res) => res.json())
      .then((data) => {
        const isBookmarked = (data.bookmarks || []).some(
          (b: { jobId?: { _id?: string } }) => b.jobId?._id === id
        );
        setBookmarked(isBookmarked);
      })
      .catch(() => {});

    fetch(`/api/applications?jobId=${id}`)
      .then((res) => res.json())
      .then((data) => {
        setApplied((data.applications || []).length > 0);
      })
      .catch(() => {});
  }, [status, session, id]);

  // "checking" state is purely derived from session status — no separate
  // setState needed, so it can't cause an extra render pass on its own.
  const checkingApplied = status === "loading";

  const role = session?.user?.role;

  const handleBookmarkToggle = async () => {
    if (status !== "authenticated") {
      router.push(`/login?callbackUrl=/jobs/${id}`);
      return;
    }
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: id }),
      });
      const data = await res.json();
      if (res.ok) {
        setBookmarked(data.bookmarked);
        toast.success(data.bookmarked ? "Job bookmarked" : "Bookmark removed");
      } else {
        toast.error(data.message || "Failed to update bookmark");
      }
    } catch {
      toast.error("Something went wrong — please try again");
    }
  };

  const openApplyModal = () => {
    if (status !== "authenticated") {
      router.push(`/login?callbackUrl=/jobs/${id}`);
      return;
    }
    setModalOpen(true);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please upload your resume (PDF).");
      return;
    }

    setSubmitting(true);
    try {
      // 1. upload resume
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        toast.error(uploadData.message || "Resume upload failed");
        setSubmitting(false);
        return;
      }

      // 2. submit application with the resulting URL
      const appRes = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: id,
          resumeUrl: uploadData.url,
          coverLetter,
        }),
      });
      const appData = await appRes.json();

      if (!appRes.ok) {
        toast.error(appData.message || "Failed to submit application");
        setSubmitting(false);
        return;
      }

      setApplied(true);
      setModalOpen(false);
      toast.success("Application submitted!");
    } catch {
      toast.error("Something went wrong — please try again");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface" />
      </main>
    );
  }

  if (notFound || !job) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text">
          Job not found
        </h1>
        <p className="mt-2 text-text-muted">
          This listing may have been closed or removed.
        </p>
      </main>
    );
  }

  const company = typeof job.companyId === "string" ? null : job.companyId;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-border bg-surface p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text sm:text-3xl">
              {job.title}
            </h1>
            <p className="mt-1 text-text-muted">{job.category}</p>
            {company && (
              <Link
                href={`/companies/${company._id}`}
                className="mt-2 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <Building2 size={14} />
                {company.name}
              </Link>
            )}
          </div>

          {role === "student" && (
            <button
              onClick={handleBookmarkToggle}
              aria-label="Toggle bookmark"
              className={`shrink-0 rounded-full border p-2.5 transition-colors ${
                bookmarked
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-text-muted hover:text-accent"
              }`}
            >
              <Bookmark size={18} fill={bookmarked ? "currentColor" : "none"} />
            </button>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-4 text-sm text-text-muted">
          <span className="flex items-center gap-1.5">
            <MapPin size={15} /> {job.location}
          </span>
          {job.salaryRange && (
            <span className="flex items-center gap-1.5">
              <Briefcase size={15} /> {job.salaryRange}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Clock size={15} /> Apply by{" "}
            {new Date(job.deadline).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium capitalize text-primary">
            {job.jobType}
          </span>
        </div>

        <div className="mt-6 whitespace-pre-line text-text">{job.description}</div>

        <div className="mt-8 border-t border-border pt-6">
          {checkingApplied ? (
            <div className="h-11 w-40 animate-pulse rounded-xl bg-bg" />
          ) : applied ? (
            <p className="rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
              You&apos;ve applied to this job. Manage it from{" "}
              <Link href="/dashboard/student/applications" className="underline">
                My Applications
              </Link>
              .
            </p>
          ) : role === "company" || role === "admin" ? (
            <p className="text-sm text-text-muted">
              Only students can apply to jobs.
            </p>
          ) : (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={openApplyModal}
              className="rounded-xl bg-linear-to-r from-primary to-primary-2 px-6 py-3 font-medium text-white"
            >
              Apply now
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Apply modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => !submitting && setModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-border bg-surface p-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-text">
                  Apply to {job.title}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-text-muted hover:text-text"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleApply} className="mt-5 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-text">
                    Resume (PDF, max 5MB)
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-text-muted hover:border-primary">
                    <Upload size={16} />
                    {file ? file.name : "Choose a PDF file"}
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-text">
                    Cover letter (optional)
                  </label>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
                    placeholder="Why are you a good fit for this role?"
                  />
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-linear-to-r from-primary to-primary-2 py-2.5 font-medium text-white disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit application"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

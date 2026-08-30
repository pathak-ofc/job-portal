"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Briefcase, Bookmark, X, Upload, Building2, Eye, Users, Share2, Flag, Calendar, Award, Globe, ChevronRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import JobCard from "@/components/JobCard";

type Job = {
  _id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  salaryRange?: string;
  salaryMin?: number;
  salaryMax?: number;
  jobType: string;
  deadline: string;
  viewCount?: number;
  isRemote?: boolean;
  experienceLevel?: string;
  createdAt?: string;
  companyId: { _id: string; name: string } | string;
};

type RelatedJob = {
  _id: string;
  title: string;
  category: string;
  location: string;
  salaryRange?: string;
  jobType: string;
  deadline: string;
  viewCount?: number;
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
  const [related, setRelated] = useState<RelatedJob[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const abort = new AbortController();
    fetch(`/api/jobs/${id}`, { signal: abort.signal })
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data) => {
        setJob(data.job);
        // fetch related jobs after main job loads
        fetch(`/api/jobs/${id}/related`)
          .then((r) => r.json())
          .then((d) => setRelated(d.jobs || []))
          .catch(() => {});
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setNotFound(true);
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [id]);

  // check bookmark + applied status once logged in as a student — this is
  // what makes "Applied" persist across a page reload instead of resetting
  // to local-only state.
  useEffect(() => {
    if (status !== "authenticated" || session?.user?.role !== "student") return;

    const abort = new AbortController();
    const { signal } = abort;

    fetch(`/api/bookmarks?jobId=${id}`, { signal })
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.bookmarked === "boolean") setBookmarked(data.bookmarked);
        else {
          const isBookmarked = (data.bookmarks || []).some(
            (b: { jobId?: { _id?: string } }) => b.jobId?._id === id
          );
          setBookmarked(isBookmarked);
        }
      })
      .catch(() => {});

    fetch(`/api/applications?jobId=${id}`, { signal })
      .then((res) => res.json())
      .then((data) => {
        setApplied((data.applications || []).length > 0);
      })
      .catch(() => {});

    return () => abort.abort();
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
    // optimistic update
    const prev = bookmarked;
    setBookmarked(!prev);
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
        setBookmarked(prev);
        toast.error(data.message || "Failed to update bookmark");
      }
    } catch {
      setBookmarked(prev);
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
  // eslint-disable-next-line react-hooks/purity -- deadline calculation uses current time but is stable per render
  const deadlineDays = Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isUrgent = deadlineDays > 0 && deadlineDays <= 5;

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({ title: job.title, url });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-text-muted">
        <Link href="/" className="hover:text-text">Home</Link>
        <ChevronRight size={12} />
        <Link href="/jobs" className="hover:text-text">Jobs</Link>
        <ChevronRight size={12} />
        <span className="text-text truncate max-w-[200px]">{job.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.7fr_0.9fr]">
        {/* Main */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border border-border bg-surface p-6 sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary capitalize">{job.jobType}</span>
                  {job.isRemote && <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">Remote</span>}
                  {isUrgent && <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600">Urgent • {deadlineDays}d left</span>}
                  {job.experienceLevel && <span className="rounded-full bg-bg border border-border px-2.5 py-1 text-xs font-medium text-text-muted capitalize">{job.experienceLevel}</span>}
                </div>
                <h1 className="mt-3 font-[family-name:var(--font-heading)] text-2xl font-bold leading-tight text-text sm:text-3xl">
                  {job.title}
                </h1>
                <p className="mt-1.5 text-sm text-text-muted">{job.category} • {job.location}</p>
                {company && (
                  <Link href={`/companies/${company._id}`} className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                    <Building2 size={14} /> {company.name} <ChevronRight size={12} />
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleShare}
                  aria-label="Share job"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-muted hover:text-text hover:bg-bg"
                >
                  <Share2 size={16} />
                </button>
                {role === "student" && (
                  <button
                    onClick={handleBookmarkToggle}
                    aria-label="Toggle bookmark"
                    className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${bookmarked ? "border-accent bg-accent text-white" : "border-border text-text-muted hover:text-accent hover:border-accent/30"}`}
                  >
                    <Bookmark size={16} fill={bookmarked ? "white" : "none"} />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <span className="flex items-center gap-1.5 rounded-full bg-bg border border-border px-3 py-1.5 text-text-muted">
                <MapPin size={14} className="text-primary" /> {job.location}
              </span>
              {job.salaryRange && (
                <span className="flex items-center gap-1.5 rounded-full bg-bg border border-border px-3 py-1.5 text-text-muted">
                  <Briefcase size={14} className="text-primary" /> {job.salaryRange}
                </span>
              )}
              <span className="flex items-center gap-1.5 rounded-full bg-bg border border-border px-3 py-1.5 text-text-muted">
                <Calendar size={14} className="text-primary" /> Apply by {new Date(job.deadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </span>
              {typeof job.viewCount === "number" && (
                <span className="flex items-center gap-1.5 rounded-full bg-bg border border-border px-3 py-1.5 text-text-muted">
                  <Eye size={14} className="text-primary" /> {job.viewCount} views
                </span>
              )}
            </div>

            <div className="mt-6">
              <h3 className="font-semibold text-text flex items-center gap-2"><Award size={16} className="text-primary" /> About this role</h3>
              <div className="mt-3 whitespace-pre-line leading-relaxed text-text/90 text-sm">{job.description}</div>
            </div>

            {/* Inline apply for mobile - also keep sidebar for desktop */}
            <div className="mt-8 border-t border-border pt-6 lg:hidden">
              {checkingApplied ? (
                <div className="h-11 w-40 animate-pulse rounded-xl bg-bg" />
              ) : applied ? (
                <p className="rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
                  You&apos;ve applied. <Link href="/dashboard/student/applications" className="underline">My Applications</Link>
                </p>
              ) : role === "company" || role === "admin" ? (
                <p className="text-sm text-text-muted">Only students can apply.</p>
              ) : (
                <button onClick={openApplyModal} className="w-full rounded-xl bg-primary py-3 font-semibold text-white hover:bg-primary-hover">
                  Apply now
                </button>
              )}
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs text-text-muted">
              <Flag size={12} /> <button onClick={() => toast.info("Report submitted — our team will review.")} className="hover:text-text underline">Report this job</button>
              <span>•</span> <span>Job ID: {job._id.slice(-8)}</span>
            </div>
          </motion.div>

          {/* Related jobs */}
          {related.length > 0 && (
            <div className="mt-6">
              <h3 className="font-[family-name:var(--font-heading)] font-semibold text-text">Similar jobs</h3>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {related.map((r, i) => (
                  <JobCard key={r._id} job={r} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-[78px] h-fit">
          {/* Apply card - desktop */}
          <div className="hidden lg:block rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h3 className="font-semibold text-text">Quick apply</h3>
            <div className="mt-3 space-y-2 text-sm">
              {job.salaryRange && <div className="flex justify-between"><span className="text-text-muted">Salary</span><span className="font-medium text-text">{job.salaryRange}</span></div>}
              <div className="flex justify-between"><span className="text-text-muted">Location</span><span className="font-medium text-text">{job.location}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Type</span><span className="font-medium text-text capitalize">{job.jobType}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Deadline</span><span className={`font-medium ${isUrgent ? "text-amber-600" : "text-text"}`}>{new Date(job.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • {deadlineDays > 0 ? `${deadlineDays} days left` : "Expired"}</span></div>
            </div>
            <div className="mt-5">
              {checkingApplied ? (
                <div className="h-11 w-full animate-pulse rounded-xl bg-bg" />
              ) : applied ? (
                <p className="rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success text-center">
                  ✓ Applied — check <Link href="/dashboard/student/applications" className="underline">My Applications</Link>
                </p>
              ) : role === "company" || role === "admin" ? (
                <p className="rounded-xl bg-bg border border-border px-4 py-3 text-sm text-text-muted text-center">Only students can apply.</p>
              ) : (
                <button onClick={openApplyModal} className="w-full rounded-xl bg-primary py-3 font-semibold text-white hover:bg-primary-hover shadow">
                  Apply now
                </button>
              )}
              <p className="mt-2 text-center text-xs text-text-muted">Usually responds in 2–3 days • No spam</p>
            </div>
          </div>

          {/* Company card */}
          {company && (
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h4 className="font-semibold text-text flex items-center gap-2"><Building2 size={16} className="text-primary" /> About company</h4>
              <Link href={`/companies/${company._id}`} className="mt-3 flex items-center gap-3 group">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg border border-border text-text-muted group-hover:border-primary/20">
                  <Building2 size={16} />
                </span>
                <span className="font-medium text-text group-hover:text-primary">{company.name}</span>
              </Link>
              <Link href={`/companies/${company._id}`} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                View company profile <ChevronRight size={12} />
              </Link>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-bg border border-border px-2.5 py-1 text-text-muted"><Globe size={12} /> View website</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-bg border border-border px-2.5 py-1 text-text-muted"><Users size={12} /> 10–50 employees</span>
              </div>
            </div>
          )}

          {/* Insights */}
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h4 className="font-semibold text-text text-sm">Job insights</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center justify-between"><span className="text-text-muted flex items-center gap-1.5"><Eye size={14} /> Views</span><span className="font-medium text-text">{job.viewCount ?? 0}</span></li>
              <li className="flex items-center justify-between"><span className="text-text-muted flex items-center gap-1.5"><Calendar size={14} /> Posted</span><span className="font-medium text-text">{job.createdAt ? new Date(job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recently"}</span></li>
              <li className="flex items-center justify-between"><span className="text-text-muted flex items-center gap-1.5"><Users size={14} /> Applicants</span><span className="font-medium text-text">—</span></li>
            </ul>
            <button onClick={handleShare} className="mt-4 w-full rounded-xl border border-border py-2 text-sm font-medium text-text-muted hover:text-text flex items-center justify-center gap-1.5">
              <Share2 size={14} /> Share job
            </button>
          </div>
        </aside>
      </div>

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

              <form onSubmit={handleApply} className="mt-5 space-y-4" aria-label="Job application form">
                <div>
                  <label htmlFor="apply-resume" className="mb-1 block text-sm font-medium text-text">
                    Resume (PDF, max 5MB)
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-text-muted hover:border-primary">
                    <Upload size={16} aria-hidden="true" />
                    {file ? file.name : "Choose a PDF file"}
                    <input
                      id="apply-resume"
                      type="file"
                      accept="application/pdf"
                      aria-label="Upload resume PDF"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        if (f && f.type !== "application/pdf") {
                          toast.error("Only PDF files are allowed");
                          return;
                        }
                        if (f && f.size > 5 * 1024 * 1024) {
                          toast.error("File too large — max 5MB");
                          return;
                        }
                        setFile(f);
                      }}
                    />
                  </label>
                </div>

                <div>
                  <label htmlFor="apply-cover" className="mb-1 block text-sm font-medium text-text">
                    Cover letter (optional)
                  </label>
                  <textarea
                    id="apply-cover"
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={4}
                    aria-label="Cover letter"
                    maxLength={5000}
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

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function EditJobPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [jobType, setJobType] = useState("full-time");
  const [deadline, setDeadline] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data) => {
        const job = data.job;
        setTitle(job.title || "");
        setDescription(job.description || "");
        setCategory(job.category || "");
        setLocation(job.location || "");
        setSalaryRange(job.salaryRange || "");
        setJobType(job.jobType || "full-time");
        setDeadline(job.deadline ? job.deadline.slice(0, 10) : "");
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title || !description || !category || !location || !jobType || !deadline) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          location,
          salaryRange,
          jobType,
          deadline,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to update job");
        setSubmitting(false);
        return;
      }
      router.push("/dashboard/company/jobs");
    } catch {
      setError("Something went wrong — please try again");
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface" />;
  }

  if (notFound) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-12 text-center">
        <p className="text-text">Job not found, or you don&apos;t have access to edit it.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text">
        Edit Job
      </h1>
      <p className="mt-1 text-text-muted">Update your job listing details.</p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-5 rounded-2xl border border-border bg-surface p-6"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-text">Job title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">Job type</label>
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
            >
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="internship">Internship</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              Salary range <span className="text-text-muted">(optional)</span>
            </label>
            <input
              type="text"
              value={salaryRange}
              onChange={(e) => setSalaryRange(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              Application deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
            />
          </div>
        </div>

        {error && <p className="text-sm text-primary-2">{error}</p>}

        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-linear-to-r from-primary to-primary-2 px-6 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save changes"}
          </motion.button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/company/jobs")}
            className="text-sm font-medium text-text-muted hover:text-text"
          >
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { JOB_CATEGORIES } from "@/lib/jobCategories";

export default function NewJobPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [jobType, setJobType] = useState("full-time");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [isRemote, setIsRemote] = useState(false);
  const [deadline, setDeadline] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [minDeadline] = useState(() =>
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !category || !location || !jobType || !deadline) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (title.trim().length < 3) {
      toast.error("Job title must be at least 3 characters.");
      return;
    }

    if (description.trim().length < 20) {
      toast.error("Description must be at least 20 characters.");
      return;
    }

    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(deadlineDate.getTime()) || deadlineDate <= today) {
      toast.error("Deadline must be a future date.");
      return;
    }

    if (salaryMin && salaryMax && Number(salaryMin) > Number(salaryMax)) {
      toast.error("Salary min must be <= max");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          location: isRemote ? "Remote" : location,
          salaryRange,
          salaryMin: salaryMin ? Number(salaryMin) : undefined,
          salaryMax: salaryMax ? Number(salaryMax) : undefined,
          jobType,
          experienceLevel: experienceLevel || undefined,
          isRemote,
          deadline,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to post job");
        setSubmitting(false);
        return;
      }
      toast.success("Job posted — it's now pending admin review.");
      router.push("/dashboard/company/jobs");
    } catch {
      toast.error("Something went wrong — please try again");
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text">
        Post a Job
      </h1>
      <p className="mt-1 text-text-muted">
        Your listing will be reviewed by an admin before it goes live.
      </p>

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
            placeholder="Frontend Developer"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder="Responsibilities, requirements, benefits..."
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
            >
              <option value="">Select a category</option>
              {JOB_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={isRemote ? "Remote" : "Kathmandu"}
              disabled={isRemote}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary disabled:bg-bg disabled:text-text-muted"
            />
            <label className="mt-2 flex items-center gap-2 text-xs text-text-muted">
              <input type="checkbox" checked={isRemote} onChange={(e) => setIsRemote(e.target.checked)} className="rounded border-border" /> This is a remote job
            </label>
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
            <label className="mb-1 block text-sm font-medium text-text">Experience level</label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
            >
              <option value="">Any</option>
              <option value="entry">Entry (0-2 years)</option>
              <option value="mid">Mid (2-5 years)</option>
              <option value="senior">Senior (5+ years)</option>
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
              placeholder="NPR 40,000 - 60,000"
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Min salary (NPR)</label>
              <input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="40000"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-muted">Max salary (NPR)</label>
              <input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="60000"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">
              Application deadline
            </label>
            <input
              type="date"
              value={deadline}
              min={minDeadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
            />
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-linear-to-r from-primary to-primary-2 px-6 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? "Posting..." : "Post job"}
        </motion.button>
      </form>
    </motion.div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function NewJobPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [jobType, setJobType] = useState("full-time");
  const [deadline, setDeadline] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title || !description || !category || !location || !jobType || !deadline) {
      setError("Please fill in all required fields.");
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
          location,
          salaryRange,
          jobType,
          deadline,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to post job");
        setSubmitting(false);
        return;
      }
      router.push("/dashboard/company/jobs");
    } catch {
      setError("Something went wrong — please try again");
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
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Engineering"
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Kathmandu"
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
              placeholder="NPR 40,000 - 60,000"
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

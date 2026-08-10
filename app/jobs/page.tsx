"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import JobCard from "@/components/JobCard";

type Job = {
  _id: string;
  title: string;
  category: string;
  location: string;
  salaryRange?: string;
  jobType: string;
  deadline: string;
};

function JobsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [jobType, setJobType] = useState(searchParams.get("jobType") || "");

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (location) params.set("location", location);
    if (jobType) params.set("jobType", jobType);

    fetch(`/api/jobs?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setJobs(data.jobs || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  };

  // initial load, and whenever the URL's own params change (e.g. coming from homepage)
  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (location) params.set("location", location);
    if (jobType) params.set("jobType", jobType);
    router.push(`/jobs?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setLocation("");
    setJobType("");
    router.push("/jobs");
  };

  const hasActiveFilters = search || category || location || jobType;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-text">
        Browse Jobs
      </h1>
      <p className="mt-1 text-text-muted">
        {loading ? "Searching..." : `${jobs.length} job${jobs.length !== 1 ? "s" : ""} found`}
      </p>

      {/* Filter bar */}
      <form
        onSubmit={handleFilter}
        className="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 lg:flex-row lg:items-center"
      >
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border px-3 py-2">
          <Search size={16} className="shrink-0 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Job title..."
            className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
          />
        </div>

        <select
          value={jobType}
          onChange={(e) => setJobType(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text outline-none"
        >
          <option value="">All types</option>
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="internship">Internship</option>
        </select>

        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text outline-none placeholder:text-text-muted lg:w-40"
        />

        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category"
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text outline-none placeholder:text-text-muted lg:w-40"
        />

        <button
          type="submit"
          className="flex items-center justify-center gap-1.5 rounded-xl bg-linear-to-r from-primary to-primary-2 px-5 py-2 text-sm font-medium text-white"
        >
          <SlidersHorizontal size={14} />
          Apply
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-medium text-text-muted hover:text-primary-2"
          >
            Clear
          </button>
        )}
      </form>

      {/* Results */}
      <div className="mt-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-2xl border border-border bg-surface"
              />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-border bg-surface p-12 text-center"
          >
            <p className="text-text">No jobs match your search.</p>
            <p className="mt-1 text-sm text-text-muted">
              Try a different keyword or clear your filters.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job, i) => (
              <JobCard key={job._id} job={job} index={i} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={null}>
      <JobsContent />
    </Suspense>
  );
}
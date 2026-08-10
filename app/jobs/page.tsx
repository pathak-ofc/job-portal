"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import JobCard from "@/components/JobCard";
import { JOB_CATEGORIES } from "@/lib/jobCategories";

type Job = {
  _id: string;
  title: string;
  category: string;
  location: string;
  salaryRange?: string;
  jobType: string;
  deadline: string;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

function JobsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [jobType, setJobType] = useState(searchParams.get("jobType") || "");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchJobs = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (location) params.set("location", location);
    if (jobType) params.set("jobType", jobType);
    params.set("page", String(page));

    fetch(`/api/jobs?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setJobs(data.jobs || []);
        setPagination(data.pagination || null);
      })
      .catch(() => {
        setJobs([]);
        setPagination(null);
      })
      .finally(() => setLoading(false));
  };

  // initial load, and whenever the URL's own params change (e.g. coming from homepage,
  // changing a filter, or navigating to a different page)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: show a loading skeleton immediately when search params change
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const buildParams = (overridePage?: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (location) params.set("location", location);
    if (jobType) params.set("jobType", jobType);
    if (overridePage && overridePage > 1) params.set("page", String(overridePage));
    return params;
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    // changing filters always resets back to page 1
    router.push(`/jobs?${buildParams().toString()}`);
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setLocation("");
    setJobType("");
    router.push("/jobs");
  };

  const goToPage = (targetPage: number) => {
    router.push(`/jobs?${buildParams(targetPage).toString()}`);
  };

  const hasActiveFilters = search || category || location || jobType;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-text">
        Browse Jobs
      </h1>
      <p className="mt-1 text-text-muted">
        {loading
          ? "Searching..."
          : `${pagination?.total ?? jobs.length} job${(pagination?.total ?? jobs.length) !== 1 ? "s" : ""} found`}
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

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text outline-none lg:w-48"
        >
          <option value="">All categories</option>
          {JOB_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

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
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job, i) => (
                <JobCard key={job._id} job={job} index={i} />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-muted hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={15} />
                  Prev
                </button>
                <span className="px-2 text-sm text-text-muted">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= pagination.totalPages}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-muted hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </>
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

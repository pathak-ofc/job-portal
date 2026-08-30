"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, Bookmark, Filter, ArrowUpDown, MapPin, Briefcase } from "lucide-react";
import JobCard from "@/components/JobCard";
import { JOB_CATEGORIES } from "@/lib/jobCategories";
import { toast } from "sonner";

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
  const [isRemote, setIsRemote] = useState(searchParams.get("isRemote") === "true");
  const [experienceLevel, setExperienceLevel] = useState(searchParams.get("experienceLevel") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const abort = new AbortController();
    const params = new URLSearchParams(searchParams.toString());
    // ensure page is numeric
    if (!params.get("page")) params.set("page", String(page));

    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: show loading skeleton immediately when search params change
    setLoading(true);
    fetch(`/api/jobs?${params.toString()}`, { signal: abort.signal })
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data) => {
        setJobs(data.jobs || []);
        setPagination(data.pagination || null);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setJobs([]);
        setPagination(null);
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });

    return () => abort.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const buildParams = (overridePage?: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (location) params.set("location", location);
    if (jobType) params.set("jobType", jobType);
    if (isRemote) params.set("isRemote", "true");
    if (experienceLevel) params.set("experienceLevel", experienceLevel);
    if (sort && sort !== "newest") params.set("sort", sort);
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
    setIsRemote(false);
    setExperienceLevel("");
    setSort("newest");
    router.push("/jobs");
  };

  const handleSaveSearch = () => {
    const params = buildParams().toString();
    const saved = JSON.parse(localStorage.getItem("savedSearches") || "[]");
    saved.unshift({ query: params || "all", createdAt: new Date().toISOString() });
    localStorage.setItem("savedSearches", JSON.stringify(saved.slice(0, 5)));
    toast.success("Search saved — we'll remind you when new jobs match!");
  };

  const goToPage = (targetPage: number) => {
    router.push(`/jobs?${buildParams(targetPage).toString()}`);
  };

  const hasActiveFilters = search || category || location || jobType || isRemote || experienceLevel || sort !== "newest";

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight text-text">
            Browse Jobs
          </h1>
          <p className="mt-1 text-sm text-text-muted flex items-center gap-2">
            <Briefcase size={14} className="text-primary" />
            {loading ? "Searching..." : `${pagination?.total ?? jobs.length} job${(pagination?.total ?? jobs.length) !== 1 ? "s" : ""} found`}
            {!loading && hasActiveFilters && <span className="hidden sm:inline">• Filters active</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSaveSearch}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text-muted hover:text-text"
          >
            <Bookmark size={14} /> Save search
          </button>
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-text-muted">
            <Filter size={12} /> {jobs.length} shown
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        {/* Sidebar filters */}
        <aside className="h-fit lg:sticky lg:top-[80px]">
          <form onSubmit={handleFilter} aria-label="Filter jobs" className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="font-semibold text-text flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-primary" /> Filters
            </h3>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="filter-search" className="mb-1 block text-xs font-medium text-text-muted">
                  Keyword
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2">
                  <Search size={14} className="text-text-muted" />
                  <input
                    id="filter-search"
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Title, skill, company"
                    className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="filter-location" className="mb-1 block text-xs font-medium text-text-muted">
                  Location
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2">
                  <MapPin size={14} className="text-text-muted" />
                  <input
                    id="filter-location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Kathmandu, Remote"
                    className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
                  />
                </div>
                <label className="mt-2 flex items-center gap-2 text-xs text-text-muted">
                  <input type="checkbox" checked={isRemote} onChange={(e) => setIsRemote(e.target.checked)} className="rounded border-border" /> Remote only
                </label>
              </div>

              <div>
                <label htmlFor="filter-category" className="mb-1 block text-xs font-medium text-text-muted">
                  Category
                </label>
                <select
                  id="filter-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-text outline-none"
                >
                  <option value="">All categories</option>
                  {JOB_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="filter-jobType" className="mb-1 block text-xs font-medium text-text-muted">
                    Job Type
                  </label>
                  <select
                    id="filter-jobType"
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-text outline-none"
                  >
                    <option value="">All</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="filter-exp" className="mb-1 block text-xs font-medium text-text-muted">
                    Experience
                  </label>
                  <select
                    id="filter-exp"
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-text outline-none"
                  >
                    <option value="">Any</option>
                    <option value="entry">Entry</option>
                    <option value="mid">Mid</option>
                    <option value="senior">Senior</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="filter-sort" className="mb-1 block text-xs font-medium text-text-muted">
                  Sort by
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2">
                  <ArrowUpDown size={14} className="text-text-muted" />
                  <select
                    id="filter-sort"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="w-full bg-transparent text-sm text-text outline-none"
                  >
                    <option value="newest">Newest</option>
                    <option value="deadline">Deadline soon</option>
                    <option value="popular">Most viewed</option>
                    <option value="salaryHigh">Highest salary</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
                Apply filters
              </button>
              {hasActiveFilters && (
                <button type="button" onClick={clearFilters} className="w-full rounded-xl border border-border py-2 text-sm font-medium text-text-muted hover:text-text">
                  Clear all
                </button>
              )}
              <p className="text-xs text-text-muted text-center">Tip: Save your search to get notified.</p>
            </div>
          </form>
        </aside>

        {/* Results */}
        <div>
          {/* Top bar for mobile search? Results already in sidebar */}
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-44 animate-pulse rounded-2xl border border-border bg-surface" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-border bg-surface p-12 text-center">
              <p className="font-medium text-text">No jobs match your search.</p>
              <p className="mt-1 text-sm text-text-muted">Try a different keyword or clear your filters.</p>
              <button onClick={clearFilters} className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white">Clear filters</button>
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {jobs.map((job, i) => (
                  <JobCard key={job._id} job={job} index={i} />
                ))}
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                    className="flex items-center gap-1 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text-muted hover:text-text disabled:opacity-40"
                  >
                    <ChevronLeft size={15} /> Prev
                  </button>
                  <span className="rounded-full bg-bg px-3 py-1 text-sm text-text-muted border border-border">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= pagination.totalPages}
                    className="flex items-center gap-1 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text-muted hover:text-text disabled:opacity-40"
                  >
                    Next <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
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

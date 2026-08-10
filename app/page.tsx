"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
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

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/jobs")
      .then((res) => res.json())
      .then((data) => setJobs(data.jobs || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(search ? `/jobs?search=${encodeURIComponent(search)}` : "/jobs");
  };

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-linear-to-b from-primary/5 to-bg px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-[family-name:var(--font-heading)] text-4xl font-bold text-text sm:text-5xl"
          >
            Nepal&apos;s next opportunity{" "}
            <span className="bg-linear-to-r from-primary to-primary-2 bg-clip-text text-transparent">
              starts here.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg text-text-muted"
          >
            Connecting students and companies across Kathmandu, Pokhara, and beyond.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onSubmit={handleSearch}
            className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-2xl border border-border bg-surface p-2 shadow-sm"
          >
            <Search className="ml-2 shrink-0 text-text-muted" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search job titles, e.g. Frontend Developer"
              className="w-full bg-transparent px-2 py-2 text-text outline-none placeholder:text-text-muted"
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-linear-to-r from-primary to-primary-2 px-5 py-2.5 text-sm font-medium text-white"
            >
              Search
            </button>
          </motion.form>
        </div>
      </section>

      {/* Featured jobs */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text">
            Recent openings
          </h2>
          <a href="/jobs" className="text-sm font-medium text-primary hover:underline">
            View all jobs →
          </a>
        </div>

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
          <p className="rounded-2xl border border-border bg-surface p-8 text-center text-text-muted">
            No jobs posted yet — check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.slice(0, 6).map((job, i) => (
              <JobCard key={job._id} job={job} index={i} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
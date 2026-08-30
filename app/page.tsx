"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  Briefcase,
  Building2,
  GraduationCap,
  Code2,
  Database,
  Palette,
  Megaphone,
  HeartPulse,
  GraduationCap as EduIcon,
  ArrowRight,
  CheckCircle2,
  Users,
  ShieldCheck,
  TrendingUp,
  Sparkles,
} from "lucide-react";
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

type Stats = {
  totalJobs: number;
  totalCompanies: number;
  totalStudents: number;
};

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const abort = new AbortController();
    const { signal } = abort;

    fetch("/api/jobs?pageSize=6", { signal })
      .then((res) => {
        if (!res.ok) throw new Error("jobs fetch failed");
        return res.json();
      })
      .then((data) => setJobs(data.jobs || []))
      .catch((err) => {
        if (err.name !== "AbortError") setJobs([]);
      })
      .finally(() => {
        if (!signal.aborted) setLoading(false);
      });

    fetch("/api/stats", { signal })
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => {});

    return () => abort.abort();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(search ? `/jobs?search=${encodeURIComponent(search)}` : "/jobs");
  };

  const statItems = [
    { label: "Open jobs", value: stats?.totalJobs, icon: Briefcase },
    { label: "Companies hiring", value: stats?.totalCompanies, icon: Building2 },
    { label: "Students registered", value: stats?.totalStudents, icon: GraduationCap },
  ];

  const categoryIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    "Software Engineering": Code2,
    "Web Development": Code2,
    "Mobile Development": Code2,
    "Data Science & Analytics": Database,
    "IT & Networking": Database,
    "Design (UI/UX & Graphics)": Palette,
    "Marketing & Sales": Megaphone,
    Healthcare: HeartPulse,
    "Education & Training": EduIcon,
  };

  const howSteps = [
    { icon: Search, title: "Discover", desc: "Search by title, location, category or remote — with smart filters and instant results." },
    { icon: CheckCircle2, title: "Apply in seconds", desc: "One-click apply with your saved resume + cover letter. Track status in real time." },
    { icon: TrendingUp, title: "Get hired", desc: "Companies review, shortlist and contact you directly. No middlemen." },
  ];

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-linear-to-b from-primary/10 via-primary/[0.04] to-bg">
        <div className="absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-muted shadow-sm"
            >
              <Sparkles size={12} className="text-primary" /> Trusted by 500+ companies in Nepal
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="mt-4 font-[family-name:var(--font-heading)] text-4xl font-bold tracking-tight text-text sm:text-5xl"
            >
              Nepal&apos;s next opportunity{" "}
              <span className="bg-linear-to-r from-primary to-primary-2 bg-clip-text text-transparent">starts here.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-4 text-lg leading-relaxed text-text-muted"
            >
              Connecting students and companies across Kathmandu, Pokhara, and beyond — internships, full-time & remote roles.
            </motion.p>

            <motion.form
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              onSubmit={handleSearch}
              className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-2xl border border-border bg-surface p-2 shadow-lg shadow-primary/5"
              aria-label="Search jobs"
            >
              <Search className="ml-2 shrink-0 text-text-muted" size={20} aria-hidden="true" />
              <label htmlFor="home-search" className="sr-only">
                Search job titles
              </label>
              <input
                id="home-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search job titles, e.g. Frontend Developer"
                aria-label="Search job titles"
                className="w-full bg-transparent px-2 py-2 text-text outline-none placeholder:text-text-muted"
              />
              <button
                type="submit"
                aria-label="Search"
                className="shrink-0 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-primary-hover"
              >
                Search
              </button>
            </motion.form>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs"
            >
              <span className="text-text-muted">Trending:</span>
              {["React", "Remote", "Internship", "Kathmandu"].map((t) => (
                <button
                  key={t}
                  onClick={() => router.push(`/jobs?search=${encodeURIComponent(t)}`)}
                  className="rounded-full border border-border bg-surface px-2.5 py-1 text-text-muted hover:text-text hover:border-primary/30"
                >
                  {t}
                </button>
              ))}
            </motion.div>
          </div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mx-auto mt-14 grid max-w-3xl grid-cols-3 gap-3 sm:gap-4"
          >
            {statItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-surface px-3 py-5 text-center shadow-sm"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon size={16} />
                  </span>
                  <p className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text">
                    {item.value === undefined || item.value === null ? (
                      <span className="inline-block h-7 w-10 animate-pulse rounded bg-border align-middle" />
                    ) : (
                      `${item.value}+`
                    )}
                  </p>
                  <p className="text-xs text-text-muted sm:text-sm">{item.label}</p>
                </div>
              );
            })}
          </motion.div>

          {/* Trusted strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="mx-auto mt-10 flex flex-wrap items-center justify-center gap-3 text-xs text-text-muted"
          >
            <span className="font-medium">Trusted companies hiring now:</span>
            <span className="hidden sm:inline-flex items-center gap-2">
              <span className="rounded-full bg-surface border border-border px-2.5 py-1">TechCorp</span>
              <span className="rounded-full bg-surface border border-border px-2.5 py-1">Himalayan Labs</span>
              <span className="rounded-full bg-surface border border-border px-2.5 py-1">Kathmandu Co</span>
              <span className="rounded-full bg-surface border border-border px-2.5 py-1">Pokhara Startups</span>
            </span>
          </motion.div>
        </div>
      </section>

      {/* Browse by category */}
      <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text">Browse by category</h2>
            <p className="mt-1 text-sm text-text-muted">Find roles tailored to your skills.</p>
          </div>
          <Link href="/jobs" className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Explore all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {JOB_CATEGORIES.slice(0, 8).map((cat) => {
            const Icon = categoryIcons[cat] || Briefcase;
            return (
              <Link
                key={cat}
                href={`/jobs?category=${encodeURIComponent(cat)}`}
                className="group rounded-2xl border border-border bg-surface p-4 hover:border-primary/20 hover:shadow-md transition-all"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Icon size={18} />
                </span>
                <p className="mt-3 font-medium text-text text-sm leading-tight">{cat}</p>
                <p className="mt-1 text-xs text-text-muted">Open roles →</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text">How it works</h2>
            <p className="mt-2 text-text-muted">Get hired in 3 simple steps.</p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {howSteps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="rounded-2xl border border-border bg-bg p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                    <Icon size={18} />
                  </span>
                  <h3 className="mt-4 font-semibold text-text">{i + 1}. {s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured jobs */}
      <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text">Recent openings</h2>
            <p className="mt-1 text-sm text-text-muted">Fresh opportunities from verified companies.</p>
          </div>
          <Link href="/jobs" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View all jobs <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl border border-border bg-surface" />
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

      {/* Employer CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-12 sm:pb-16">
        <div className="rounded-[24px] bg-text p-6 sm:p-10 text-surface overflow-hidden relative">
          <div className="absolute inset-0 bg-linear-to-r from-primary/20 to-primary-2/20" aria-hidden="true" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
                <Users size={12} /> For employers
              </div>
              <h3 className="mt-3 font-[family-name:var(--font-heading)] text-2xl font-bold text-white">
                Hire the best students in Nepal, fast.
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70 max-w-xl">
                Post a job in under 2 minutes, get applicants with resumes & cover letters, and manage everything from one dashboard. Free during beta.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link href="/register" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-text hover:bg-surface">
                Post a job now
              </Link>
              <Link href="/jobs" className="rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white hover:bg-white/10">
                See how it works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-sm text-text-muted">
          <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-success" /> Verified companies only • No spam</span>
          <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-primary" /> Free to apply • No hidden fees</span>
          <span className="flex items-center gap-2"><Building2 size={16} className="text-primary" /> Support: hello@nepjob.com</span>
        </div>
      </section>
    </main>
  );
}

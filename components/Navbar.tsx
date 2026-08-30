"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, Search, Briefcase, Bookmark, LayoutDashboard, PlusCircle } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState("");

  // AuthLayout already provides its own header — don't double up
  if (pathname === "/login" || pathname === "/register") return null;

  const role = session?.user?.role;

  const dashboardHref =
    role === "student"
      ? "/dashboard/student"
      : role === "company"
      ? "/dashboard/company"
      : role === "admin"
      ? "/dashboard/admin"
      : "/";

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = quickSearch.trim();
    router.push(q ? `/jobs?search=${encodeURIComponent(q)}` : "/jobs");
    setMobileOpen(false);
  };

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur-xl supports-[backdrop-filter]:bg-surface/70">
      <nav className="mx-auto flex h-[64px] max-w-7xl items-center gap-4 px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
            <Briefcase size={18} />
          </span>
          <span className="font-[family-name:var(--font-heading)] text-[22px] font-bold tracking-tight text-text">
            NepJob
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-1 lg:flex">
          <Link
            href="/jobs"
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${isActive("/jobs") ? "bg-bg text-text" : "text-text-muted hover:text-text"}`}
          >
            Find Jobs
          </Link>
          <Link
            href="/companies"
            className={`hidden xl:inline-flex rounded-full px-3.5 py-1.5 text-sm font-medium ${isActive("/companies") ? "bg-bg text-text" : "text-text-muted hover:text-text"}`}
          >
            Companies
          </Link>
          {role && (
            <Link
              href={dashboardHref}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium ${isActive("/dashboard") ? "bg-bg text-text" : "text-text-muted hover:text-text"}`}
            >
              <LayoutDashboard size={14} /> Dashboard
            </Link>
          )}
        </div>

        {/* Center search - desktop */}
        <form onSubmit={handleQuickSearch} className="hidden md:flex flex-1 max-w-md mx-4 items-center gap-2 rounded-full border border-border bg-bg px-3 py-1.5">
          <Search size={16} className="text-text-muted shrink-0" />
          <input
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            placeholder="Search jobs, skills, companies"
            aria-label="Quick search jobs"
            className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
          />
          <button type="submit" className="shrink-0 rounded-full bg-text px-3 py-1 text-xs font-medium text-surface hover:opacity-90">
            Search
          </button>
        </form>

        {/* Right side */}
        <div className="ml-auto hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {status === "loading" ? (
            <span className="h-8 w-20 animate-pulse rounded-full bg-border" />
          ) : session ? (
            <>
              {role === "student" && (
                <Link href="/dashboard/student/bookmarks" className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-muted hover:text-text hover:bg-bg">
                  <Bookmark size={16} />
                </Link>
              )}
              {role === "company" && (
                <Link
                  href="/dashboard/company/jobs/new"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover"
                >
                  <PlusCircle size={14} /> Post a Job
                </Link>
              )}
              <div className="flex items-center gap-2 pl-2">
                <span className="hidden xl:inline text-sm font-medium text-text max-w-[120px] truncate">{session.user?.name}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {(session.user?.name || session.user?.email || "U").charAt(0).toUpperCase()}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  aria-label="Log out"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-muted hover:text-primary-2 hover:border-primary-2"
                >
                  <LogOut size={14} />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-4 py-2 text-sm font-medium text-text-muted hover:text-text">
                Log in
              </Link>
              <Link href="/register" className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover">
                Sign up
              </Link>
              <Link href="/login" className="hidden xl:inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text hover:bg-bg">
                For Employers
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-border text-text md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden border-t border-border md:hidden bg-surface"
          >
            <div className="flex flex-col gap-3 px-4 py-4">
              <form onSubmit={handleQuickSearch} className="flex items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2">
                <Search size={16} className="text-text-muted" />
                <input
                  value={quickSearch}
                  onChange={(e) => setQuickSearch(e.target.value)}
                  placeholder="Search jobs..."
                  className="w-full bg-transparent text-sm text-text outline-none"
                />
                <button type="submit" className="rounded-full bg-text px-3 py-1 text-xs font-medium text-surface">Go</button>
              </form>

              <Link href="/jobs" onClick={() => setMobileOpen(false)} className="rounded-xl bg-bg px-4 py-3 text-sm font-medium text-text">
                Find Jobs
              </Link>
              {role && (
                <Link href={dashboardHref} onClick={() => setMobileOpen(false)} className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-text">
                  Dashboard
                </Link>
              )}
              {role === "student" && (
                <Link href="/dashboard/student/bookmarks" onClick={() => setMobileOpen(false)} className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-text">
                  Saved Jobs
                </Link>
              )}
              {role === "company" && (
                <Link href="/dashboard/company/jobs/new" onClick={() => setMobileOpen(false)} className="rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-white">
                  Post a Job
                </Link>
              )}

              <div className="mt-2 flex items-center justify-between border-t border-border pt-4">
                <ThemeToggle />
                {session ? (
                  <button onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-1.5 text-sm font-medium text-primary-2">
                    <LogOut size={14} /> Log out
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <Link href="/login" className="text-sm font-medium text-text-muted">Log in</Link>
                    <Link href="/register" className="text-sm font-semibold text-primary">Sign up</Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
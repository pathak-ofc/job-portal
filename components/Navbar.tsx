"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  // AuthLayout already provides its own header — don't double up
  if (pathname === "/login" || pathname === "/register") return null;

  const role = (session?.user as any)?.role as
    | "student"
    | "company"
    | "admin"
    | undefined;

  const dashboardHref =
    role === "student"
      ? "/dashboard/student"
      : role === "company"
      ? "/dashboard/company"
      : role === "admin"
      ? "/dashboard/admin"
      : "/";

  const navLinks = [
    { href: "/jobs", label: "Browse Jobs" },
    ...(role ? [{ href: dashboardHref, label: "Dashboard" }] : []),
    ...(role === "student" ? [{ href: "/dashboard/student/bookmarks", label: "Bookmarks" }] : []),
    ...(role === "company" ? [{ href: "/dashboard/company/jobs/new", label: "Post a Job" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-heading)] text-xl font-bold text-text"
        >
          NepJob
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "text-primary"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden items-center gap-4 md:flex">
          <ThemeToggle />
          {status === "loading" ? null : session ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-muted transition-colors hover:border-primary-2 hover:text-primary-2"
            >
              <LogOut size={14} />
              Log out
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-text-muted hover:text-text"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-linear-to-r from-primary to-primary-2 px-4 py-1.5 text-sm font-medium text-white"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="text-text md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-t border-border md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-text-muted hover:bg-bg hover:text-text"
                >
                  {link.label}
                </Link>
              ))}

              <div className="mt-2 flex items-center justify-between border-t border-border pt-4">
                <ThemeToggle />
                {session ? (
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex items-center gap-1.5 text-sm font-medium text-primary-2"
                  >
                    <LogOut size={14} /> Log out
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <Link href="/login" className="text-sm font-medium text-text-muted">
                      Log in
                    </Link>
                    <Link href="/register" className="text-sm font-medium text-primary">
                      Sign up
                    </Link>
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
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SearchX, Home, Briefcase } from "lucide-react";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <SearchX size={28} />
        </div>

        <h1 className="mt-6 font-[family-name:var(--font-heading)] text-3xl font-bold text-text">
          Page not found
        </h1>
        <p className="mt-2 text-text-muted">
          The page you&apos;re looking for doesn&apos;t exist, or may have been moved.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary-2 px-5 py-2.5 text-sm font-medium text-white"
          >
            <Home size={16} />
            Go home
          </Link>
          <Link
            href="/jobs"
            className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-text-muted hover:text-text"
          >
            <Briefcase size={16} />
            Browse jobs
          </Link>
        </div>
      </motion.div>
    </main>
  );
}

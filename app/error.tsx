"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, Home, RotateCw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // log client-side so it shows up in the browser console / error tracker,
    // without exposing internal details in the rendered UI
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-2/10 text-primary-2">
          <AlertTriangle size={28} />
        </div>

        <h1 className="mt-6 font-[family-name:var(--font-heading)] text-3xl font-bold text-text">
          Something went wrong
        </h1>
        <p className="mt-2 text-text-muted">
          An unexpected error occurred. Please try again, or head back home.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary-2 px-5 py-2.5 text-sm font-medium text-white"
          >
            <RotateCw size={16} />
            Try again
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-text-muted hover:text-text"
          >
            <Home size={16} />
            Go home
          </Link>
        </div>
      </motion.div>
    </main>
  );
}

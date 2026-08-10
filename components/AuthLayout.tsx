"use client";

import { motion } from "framer-motion";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";

const jobTags = [
  { label: "Frontend Intern", left: "8%", top: "22%", duration: 5 },
  { label: "Remote", left: "38%", top: "15%", duration: 4.5 },
  { label: "UI/UX Designer", left: "60%", top: "28%", duration: 5.5 },
  { label: "Data Analyst", left: "20%", top: "48%", duration: 4 },
  { label: "Backend Engineer", left: "50%", top: "55%", duration: 5 },
  { label: "Marketing", left: "10%", top: "68%", duration: 4.5 },
  { label: "Kathmandu", left: "45%", top: "75%", duration: 5.5 },
  { label: "Full-time", left: "68%", top: "62%", duration: 4 },
];

export default function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex min-h-screen bg-bg">
      <div className="relative hidden w-1/2 overflow-hidden bg-linear-to-br from-primary via-primary to-primary-2 lg:flex lg:flex-col lg:p-12">
        <Link
          href="/"
          className="relative z-10 text-2xl font-[family-name:var(--font-heading)] font-bold text-white"
        >
          NepJob
        </Link>

        <div className="pointer-events-none absolute inset-0">
          {jobTags.map((tag) => (
            <motion.span
              key={tag.label}
              className="absolute rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm"
              style={{ left: tag.left, top: tag.top }}
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: tag.duration,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {tag.label}
            </motion.span>
          ))}
        </div>

        <p className="relative z-10 mt-auto font-[family-name:var(--font-heading)] text-3xl font-semibold text-white">
          Nepal&apos;s next opportunity starts here.
        </p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-20">
        <div className="mb-8 flex items-center justify-between lg:hidden">
          <Link
            href="/"
            className="text-xl font-[family-name:var(--font-heading)] font-bold text-text"
          >
            NepJob
          </Link>
          <ThemeToggle />
        </div>

        <div className="mx-auto hidden w-full max-w-sm lg:flex lg:justify-end">
          <ThemeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mx-auto mt-6 w-full max-w-sm"
        >
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-text">
            {title}
          </h1>
          <p className="mt-2 text-text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
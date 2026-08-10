"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import JobCard from "@/components/JobCard";
import { toast } from "sonner";

type Bookmark = {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    category: string;
    location: string;
    salaryRange?: string;
    jobType: string;
    deadline: string;
  } | null;
};

export default function StudentBookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bookmarks")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load bookmarks");
        return res.json();
      })
      .then((data) => setBookmarks(data.bookmarks || []))
      .catch(() => toast.error("Failed to load your bookmarks"))
      .finally(() => setLoading(false));
  }, []);

  const validBookmarks = bookmarks.filter((b) => b.jobId);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text">
        Bookmarks
      </h1>
      <p className="mt-1 text-text-muted">Jobs you&apos;ve saved for later.</p>

      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl border border-border bg-surface" />
            ))}
          </div>
        ) : validBookmarks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-border bg-surface p-12 text-center"
          >
            <p className="text-text">No bookmarked jobs yet.</p>
            <p className="mt-1 text-sm text-text-muted">
              Tap the bookmark icon on any job to save it here.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {validBookmarks.map((b, i) => (
              <JobCard key={b._id} job={b.jobId as NonNullable<Bookmark["jobId"]>} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

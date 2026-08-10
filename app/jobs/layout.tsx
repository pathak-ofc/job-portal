import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Jobs | NepJob",
  description:
    "Search and filter job openings across Nepal by category, location, and job type on NepJob.",
};

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

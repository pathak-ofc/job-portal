import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Job Posts",
};

export default function CompanyJobsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

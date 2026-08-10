import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Post a Job",
};

export default function NewJobLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account | NepJob",
  description: "Join NepJob as a student looking for opportunities or a company hiring talent.",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}

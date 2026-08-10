import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile",
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return children;
}

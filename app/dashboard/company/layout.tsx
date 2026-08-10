import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Company Profile",
};

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";
import DashboardShell from "@/components/DashboardShell";

export const metadata: Metadata = {
  title: {
    template: "%s | NepJob Dashboard",
    default: "Dashboard | NepJob",
  },
  description: "Manage your NepJob account, job listings, and applications.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}

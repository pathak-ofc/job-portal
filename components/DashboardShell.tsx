"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  User,
  FileText,
  Bookmark,
  Building2,
  Briefcase,
  PlusCircle,
  Users,
  LayoutDashboard,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
};

const navByRole: Record<string, NavItem[]> = {
  student: [
    { href: "/dashboard/student", label: "Profile", icon: User },
    { href: "/dashboard/student/applications", label: "My Applications", icon: FileText },
    { href: "/dashboard/student/bookmarks", label: "Bookmarks", icon: Bookmark },
  ],
  company: [
    { href: "/dashboard/company", label: "Company Profile", icon: Building2 },
    { href: "/dashboard/company/jobs", label: "My Job Posts", icon: Briefcase },
    { href: "/dashboard/company/jobs/new", label: "Post a Job", icon: PlusCircle },
  ],
  admin: [
    { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/admin/users", label: "Users", icon: Users },
  ],
};

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const role = session?.user?.role;

  if (status === "loading") {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface" />
      </main>
    );
  }

  const navItems = role ? navByRole[role] || [] : [];

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 py-8 lg:flex-row">
      <aside className="shrink-0 lg:w-[260px]">
        <div className="rounded-2xl border border-border bg-surface p-3 lg:sticky lg:top-[80px]">
          <div className="mb-3 px-2 py-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Dashboard</p>
            <p className="mt-1 text-sm font-medium text-text truncate">{session?.user?.name || session?.user?.email}</p>
            <p className="text-xs text-text-muted capitalize">{role} account</p>
          </div>
          <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active ? "bg-primary text-white shadow-sm" : "text-text-muted hover:bg-bg hover:text-text"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 rounded-xl bg-bg border border-border p-3">
            <p className="text-xs font-medium text-text">Need help?</p>
            <p className="mt-1 text-xs text-text-muted">Contact support at hello@nepjob.com</p>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </main>
  );
}

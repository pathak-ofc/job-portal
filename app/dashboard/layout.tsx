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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const role = (session?.user as any)?.role as "student" | "company" | "admin" | undefined;

  if (status === "loading") {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface" />
      </main>
    );
  }

  const navItems = role ? navByRole[role] || [] : [];

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 lg:flex-row">
      <aside className="shrink-0 lg:w-56">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-text-muted hover:bg-surface hover:text-text"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </main>
  );
}

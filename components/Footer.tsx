"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, MapPin, Mail, Phone, Globe, Share2 } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/register") return null;
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-xl font-bold text-text">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                <Briefcase size={16} />
              </span>
              NepJob
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-text-muted">
              Nepal&apos;s trusted gateway for students and companies. Find internships, full-time roles, and top talent across Kathmandu, Pokhara & beyond.
            </p>
            <div className="mt-4 flex gap-2">
              {[Globe, Share2, Mail, Phone].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Social link"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-muted transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* For Job Seekers */}
          <div>
            <h4 className="font-[family-name:var(--font-heading)] text-sm font-semibold text-text">For Job Seekers</h4>
            <ul className="mt-3 space-y-2 text-sm text-text-muted">
              <li><Link href="/jobs" className="hover:text-primary">Browse Jobs</Link></li>
              <li><Link href="/jobs?category=Software%20Engineering" className="hover:text-primary">Engineering Jobs</Link></li>
              <li><Link href="/jobs?jobType=internship" className="hover:text-primary">Internships</Link></li>
              <li><Link href="/dashboard/student/bookmarks" className="hover:text-primary">Saved Jobs</Link></li>
              <li><Link href="/dashboard/student/applications" className="hover:text-primary">My Applications</Link></li>
            </ul>
          </div>

          {/* For Employers */}
          <div>
            <h4 className="font-[family-name:var(--font-heading)] text-sm font-semibold text-text">For Employers</h4>
            <ul className="mt-3 space-y-2 text-sm text-text-muted">
              <li><Link href="/dashboard/company/jobs/new" className="hover:text-primary">Post a Job</Link></li>
              <li><Link href="/dashboard/company/jobs" className="hover:text-primary">Manage Jobs</Link></li>
              <li><Link href="/register" className="hover:text-primary">Create Company Account</Link></li>
              <li><Link href="/companies" className="hover:text-primary hidden">Browse Companies</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-[family-name:var(--font-heading)] text-sm font-semibold text-text">Contact</h4>
            <ul className="mt-3 space-y-2.5 text-sm text-text-muted">
              <li className="flex items-center gap-2"><MapPin size={14} className="text-primary" /> Kathmandu, Nepal</li>
              <li className="flex items-center gap-2"><Mail size={14} className="text-primary" /> hello@nepjob.com</li>
              <li className="flex items-center gap-2"><Phone size={14} className="text-primary" /> +977 9800000000</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-sm text-text-muted md:flex-row">
          <p>© {new Date().getFullYear()} NepJob. All rights reserved. Built for Nepal.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-text">Privacy</Link>
            <Link href="#" className="hover:text-text">Terms</Link>
            <Link href="#" className="hover:text-text">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

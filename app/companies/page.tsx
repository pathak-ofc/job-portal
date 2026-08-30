"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Building2, BadgeCheck, Globe, MapPin, Users, Search } from "lucide-react";

type Company = {
  userId: string;
  companyName: string;
  logoUrl: string;
  website: string;
  description: string;
  verified: boolean;
  industry?: string;
  size?: string;
  location?: string;
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCompanies = (q = "") => {
    setLoading(true);
    fetch(`/api/companies?search=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => setCompanies(d.companies || []))
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load fetch
    fetchCompanies();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCompanies(search);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-text">Companies hiring</h1>
          <p className="mt-1 text-text-muted">Discover verified employers in Nepal.</p>
        </div>
        <form onSubmit={handleSearch} className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 sm:w-80">
          <Search size={14} className="text-text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search companies..." className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-muted" />
          <button type="submit" className="rounded-full bg-text px-3 py-1 text-xs font-medium text-surface">Search</button>
        </form>
      </div>

      {loading ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl border border-border bg-surface" />
          ))}
        </div>
      ) : companies.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-border bg-surface p-8 text-center text-text-muted">No companies found.</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((c, i) => (
            <motion.div key={String(c.userId)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Link href={`/companies/${c.userId}`} className="block rounded-2xl border border-border bg-surface p-5 hover:border-primary/20 hover:shadow-sm">
                <div className="flex items-center gap-3">
                  {c.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- external Cloudinary URL
                    <img src={c.logoUrl} alt={c.companyName} className="h-10 w-10 rounded-xl border border-border object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Building2 size={16} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-text truncate flex items-center gap-1.5">
                      {c.companyName} {c.verified && <BadgeCheck size={12} className="text-primary" />}
                    </p>
                    {c.industry && <p className="text-xs text-text-muted truncate">{c.industry}</p>}
                  </div>
                </div>
                {c.description && <p className="mt-3 line-clamp-2 text-sm text-text-muted">{c.description}</p>}
                <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-text-muted">
                  {c.location && <span className="inline-flex items-center gap-1 rounded-full bg-bg border border-border px-2 py-1"><MapPin size={10} />{c.location}</span>}
                  {c.size && <span className="inline-flex items-center gap-1 rounded-full bg-bg border border-border px-2 py-1"><Users size={10} />{c.size}</span>}
                </div>
                {c.website && <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary"><Globe size={12} />{c.website}</span>}
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </main>
  );
}

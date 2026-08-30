"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Globe, BadgeCheck, Building2, Briefcase, MapPin, Users, Calendar } from "lucide-react";
import JobCard from "@/components/JobCard";

type Company = {
  companyName: string;
  logoUrl: string;
  website: string;
  description: string;
  verified: boolean;
  industry?: string;
  size?: string;
  location?: string;
  foundedYear?: number;
};

type Job = {
  _id: string;
  title: string;
  category: string;
  location: string;
  salaryRange?: string;
  jobType: string;
  deadline: string;
};

export default function CompanyPublicProfilePage() {
  const { id } = useParams();

  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/companies/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((data) => {
        setCompany(data.company);
        setJobs(data.jobs || []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="h-40 animate-pulse rounded-2xl border border-border bg-surface" />
      </main>
    );
  }

  if (notFound || !company) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text">
          Company not found
        </h1>
        <p className="mt-2 text-text-muted">
          This company profile doesn&apos;t exist or is unavailable.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-border bg-surface p-8"
      >
        <div className="flex items-start gap-4">
          {company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- external Cloudinary URLs, no need for next/image optimization here
            <img
              src={company.logoUrl}
              alt={`${company.companyName} logo`}
              className="h-16 w-16 shrink-0 rounded-xl border border-border object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 size={28} />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text">
                {company.companyName}
              </h1>
              {company.verified && (
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  <BadgeCheck size={13} /> Verified
                </span>
              )}
            </div>
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <Globe size={14} />
                {company.website}
              </a>
            )}
          </div>
        </div>

        {company.description && <p className="mt-6 whitespace-pre-line leading-relaxed text-text">{company.description}</p>}

        <div className="mt-6 flex flex-wrap gap-2">
          {company.industry && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-bg border border-border px-3 py-1.5 text-xs font-medium text-text-muted">
              <Briefcase size={12} className="text-primary" /> {company.industry}
            </span>
          )}
          {company.size && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-bg border border-border px-3 py-1.5 text-xs font-medium text-text-muted">
              <Users size={12} className="text-primary" /> {company.size} employees
            </span>
          )}
          {company.location && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-bg border border-border px-3 py-1.5 text-xs font-medium text-text-muted">
              <MapPin size={12} className="text-primary" /> {company.location}
            </span>
          )}
          {company.foundedYear && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-bg border border-border px-3 py-1.5 text-xs font-medium text-text-muted">
              <Calendar size={12} className="text-primary" /> Founded {company.foundedYear}
            </span>
          )}
        </div>
      </motion.div>

      <div className="mt-10">
        <h2 className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-xl font-bold text-text">
          <Briefcase size={20} className="text-text-muted" />
          Open positions ({jobs.length})
        </h2>

        {jobs.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-border bg-surface p-12 text-center">
            <p className="text-text">No open positions right now — check back soon.</p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {jobs.map((job, i) => (
              <JobCard key={job._id} job={job} index={i} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

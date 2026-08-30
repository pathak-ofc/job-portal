"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Upload, ExternalLink, BadgeCheck } from "lucide-react";
import { toast } from "sonner";

type CompanyProfile = {
  companyName: string;
  logoUrl: string;
  website: string;
  description: string;
  verified: boolean;
  industry: string;
  size: string;
  foundedYear: number | "";
  location: string;
};

export default function CompanyProfilePage() {
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [size, setSize] = useState("");
  const [foundedYear, setFoundedYear] = useState<number | "">("");
  const [location, setLocation] = useState("");
  const [verified, setVerified] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/profile/company", { signal: abort.signal })
      .then((res) => res.json())
      .then((data) => {
        const p = data.profile as CompanyProfile;
        setCompanyName(p.companyName || "");
        setLogoUrl(p.logoUrl || "");
        setWebsite(p.website || "");
        setDescription(p.description || "");
        setIndustry(p.industry || "");
        setSize(p.size || "");
        setFoundedYear(p.foundedYear || "");
        setLocation(p.location || "");
        setVerified(!!p.verified);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        toast.error("Failed to load company profile");
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, []);

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Logo upload failed");
        return;
      }
      setLogoUrl(data.url);
      toast.success("Logo uploaded");
    } catch {
      toast.error("Something went wrong uploading your logo");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim()) {
      toast.error("Company name is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          logoUrl,
          website,
          description,
          industry,
          size,
          foundedYear: foundedYear === "" ? undefined : Number(foundedYear),
          location,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to save profile");
        return;
      }
      toast.success("Profile saved");
    } catch {
      toast.error("Something went wrong saving your profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center gap-3">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text">
          Company Profile
        </h1>
        {verified && (
          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            <BadgeCheck size={13} /> Verified
          </span>
        )}
      </div>
      <p className="mt-1 text-text-muted">
        This information is shown to students on your job listings.
      </p>

      <form
        onSubmit={handleSave}
        aria-label="Company profile form"
        className="mt-6 space-y-5 rounded-2xl border border-border bg-surface p-6"
      >
        <div>
          <label htmlFor="company-name" className="mb-1 block text-sm font-medium text-text">
            Company name
          </label>
          <input
            id="company-name"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Acme Pvt. Ltd."
            aria-label="Company name"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="company-industry" className="mb-1 block text-sm font-medium text-text">
              Industry
            </label>
            <input
              id="company-industry"
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Software, Design, Fintech"
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="company-size" className="mb-1 block text-sm font-medium text-text">
              Company size
            </label>
            <select
              id="company-size"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
            >
              <option value="">Select size</option>
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="201-500">201-500 employees</option>
              <option value="500+">500+ employees</option>
            </select>
          </div>
          <div>
            <label htmlFor="company-location" className="mb-1 block text-sm font-medium text-text">
              Headquarters location
            </label>
            <input
              id="company-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Kathmandu, Nepal"
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="company-founded" className="mb-1 block text-sm font-medium text-text">
              Founded year
            </label>
            <input
              id="company-founded"
              type="number"
              min={1800}
              max={2100}
              value={foundedYear}
              onChange={(e) => setFoundedYear(e.target.value ? Number(e.target.value) : "")}
              placeholder="2020"
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label htmlFor="company-website" className="mb-1 block text-sm font-medium text-text">
            Website
          </label>
          <input
            id="company-website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com"
            aria-label="Website"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
          />
        </div>

        <div>
          <label htmlFor="company-description" className="mb-1 block text-sm font-medium text-text">
            Description
          </label>
          <textarea
            id="company-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={5000}
            placeholder="What does your company do? Culture, mission, benefits..."
            aria-label="Company description"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
          />
        </div>

        <div>
          <label htmlFor="company-logo" className="mb-1 block text-sm font-medium text-text">
            Logo (image, max 3MB)
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-text-muted hover:border-primary">
            <Upload size={16} aria-hidden="true" />
            {uploading ? "Uploading..." : "Choose an image to replace your logo"}
            <input
              id="company-logo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              aria-label="Upload logo"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (!file.type.startsWith("image/")) {
                  toast.error("Only image files are allowed for logo");
                  return;
                }
                if (file.size > 3 * 1024 * 1024) {
                  toast.error("Logo too large — max 3MB");
                  return;
                }
                handleLogoUpload(file);
              }}
            />
          </label>
          {logoUrl && (
            <a
              href={logoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <ExternalLink size={14} aria-hidden="true" />
              View current logo
            </a>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={saving || uploading}
          className="flex items-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary-2 px-6 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </motion.button>
      </form>
    </motion.div>
  );
}

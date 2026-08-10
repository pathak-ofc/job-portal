"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Upload, Check, ExternalLink, BadgeCheck } from "lucide-react";

type CompanyProfile = {
  companyName: string;
  logoUrl: string;
  website: string;
  description: string;
  verified: boolean;
};

export default function CompanyProfilePage() {
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [verified, setVerified] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/profile/company")
      .then((res) => res.json())
      .then((data) => {
        const p = data.profile as CompanyProfile;
        setCompanyName(p.companyName || "");
        setLogoUrl(p.logoUrl || "");
        setWebsite(p.website || "");
        setDescription(p.description || "");
        setVerified(!!p.verified);
      })
      .catch(() => setError("Failed to load company profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleLogoUpload = async (file: File) => {
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Logo upload failed");
        return;
      }
      setLogoUrl(data.url);
    } catch {
      setError("Something went wrong uploading your logo");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);

    if (!companyName.trim()) {
      setError("Company name is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, logoUrl, website, description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to save profile");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Something went wrong saving your profile");
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
        className="mt-6 space-y-5 rounded-2xl border border-border bg-surface p-6"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-text">Company name</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Acme Pvt. Ltd."
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text">Website</label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="What does your company do?"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text">Logo</label>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-text-muted hover:border-primary">
            <Upload size={16} />
            {uploading ? "Uploading..." : "Choose an image to replace your logo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoUpload(file);
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
              <ExternalLink size={14} />
              View current logo
            </a>
          )}
        </div>

        {error && <p className="text-sm text-primary-2">{error}</p>}

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={saving || uploading}
          className="flex items-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary-2 px-6 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {saved ? (
            <>
              <Check size={16} /> Saved
            </>
          ) : saving ? (
            "Saving..."
          ) : (
            "Save changes"
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}

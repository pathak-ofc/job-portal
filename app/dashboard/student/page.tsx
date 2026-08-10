"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Check } from "lucide-react";

type StudentProfile = {
  phone: string;
  bio: string;
  skills: string[];
  resumeUrl: string;
};

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/profile/student")
      .then((res) => res.json())
      .then((data) => {
        const p = data.profile as StudentProfile;
        setProfile(p);
        setPhone(p.phone || "");
        setBio(p.bio || "");
        setSkillsInput((p.skills || []).join(", "));
        setResumeUrl(p.resumeUrl || "");
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleResumeUpload = async (file: File) => {
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Resume upload failed");
        return;
      }
      setResumeUrl(data.url);
    } catch {
      setError("Something went wrong uploading your resume");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const skills = skillsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/profile/student", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, bio, skills, resumeUrl }),
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
      <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text">
        My Profile
      </h1>
      <p className="mt-1 text-text-muted">
        Keep your contact details, bio, skills, and resume up to date.
      </p>

      <form
        onSubmit={handleSave}
        className="mt-6 space-y-5 rounded-2xl border border-border bg-surface p-6"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-text">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="98XXXXXXXX"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Tell companies a bit about yourself..."
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text">
            Skills <span className="text-text-muted">(comma-separated)</span>
          </label>
          <input
            type="text"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            placeholder="React, Node.js, Figma"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text">
            Resume (PDF, max 5MB)
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-text-muted hover:border-primary">
            <Upload size={16} />
            {uploading ? "Uploading..." : "Choose a PDF to replace your resume"}
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleResumeUpload(file);
              }}
            />
          </label>
          {resumeUrl && (
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <FileText size={14} />
              View current resume
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import AuthLayout from "@/components/AuthLayout";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"student" | "company">("student");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Something went wrong");
        setLoading(false);
        return;
      }

      toast.success("Account created — please log in.");
      router.push("/login");
    } catch {
      toast.error("Network error — please try again");
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join as a student or a company in seconds."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role selector */}
        <div className="flex gap-2 rounded-xl border border-border bg-surface p-1">
          {(["student", "company"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`relative flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-colors ${
                role === r ? "text-white" : "text-text-muted"
              }`}
            >
              {role === r && (
                <motion.div
                  layoutId="role-pill"
                  className="absolute inset-0 rounded-lg bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{r}</span>
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="register-name" className="mb-1 block text-sm font-medium text-text">
            {role === "company" ? "Contact person name" : "Full name"}
          </label>
          <input
            id="register-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text outline-none transition-colors focus:border-primary"
            placeholder="Ramesh Shrestha"
          />
        </div>

        <div>
          <label htmlFor="register-email" className="mb-1 block text-sm font-medium text-text">
            Email
          </label>
          <input
            id="register-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text outline-none transition-colors focus:border-primary"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="register-password" className="mb-1 block text-sm font-medium text-text">
            Password
          </label>
          <input
            id="register-password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text outline-none transition-colors focus:border-primary"
            placeholder="Min 8 chars, at least 1 letter + 1 number"
            aria-describedby="password-hint"
          />
          <p id="password-hint" className="mt-1 text-xs text-text-muted">
            At least 8 characters, includes a letter and a number.
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-linear-to-r from-primary to-primary-2 py-2.5 font-medium text-white transition-opacity disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
        </motion.button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
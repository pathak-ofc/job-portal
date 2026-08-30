"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import AuthLayout from "@/components/AuthLayout";

function isSafeCallbackUrl(url: string | null): string {
  if (!url) return "/";
  // Only allow internal paths starting with "/" but not "//" or "/\" and no protocol
  if (!url.startsWith("/") || url.startsWith("//") || url.includes("://") || url.startsWith("/\\")) return "/";
  // Prevent open redirect via encoded slashes like %2F%2F
  try {
    const decoded = decodeURIComponent(url);
    if (decoded.startsWith("//") || decoded.includes("://")) return "/";
  } catch {
    return "/";
  }
  return url;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = isSafeCallbackUrl(searchParams.get("callbackUrl"));

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (result?.error) {
      toast.error("Invalid email or password");
      setLoading(false);
      return;
    }

    toast.success("Welcome back!");
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to continue to NepJob.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-text">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text outline-none transition-colors focus:border-primary"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text">Password</label>
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text outline-none transition-colors focus:border-primary"
            placeholder="••••••••"
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-linear-to-r from-primary to-primary-2 py-2.5 font-medium text-white transition-opacity disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Log in"}
        </motion.button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
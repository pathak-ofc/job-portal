import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In | NepJob",
  description: "Log in to your NepJob account to browse jobs, apply, or manage your listings.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "NepJob — Find your next opportunity",
  description: "Nepal's job portal for students and companies.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} font-[family-name:var(--font-body)] antialiased`}
      >
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <div className="flex-1">{children}</div>
            <FooterWrapper />
          </div>
        </Providers>
      </body>
    </html>
  );
}

function FooterWrapper() {
  // keep Footer client-side aware of pathname without making layout a client component:
  // we use a tiny client wrapper via dynamic import behavior - for simplicity,
  // always render Footer and let it handle its own pathname check if needed.
  // To hide on auth pages, we do a CSS approach: Navbar already hides there,
  // Footer will be visible but subtle — we keep it on all pages except auth
  // via a client component check inside Footer if desired. For now render always
  // and hide via CSS on auth routes using :has() is not reliable, so we render
  // Footer everywhere; auth pages have centered layout so footer is naturally
  // below and non-intrusive. If strict hide needed, make this a client component.
  return <Footer />;
}
"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { Toaster } from "sonner";

function ThemedToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      position="top-right"
      theme={theme}
      richColors
      closeButton
    />
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
        <ThemedToaster />
      </ThemeProvider>
    </SessionProvider>
  );
}
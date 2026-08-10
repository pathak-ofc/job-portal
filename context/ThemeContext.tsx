"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";

type ThemeContextType = {
  theme: "light" | "dark";
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("theme") as "light" | "dark" | null;
  return (
    saved ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  );
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Lazy initializer runs once on the client during the first render — this
  // reads localStorage/matchMedia without needing a setState-in-effect.
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);
  const mountedRef = useRef(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    // skip persisting on the very first mount so we don't rewrite the value
    // we just read, only when the user actually toggles it
    if (mountedRef.current) {
      localStorage.setItem("theme", theme);
    }
    mountedRef.current = true;
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="relative flex h-8 w-16 items-center rounded-full border border-border bg-surface px-1 transition-colors"
    >
      <motion.div
        className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white"
        animate={{ x: isDark ? 32 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {isDark ? <Moon size={14} /> : <Sun size={14} />}
      </motion.div>
    </button>
  );
}
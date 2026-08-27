import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme, switchable } = useTheme();
  if (!switchable || !toggleTheme) return null;
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={isDark ? "Use light reading mode" : "Use dark reading mode"}
      className={compact ? "mt-2 inline-flex h-10 w-full items-center justify-center gap-2 border border-[#102936]/15 font-mono text-[9px] tracking-[.14em] text-[#55707d] hover:border-[#EF5D3F] hover:text-[#EF5D3F]" : "inline-flex h-10 items-center gap-2 border border-[#102936]/15 px-3 font-mono text-[8px] tracking-[.13em] text-[#55707d] transition-colors hover:border-[#EF5D3F] hover:text-[#EF5D3F]"}
    >
      {isDark ? <Sun size={13} /> : <Moon size={13} />}
      {compact ? (isDark ? "LIGHT READING MODE" : "DARK READING MODE") : (isDark ? "LIGHT" : "DARK")}
    </button>
  );
}

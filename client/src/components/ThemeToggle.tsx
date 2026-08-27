import React, { useState } from "react";
import { Palette, Check } from "lucide-react";
import { useTheme, Theme } from "@/contexts/ThemeContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const THEMES: { id: Theme; label: string; color: string }[] = [
  { id: "paper", label: "PAPER", color: "#F6F0E5" },
  { id: "midnight", label: "MIDNIGHT", color: "#16121d" },
  { id: "forest", label: "FOREST", color: "#1a251e" },
  { id: "royal", label: "ROYAL", color: "#181223" },
];

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme, switchable } = useTheme();
  const [open, setOpen] = useState(false);

  if (!switchable) return null;

  const currentTheme = THEMES.find(t => t.id === theme) || THEMES[0];

  if (compact) {
    return (
      <div className="mt-4 flex flex-col gap-2">
        <span className="font-mono text-[9px] tracking-[.14em] text-[#55707d] mb-1">APPEARANCE</span>
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className={cn(
                "flex h-10 items-center justify-center gap-2 border border-[#102936]/15 font-mono text-[9px] tracking-[.14em] transition-colors",
                theme === t.id 
                  ? "border-[#EF5D3F] text-[#EF5D3F] bg-[#EF5D3F]/5" 
                  : "text-[#55707d] hover:border-[#EF5D3F] hover:text-[#EF5D3F]"
              )}
            >
              <div 
                className="h-2 w-2 rounded-full border border-current" 
                style={{ backgroundColor: t.color }}
              />
              {t.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Change theme"
          className="inline-flex h-10 items-center gap-2 border border-[#102936]/15 px-3 font-mono text-[8px] tracking-[.13em] text-[#55707d] transition-colors hover:border-[#EF5D3F] hover:text-[#EF5D3F]"
        >
          <Palette size={13} />
          <span>THEME: {currentTheme.label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-2 rounded-none border-[#102936]/15 bg-background">
        <div className="flex flex-col gap-1">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTheme(t.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between px-3 py-2 font-mono text-[9px] tracking-[.14em] transition-colors hover:bg-accent hover:text-accent-foreground text-left",
                theme === t.id ? "text-primary font-bold" : "text-muted-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="h-3 w-3 rounded-full border border-border" 
                  style={{ backgroundColor: t.color }}
                />
                {t.label}
              </div>
              {theme === t.id && <Check size={10} />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

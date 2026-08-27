import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "paper" | "midnight" | "forest" | "royal";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "paper",
  switchable = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (switchable && typeof window !== "undefined") {
      const stored = localStorage.getItem("theme") as Theme;
      if (["paper", "midnight", "forest", "royal"].includes(stored)) return stored;
      
      // Legacy "light"/"dark" migration
      if (stored === ("light" as any)) return "paper";
      if (stored === ("dark" as any)) return "midnight";

      if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "midnight";
    }
    return defaultTheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove("theme-paper", "theme-midnight", "theme-forest", "theme-royal", "dark");
    
    // Add new theme class
    if (theme !== "paper") {
      root.classList.add(`theme-${theme}`);
    }
    
    // Maintain "dark" class for midnight for backward compatibility with external components
    if (theme === "midnight") {
      root.classList.add("dark");
    }

    if (switchable) {
      localStorage.setItem("theme", theme);
    }
    
    // Update color-scheme for browser UI
    root.style.colorScheme = theme === "paper" ? "light" : "dark";
  }, [theme, switchable]);

  const setTheme = (newTheme: Theme) => {
    if (switchable) {
      setThemeState(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

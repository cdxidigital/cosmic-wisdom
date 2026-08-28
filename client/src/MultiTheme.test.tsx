/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { ThemeProvider, useTheme, Theme } from "./contexts/ThemeContext";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe("Multi-Theme System", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.style.colorScheme = "";
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider switchable>{children}</ThemeProvider>
  );

  it("initializes with default 'paper' theme", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("paper");
    expect(document.documentElement.classList.contains("theme-paper")).toBe(false); // Paper is default, no class needed
    expect(document.documentElement.style.colorScheme).toBe("light");
  });

  it("switches to 'midnight' and adds 'dark' class for compatibility", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    act(() => {
      result.current.setTheme("midnight");
    });

    expect(result.current.theme).toBe("midnight");
    expect(document.documentElement.classList.contains("theme-midnight")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("midnight");
  });

  it("switches to 'forest' theme", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    
    act(() => {
      result.current.setTheme("forest");
    });

    expect(result.current.theme).toBe("forest");
    expect(document.documentElement.classList.contains("theme-forest")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false); // Only midnight gets dark class
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("forest");
  });

  it("migrates legacy 'dark' preference to 'midnight'", () => {
    localStorage.setItem("theme", "dark");
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("midnight");
  });

  it("migrates legacy 'light' preference to 'paper'", () => {
    localStorage.setItem("theme", "light");
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("paper");
  });
});

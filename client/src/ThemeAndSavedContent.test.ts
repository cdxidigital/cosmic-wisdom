import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());
const app = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
const home = readFileSync(resolve(root, "client/src/pages/Home.tsx"), "utf8");
const theme = readFileSync(resolve(root, "client/src/contexts/ThemeContext.tsx"), "utf8");
const saved = readFileSync(resolve(root, "client/src/pages/SavedItems.tsx"), "utf8");

describe("theme and saved-content wiring", () => {
  it("enables persistent application theme switching and honours system dark preference", () => {
    expect(app).toContain('switchable');
    expect(theme).toContain('localStorage.getItem("theme")');
    expect(theme).toContain("prefers-color-scheme: dark");
    expect(theme).toContain("root.style.colorScheme = theme");
  });

  it("places the dark toggle and private saved-content entry in the home experience", () => {
    expect(home).toContain("<ThemeToggle");
    expect(home).toContain('href="/saved"');
    expect(home).toContain("SaveForLaterButton");
    expect(saved).toContain("listSavedItems");
    expect(saved).toContain('window.location.href = "/account"');
  });
});

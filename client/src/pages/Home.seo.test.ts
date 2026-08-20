import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(process.cwd());
const indexHtml = readFileSync(resolve(projectRoot, "client/index.html"), "utf8");
const homeSource = readFileSync(resolve(projectRoot, "client/src/pages/Home.tsx"), "utf8");

describe("homepage SEO constraints", () => {
  it("uses a compliant title, focused keyword set, and non-empty image alternatives", () => {
    const title = indexHtml.match(/<title>([^<]+)<\/title>/)?.[1] ?? "";
    const keywords = (indexHtml.match(/<meta name="keywords" content="([^"]+)"/i)?.[1] ?? "")
      .split(",")
      .map(keyword => keyword.trim())
      .filter(Boolean);
    const imageAlts = [...homeSource.matchAll(/<img\s+[^>]*alt="([^"]+)"/g)].map(match => match[1]);

    expect(title.length).toBeGreaterThanOrEqual(30);
    expect(title.length).toBeLessThanOrEqual(60);
    expect(keywords.length).toBeGreaterThanOrEqual(3);
    expect(keywords.length).toBeLessThanOrEqual(8);
    expect(homeSource).toContain("document.title = HOME_TITLE");
    expect(imageAlts).toHaveLength(3);
    expect(imageAlts.every(Boolean)).toBe(true);
  });
});

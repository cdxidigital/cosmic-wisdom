import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(process.cwd());
const indexHtml = readFileSync(resolve(projectRoot, "client/index.html"), "utf8");
const homeSource = readFileSync(resolve(projectRoot, "client/src/pages/Home.tsx"), "utf8");

describe("homepage SEO constraints", () => {
  it("uses compliant title, description, keyword, heading, and image alternative content", () => {
    const title = indexHtml.match(/<title>([^<]+)<\/title>/)?.[1] ?? "";
    const keywords = (indexHtml.match(/<meta name="keywords" content="([^"]+)"/i)?.[1] ?? "")
      .split(",")
      .map(keyword => keyword.trim())
      .filter(Boolean);
    const description = indexHtml.match(/<meta name="description" content="([^"]+)"/i)?.[1] ?? "";
    const h2 = indexHtml.match(/<h2>([^<]+)<\/h2>/i)?.[1] ?? "";
    const imageAlts = [...homeSource.matchAll(/<img\s+[^>]*alt="([^"]+)"/g)].map(match => match[1]);

    expect(title.length).toBeGreaterThanOrEqual(30);
    expect(title.length).toBeLessThanOrEqual(60);
    expect(keywords.length).toBeGreaterThanOrEqual(3);
    expect(keywords.length).toBeLessThanOrEqual(8);
    expect(description.length).toBeGreaterThanOrEqual(50);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(h2.length).toBeGreaterThan(0);
    expect(h2.length).toBeLessThanOrEqual(80);
    expect(indexHtml).toContain('<main id="static-page-summary">');
    expect(indexHtml).not.toContain("<noscript>");
    expect(homeSource).toContain("document.title = HOME_TITLE");
    expect(homeSource).toContain('const HOME_TITLE = "Cosmic Wisdom: Private Astrology, Tarot and Numerology"');
    expect(imageAlts).toHaveLength(3);
    expect(imageAlts.every(Boolean)).toBe(true);
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(process.cwd());
const appSource = readFileSync(resolve(projectRoot, "client/src/App.tsx"), "utf8");
const styleSource = readFileSync(resolve(projectRoot, "client/src/index.css"), "utf8");

describe("lazy route transitions", () => {
  it("keeps secondary routes inside an announced loading shell and a bounded entry wrapper", () => {
    expect(appSource).toContain('aria-busy="true"');
    expect(appSource).toContain('aria-live="polite"');
    expect(appSource).toContain('role="status"');
    expect(appSource).toContain('className="cosmic-route-enter"');
    expect(appSource).toContain("<Suspense fallback={<StudioLoading />}><RouteTransition>");
  });

  it("limits optional motion to transform and opacity and disables it when motion is reduced", () => {
    expect(styleSource).toContain("@media (prefers-reduced-motion: no-preference)");
    expect(styleSource).toContain("@keyframes cosmic-route-enter");
    expect(styleSource).toContain("@keyframes cosmic-route-orbit");
    expect(styleSource).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styleSource).toContain("animation: none !important");
  });
});

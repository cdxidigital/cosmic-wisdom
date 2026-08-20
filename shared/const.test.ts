import { describe, expect, it } from "vitest";
import { safeOAuthReturnPath } from "./const";

describe("safeOAuthReturnPath", () => {
  it("preserves internal application routes", () => {
    expect(safeOAuthReturnPath("/tarot?guide=placement")).toBe("/tarot?guide=placement");
  });

  it("rejects external and API return targets", () => {
    expect(safeOAuthReturnPath("https://untrusted.example")).toBe("/");
    expect(safeOAuthReturnPath("//untrusted.example")).toBe("/");
    expect(safeOAuthReturnPath("/api/oauth/callback")).toBe("/");
  });
});

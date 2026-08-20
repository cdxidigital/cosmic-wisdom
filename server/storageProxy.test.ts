import { describe, expect, it } from "vitest";
import { parseStorageRouteKey } from "./_core/storageProxy";

describe("private storage route keys", () => {
  it("decodes normal encoded filenames before ownership comparison", () => {
    expect(parseStorageRouteKey("cosmic-private/42/reports/reading%20note.txt")).toBe("cosmic-private/42/reports/reading note.txt");
  });

  it("rejects malformed, absolute, and traversal route keys", () => {
    expect(parseStorageRouteKey(undefined)).toBeNull();
    expect(parseStorageRouteKey("%E0%A4%A")).toBeNull();
    expect(parseStorageRouteKey("/cosmic-private/42/report.txt")).toBeNull();
    expect(parseStorageRouteKey("cosmic-private/42/../report.txt")).toBeNull();
  });
});

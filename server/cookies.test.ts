import { describe, expect, it } from "vitest";
import { getSessionCookieOptions } from "./_core/cookies";
import type { Request } from "express";

describe("session cookie policy", () => {
  it("uses a browser-valid Lax cookie for plain local HTTP", () => {
    const options = getSessionCookieOptions({ protocol: "http", headers: {} } as Request);
    expect(options).toMatchObject({ secure: false, sameSite: "lax", httpOnly: true, path: "/" });
  });

  it("uses a cross-site secure cookie behind HTTPS proxies", () => {
    const options = getSessionCookieOptions({ protocol: "http", headers: { "x-forwarded-proto": "https" } } as Request);
    expect(options).toMatchObject({ secure: true, sameSite: "none", httpOnly: true, path: "/" });
  });
});

import { describe, expect, it } from "vitest";
import { hashPassword, normalizeAccountEmail, validatePassword, verifyPassword } from "./passwordAuth";

describe("local password credentials", () => {
  it("normalizes email and enforces the documented strong-password boundary", () => {
    expect(normalizeAccountEmail("  Parker@Example.COM ")).toBe("parker@example.com");
    expect(validatePassword("short").valid).toBe(false);
    expect(validatePassword("alllowercase12").valid).toBe(false);
    expect(validatePassword("UPPERCASE1234").valid).toBe(false);
    expect(validatePassword("StrongPassword42")).toEqual({ valid: true });
  });

  it("salts and verifies credentials without retaining plaintext", async () => {
    const password = "StrongPassword42";
    const first = await hashPassword(password);
    const second = await hashPassword(password);
    expect(first).toMatch(/^scrypt-v1\$/);
    expect(first).not.toContain(password);
    expect(first).not.toBe(second);
    await expect(verifyPassword(password, first)).resolves.toBe(true);
    await expect(verifyPassword("IncorrectPassword42", first)).resolves.toBe(false);
    await expect(verifyPassword(password, null)).resolves.toBe(false);
  });
});

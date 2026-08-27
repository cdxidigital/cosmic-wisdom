import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { hashPassword } from "./passwordAuth";

const dbMocks = vi.hoisted(() => ({
  getUserByEmail: vi.fn(), createLocalUser: vi.fn(), touchUserLastSignedIn: vi.fn(),
}));
const sdkMocks = vi.hoisted(() => ({ createSessionToken: vi.fn() }));

vi.mock("./db", () => dbMocks);
vi.mock("./_core/sdk", () => ({ sdk: sdkMocks }));

import { appRouter } from "./routers";

const member = { id: 31, openId: "local_member", name: "Parker", email: "parker@example.com", loginMethod: "email_password", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
function context() {
  return { user: null, req: { protocol: "https", headers: {}, ip: "203.0.113.42" }, res: { cookie: vi.fn(), clearCookie: vi.fn() } } as unknown as TrpcContext;
}

describe("local email account procedures", () => {
  beforeEach(() => { vi.clearAllMocks(); sdkMocks.createSessionToken.mockResolvedValue("local-session-token"); });

  it("registers a normalized local account with a hash and sets the shared session cookie", async () => {
    dbMocks.getUserByEmail.mockResolvedValue(null); dbMocks.createLocalUser.mockResolvedValue(member);
    const ctx = context(); const caller = appRouter.createCaller(ctx);
    await expect(caller.auth.registerWithEmail({ displayName: " Parker ", email: "Parker@Example.com", password: "StrongPassword42" })).resolves.toEqual({ id: 31, name: "Parker", email: "parker@example.com" });
    expect(dbMocks.createLocalUser).toHaveBeenCalledWith(expect.objectContaining({ email: "parker@example.com", displayName: "Parker", passwordHash: expect.stringMatching(/^scrypt-v1\$/) }));
    expect(dbMocks.createLocalUser.mock.calls[0][0].passwordHash).not.toContain("StrongPassword42");
    expect(sdkMocks.createSessionToken).toHaveBeenCalledWith("local_member", expect.objectContaining({ name: "Parker" }));
    expect((ctx.res as any).cookie).toHaveBeenCalledWith(expect.any(String), "local-session-token", expect.objectContaining({ httpOnly: true, secure: true }));
  });

  it("rejects duplicate registration before creating a new credential", async () => {
    dbMocks.getUserByEmail.mockResolvedValue(member);
    await expect(appRouter.createCaller(context()).auth.registerWithEmail({ displayName: "Parker", email: "parker@example.com", password: "StrongPassword42" })).rejects.toThrow("already exists");
    expect(dbMocks.createLocalUser).not.toHaveBeenCalled();
  });

  it("returns a generic failure for incorrect credentials and does not issue a session", async () => {
    dbMocks.getUserByEmail.mockResolvedValue({ ...member, passwordHash: await hashPassword("CorrectPassword42") });
    await expect(appRouter.createCaller(context()).auth.signInWithEmail({ email: "parker@example.com", password: "IncorrectPassword42" })).rejects.toThrow("Invalid email or password.");
    expect(sdkMocks.createSessionToken).not.toHaveBeenCalled();
  });

  it("rate-limits repeated failed sign-ins while preserving generic invalid-credential failures", async () => {
    dbMocks.getUserByEmail.mockResolvedValue(null);
    const caller = appRouter.createCaller(context());
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(caller.auth.signInWithEmail({ email: "limited@example.com", password: "wrong" })).rejects.toThrow("Invalid email or password.");
    }
    await expect(caller.auth.signInWithEmail({ email: "limited@example.com", password: "wrong" })).rejects.toThrow("Too many sign-in attempts");
    expect(sdkMocks.createSessionToken).not.toHaveBeenCalled();
  });

  it("updates sign-in time and issues the standard member cookie for valid credentials", async () => {
    dbMocks.getUserByEmail.mockResolvedValue({ ...member, passwordHash: await hashPassword("CorrectPassword42") });
    const ctx = context();
    await expect(appRouter.createCaller(ctx).auth.signInWithEmail({ email: "Parker@Example.com", password: "CorrectPassword42" })).resolves.toEqual({ id: 31, name: "Parker", email: "parker@example.com" });
    expect(dbMocks.touchUserLastSignedIn).toHaveBeenCalledWith(31);
    expect((ctx.res as any).cookie).toHaveBeenCalledWith(expect.any(String), "local-session-token", expect.objectContaining({ httpOnly: true, secure: true }));
  });
});

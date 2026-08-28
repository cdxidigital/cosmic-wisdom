import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { hashPassword } from "./passwordAuth";

const dbMocks = vi.hoisted(() => ({
  getUserByEmail: vi.fn(), createLocalUser: vi.fn(), touchUserLastSignedIn: vi.fn(), updateUserPasswordHash: vi.fn(), deleteMemberAccount: vi.fn(),
  createEmailVerificationToken: vi.fn(), createPasswordResetToken: vi.fn(), getPasswordResetToken: vi.fn(), usePasswordResetToken: vi.fn(),
  getEmailVerificationToken: vi.fn(), useEmailVerificationToken: vi.fn(),
}));
const sdkMocks = vi.hoisted(() => ({ createSessionToken: vi.fn() }));

vi.mock("./db", () => dbMocks);
vi.mock("./_core/sdk", () => ({ sdk: sdkMocks }));

import { appRouter } from "./routers";

const member = { id: 31, openId: "local_member", name: "Parker", email: "parker@example.com", loginMethod: "email_password", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
function context() {
  return { user: null, req: { protocol: "https", headers: {}, ip: "203.0.113.42" }, res: { cookie: vi.fn(), clearCookie: vi.fn() } } as unknown as TrpcContext;
}
function memberContext(passwordHash?: string) {
  return { user: { ...member, passwordHash }, req: { protocol: "https", headers: {}, ip: "203.0.113.42" }, res: { cookie: vi.fn(), clearCookie: vi.fn() } } as unknown as TrpcContext;
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

  it("returns safe account settings and requires the current password before an existing password can change", async () => {
    const passwordHash = await hashPassword("CorrectPassword42");
    const ctx = memberContext(passwordHash); const caller = appRouter.createCaller(ctx);
    await expect(caller.auth.getAccountSettings()).resolves.toEqual({ name: "Parker", email: "parker@example.com", loginMethod: "email_password", hasPassword: true });
    await expect(caller.auth.changePassword({ currentPassword: "IncorrectPassword42", newPassword: "UpdatedPassword42" })).rejects.toThrow("current password");
    expect(dbMocks.updateUserPasswordHash).not.toHaveBeenCalled();
    await expect(caller.auth.changePassword({ currentPassword: "CorrectPassword42", newPassword: "UpdatedPassword42" })).resolves.toEqual({ success: true });
    expect(dbMocks.updateUserPasswordHash).toHaveBeenCalledWith(31, expect.stringMatching(/^scrypt-v1\$/));
    expect(dbMocks.updateUserPasswordHash.mock.calls[0][1]).not.toContain("UpdatedPassword42");
  });

  it("deletes only the current member after a deliberate phrase and valid local password, then clears the shared cookie", async () => {
    const passwordHash = await hashPassword("CorrectPassword42");
    dbMocks.deleteMemberAccount.mockResolvedValue({ deletedFileReferenceCount: 2 });
    const ctx = memberContext(passwordHash); const caller = appRouter.createCaller(ctx);
    await expect(caller.auth.deleteAccount({ confirmation: "DELETE MY ACCOUNT", currentPassword: "IncorrectPassword42" })).rejects.toThrow("current password");
    expect(dbMocks.deleteMemberAccount).not.toHaveBeenCalled();
    await expect(caller.auth.deleteAccount({ confirmation: "DELETE MY ACCOUNT", currentPassword: "CorrectPassword42" })).resolves.toEqual({ success: true, deletedFileReferenceCount: 2 });
    expect(dbMocks.deleteMemberAccount).toHaveBeenCalledWith(31);
    expect((ctx.res as any).clearCookie).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ httpOnly: true, secure: true, maxAge: -1 }));
  });
});

  it("processes a password reset request and generates a secure token", async () => {
    dbMocks.getUserByEmail.mockResolvedValue(member);
    const caller = appRouter.createCaller(context());
    const result = await caller.auth.requestPasswordReset({ email: "parker@example.com" });
    expect(result.success).toBe(true);
    expect(dbMocks.createPasswordResetToken).toHaveBeenCalledWith(member.id, expect.any(String), expect.any(Date));
  });

  it("updates the password using a valid reset token", async () => {
    const token = "valid-reset-token";
    dbMocks.getPasswordResetToken.mockResolvedValue({ id: 1, userId: member.id, token, expiresAt: new Date(Date.now() + 3600000), usedAt: null });
    const caller = appRouter.createCaller(context());
    const result = await caller.auth.resetPassword({ token, newPassword: "NewStrongPassword123!" });
    expect(result.success).toBe(true);
    expect(dbMocks.updateUserPasswordHash).toHaveBeenCalledWith(member.id, expect.stringMatching(/^scrypt-v1\$/));
    expect(dbMocks.usePasswordResetToken).toHaveBeenCalledWith(1);
  });

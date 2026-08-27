import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { COOKIE_NAME } from "@shared/const";

const dbMocks = vi.hoisted(() => ({
  getUserByOpenId: vi.fn(), upsertUser: vi.fn(), getCosmicProfileByUserId: vi.fn(), listCosmicFiles: vi.fn(), listCosmicReadings: vi.fn(),
}));
vi.mock("./db", () => dbMocks);

import { sdk } from "./_core/sdk";
import { appRouter } from "./routers";

const localMember = { id: 73, openId: "local_73", name: "Local Member", email: "local@example.com", loginMethod: "email_password", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };

function context(user: TrpcContext["user"], clearCookie = vi.fn()) {
  return { user, req: { protocol: "https", headers: {} }, res: { cookie: vi.fn(), clearCookie } } as unknown as TrpcContext;
}

describe("local password-session access", () => {
  beforeEach(() => { vi.clearAllMocks(); dbMocks.getUserByOpenId.mockResolvedValue(localMember); });

  it("authenticates a locally issued shared token and scopes protected records to that local member", async () => {
    const token = await sdk.createSessionToken(localMember.openId, { name: localMember.name });
    const authenticated = await sdk.authenticateRequest({ headers: { cookie: `${COOKIE_NAME}=${token}` } } as any);
    dbMocks.getCosmicProfileByUserId.mockResolvedValue(null);
    dbMocks.listCosmicFiles.mockResolvedValue([]);
    dbMocks.listCosmicReadings.mockResolvedValue([]);
    const caller = appRouter.createCaller(context(authenticated));
    await caller.cosmic.getMyProfile();
    await caller.cosmic.listFiles();
    await caller.cosmic.listReadings();
    expect(authenticated.id).toBe(73);
    expect(dbMocks.getCosmicProfileByUserId).toHaveBeenCalledWith(73);
    expect(dbMocks.listCosmicFiles).toHaveBeenCalledWith(73);
    expect(dbMocks.listCosmicReadings).toHaveBeenCalledWith(73);
  });

  it("clears the shared cookie on local-account logout and rejects a subsequent request with no cookie", async () => {
    const clearCookie = vi.fn();
    await expect(appRouter.createCaller(context(localMember, clearCookie)).auth.logout()).resolves.toEqual({ success: true });
    expect(clearCookie).toHaveBeenCalledWith(COOKIE_NAME, expect.objectContaining({ httpOnly: true, secure: true }));
    await expect(sdk.authenticateRequest({ headers: {} } as any)).rejects.toThrow("Invalid session cookie");
  });
});

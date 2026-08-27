import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  createCosmicFileRecord: vi.fn(),
  getCosmicFileByUserIdAndId: vi.fn(),
  getCosmicProfileByUserId: vi.fn(),
  listCosmicDailyBriefs: vi.fn(),
  listCosmicFiles: vi.fn(),
  listCosmicReadings: vi.fn(),
  listCosmicSavedItems: vi.fn(),
  saveCosmicDailyBrief: vi.fn(),
  saveCosmicProfile: vi.fn(),
  saveCosmicReading: vi.fn(),
  toggleCosmicSavedItem: vi.fn(),
}));

const storageMocks = vi.hoisted(() => ({
  storageGetSignedUrl: vi.fn(),
  storagePut: vi.fn(),
}));

vi.mock("./db", () => dbMocks);
vi.mock("./storage", () => storageMocks);

import { appRouter } from "./routers";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function context(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const member: AuthenticatedUser = {
  id: 42,
  openId: "member-42",
  name: "Member 42",
  email: null,
  loginMethod: "manus",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

describe("Cosmic member data isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scopes profile retrieval to the authenticated member", async () => {
    dbMocks.getCosmicProfileByUserId.mockResolvedValue(null);
    const caller = appRouter.createCaller(context(member));

    await expect(caller.cosmic.getMyProfile()).resolves.toBeNull();
    expect(dbMocks.getCosmicProfileByUserId).toHaveBeenCalledWith(42);
  });

  it("creates download URLs only after the file helper verifies the member owner", async () => {
    dbMocks.getCosmicFileByUserIdAndId.mockResolvedValue({
      id: 7,
      storageKey: "cosmic-private/42/reports/private-reading.txt",
      originalFilename: "private-reading.txt",
    });
    storageMocks.storageGetSignedUrl.mockResolvedValue("https://signed.example/private-reading.txt");
    const caller = appRouter.createCaller(context(member));

    await expect(caller.cosmic.getFileDownloadUrl({ fileId: 7 })).resolves.toEqual({
      url: "https://signed.example/private-reading.txt",
      originalFilename: "private-reading.txt",
    });
    expect(dbMocks.getCosmicFileByUserIdAndId).toHaveBeenCalledWith(42, 7);
    expect(storageMocks.storageGetSignedUrl).toHaveBeenCalledWith("cosmic-private/42/reports/private-reading.txt");
  });

  it("scopes reading lists and reading saves to the authenticated member", async () => {
    dbMocks.listCosmicReadings.mockResolvedValue([]);
    dbMocks.saveCosmicReading.mockResolvedValue({ id: 9 });
    const caller = appRouter.createCaller(context(member));
    const reading = {
      profileId: null,
      readingType: "tarot" as const,
      title: "A calm three-card reflection",
      readingContext: "context-threshold-orientation",
      narrative: "A grounded reflection that keeps the drawn symbols in proportion.",
      inputData: { cards: [] },
      consentAccepted: true as const,
      consentVersion: "camera-guidance-v1" as const,
    };

    await expect(caller.cosmic.listReadings()).resolves.toEqual([]);
    await expect(caller.cosmic.saveReading(reading)).resolves.toEqual({ id: 9 });
    expect(dbMocks.listCosmicReadings).toHaveBeenCalledWith(42);
    expect(dbMocks.saveCosmicReading).toHaveBeenCalledWith(42, reading);
  });

  it("scopes saved content lists and toggles to the authenticated member", async () => {
    dbMocks.listCosmicSavedItems.mockResolvedValue([]);
    dbMocks.toggleCosmicSavedItem.mockResolvedValue({ saved: true });
    const caller = appRouter.createCaller(context(member));
    const savedItem = {
      contentKey: "lens:tarot",
      contentType: "tarot" as const,
      title: "Tarot",
      summary: "A clear three-card spread when you want a different question.",
      href: "/tarot",
    };

    await expect(caller.cosmic.listSavedItems()).resolves.toEqual([]);
    await expect(caller.cosmic.toggleSavedItem(savedItem)).resolves.toEqual({ saved: true });
    expect(dbMocks.listCosmicSavedItems).toHaveBeenCalledWith(42);
    expect(dbMocks.toggleCosmicSavedItem).toHaveBeenCalledWith(42, savedItem);
  });

  it("creates a report only in the authenticated member namespace", async () => {
    dbMocks.getCosmicProfileByUserId.mockResolvedValue({ id: 4 });
    storageMocks.storagePut.mockResolvedValue({
      key: "cosmic-private/42/reports/fresh-reading.txt",
      url: "/manus-storage/cosmic-private/42/reports/fresh-reading.txt",
    });
    dbMocks.createCosmicFileRecord.mockResolvedValue({ id: 10 });
    const caller = appRouter.createCaller(context(member));

    await expect(caller.cosmic.uploadTextReport({
      profileId: 4,
      fileName: "Fresh Reading.txt",
      content: "A clear private reading export for the authenticated member.",
    })).resolves.toEqual({ id: 10 });
    expect(dbMocks.getCosmicProfileByUserId).toHaveBeenCalledWith(42);
    expect(storageMocks.storagePut).toHaveBeenCalledWith(
      expect.stringMatching(/^cosmic-private\/42\/reports\//),
      expect.any(Buffer),
      "text/plain; charset=utf-8",
    );
    expect(dbMocks.createCosmicFileRecord).toHaveBeenCalledWith(42, expect.objectContaining({ fileKind: "report", profileId: 4 }));
  });

  it("rejects storage metadata that points at another member namespace", async () => {
    const caller = appRouter.createCaller(context(member));

    await expect(caller.cosmic.registerStoredFile({
      profileId: null,
      fileKind: "report",
      storageKey: "cosmic-private/99/reports/not-yours.txt",
      storageUrl: "/manus-storage/cosmic-private/99/reports/not-yours.txt",
      originalFilename: "not-yours.txt",
      mimeType: "text/plain",
      byteSize: 12,
    })).rejects.toThrow("private Cosmic storage space");
    expect(dbMocks.createCosmicFileRecord).not.toHaveBeenCalled();
  });

  it("stops anonymous callers before member data helpers run", async () => {
    const caller = appRouter.createCaller(context(null));

    await expect(caller.cosmic.getMyProfile()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.cosmic.getFileDownloadUrl({ fileId: 7 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.cosmic.listSavedItems()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(dbMocks.getCosmicProfileByUserId).not.toHaveBeenCalled();
    expect(dbMocks.getCosmicFileByUserIdAndId).not.toHaveBeenCalled();
  });
});

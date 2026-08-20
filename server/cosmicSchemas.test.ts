import { describe, expect, it } from "vitest";
import { cosmicProfileInput, cosmicReadingInput, safeReportFileName } from "./cosmicSchemas";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const member: AuthenticatedUser = {
  id: 1,
  openId: "member-one",
  email: "member@example.com",
  name: "Member One",
  loginMethod: "manus",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

describe("Cosmic persistence contracts", () => {
  it("accepts a valid private birth-profile payload", () => {
    const result = cosmicProfileInput.safeParse({
      displayName: "Parker",
      birthDate: "1988-06-14",
      birthTime: "09:30",
      birthLocation: "Perth, Australia",
      timezone: "Australia/Perth",
    });
    expect(result.success).toBe(true);
  });

  it("rejects malformed birth dates and removes path characters from report names", () => {
    expect(cosmicProfileInput.safeParse({ displayName: "Parker", birthDate: "14/06/1988", birthLocation: "Perth", timezone: "Australia/Perth" }).success).toBe(false);
    expect(safeReportFileName("../My Cosmos Report!.txt")).toBe("..-my-cosmos-report-.txt");
  });

  it("blocks anonymous profile access before any private data is queried", async () => {
    const caller = appRouter.createCaller(createContext(null));
    await expect(caller.cosmic.getMyProfile()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects attempts to register a file outside the authenticated member storage prefix", async () => {
    const caller = appRouter.createCaller(createContext(member));
    await expect(
      caller.cosmic.registerStoredFile({
        profileId: null,
        fileKind: "attachment",
        storageKey: "cosmic/999/attachment.txt",
        storageUrl: "/manus-storage/cosmic/999/attachment.txt",
        originalFilename: "attachment.txt",
        mimeType: "text/plain",
        byteSize: 12,
      }),
    ).rejects.toThrow("Files can only be registered inside your Cosmic storage space.");
  });

  it("requires explicit camera-guidance consent before a Tarot or Palmistry reading can be saved", () => {
    const baseReading = {
      profileId: null,
      readingType: "palmistry" as const,
      title: "Palm line orientation",
      readingContext: "heart-line",
      narrative: "Use this observation as a reflective prompt rather than a fixed prediction.",
      inputData: { cameraMediaStored: false },
      consentVersion: "camera-guidance-v1" as const,
    };
    expect(cosmicReadingInput.safeParse({ ...baseReading, consentAccepted: false }).success).toBe(false);
    expect(cosmicReadingInput.safeParse({ ...baseReading, consentAccepted: true }).success).toBe(true);
  });
});

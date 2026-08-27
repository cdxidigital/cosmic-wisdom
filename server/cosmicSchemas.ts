/**
 * Cosmos data contracts validate private member input before it can reach the
 * authenticated persistence layer or object storage.
 */
import { z } from "zod";

const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const clockTime = /^\d{2}:\d{2}$/;

export const cosmicProfileInput = z.object({
  displayName: z.string().trim().min(2, "Please enter your name.").max(120),
  birthDate: z.string().regex(isoDate, "Use a valid birth date."),
  birthTime: z.string().regex(clockTime, "Use a valid birth time.").optional().nullable(),
  birthLocation: z.string().trim().min(2, "Please add a birth location.").max(512),
  timezone: z.string().trim().min(1).max(64),
});

export const cosmicBriefInput = z.object({
  briefDate: z.string().regex(isoDate, "Use an ISO calendar date."),
  narrative: z.string().trim().min(1).max(20_000),
  sourceSummary: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const cosmicFileMetadataInput = z.object({
  profileId: z.number().int().positive().optional().nullable(),
  fileKind: z.enum(["report", "profile_asset", "attachment"]),
  storageKey: z.string().min(1).max(768),
  storageUrl: z.string().startsWith("/manus-storage/").max(1024),
  originalFilename: z.string().trim().min(1).max(512),
  mimeType: z.string().trim().min(1).max(160),
  byteSize: z.number().int().nonnegative().max(100_000_000).optional().nullable(),
});

export const cosmicTextReportInput = z.object({
  profileId: z.number().int().positive().optional().nullable(),
  fileName: z.string().trim().min(1).max(160),
  content: z.string().min(1).max(500_000),
});

export const cosmicProfileAssetUploadInput = z.object({
  profileId: z.number().int().positive().optional().nullable(),
  fileName: z.string().trim().min(1).max(160),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  contentBase64: z.string().min(4).max(10_500_000),
});

export const cosmicReadingInput = z.object({
  profileId: z.number().int().positive().optional().nullable(),
  readingType: z.enum(["tarot", "palmistry"]),
  title: z.string().trim().min(3).max(180),
  readingContext: z.string().trim().min(2).max(80),
  narrative: z.string().trim().min(10).max(20_000),
  inputData: z.record(z.string(), z.unknown()).optional().nullable(),
  consentAccepted: z.literal(true, { error: "Consent is required before saving a private reading." }),
  consentVersion: z.literal("camera-guidance-v1"),
});

const savedContentTypes = ["natal", "numerology", "tarot", "palmistry", "compatibility", "daily_quote"] as const;

export const cosmicSavedItemInput = z.object({
  contentKey: z.string().trim().regex(/^[a-z0-9:_-]+$/, "Use a valid saved-content key.").max(120),
  contentType: z.enum(savedContentTypes),
  title: z.string().trim().min(2).max(180),
  summary: z.string().trim().min(2).max(500),
  href: z.string().regex(/^\/(?:[a-z0-9/-]+)?$/, "Use an internal Cosmic link.").max(256),
});

export const safeReportFileName = (value: string) => {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

  return normalized || "cosmic-report.txt";
};

export const cosmicPrivateStoragePrefix = (userId: number) => `cosmic-private/${userId}/`;

export const isMemberPrivateStorageKey = (storageKey: string, userId: number) =>
  storageKey.startsWith(cosmicPrivateStoragePrefix(userId));

export const isPrivateCosmicStorageKey = (storageKey: string) => storageKey.startsWith("cosmic-private/");

export type CosmicProfileInput = z.infer<typeof cosmicProfileInput>;
export type CosmicBriefInput = z.infer<typeof cosmicBriefInput>;
export type CosmicFileMetadataInput = z.infer<typeof cosmicFileMetadataInput>;
export type CosmicProfileAssetUploadInput = z.infer<typeof cosmicProfileAssetUploadInput>;
export type CosmicReadingInput = z.infer<typeof cosmicReadingInput>;
export type CosmicSavedItemInput = z.infer<typeof cosmicSavedItemInput>;

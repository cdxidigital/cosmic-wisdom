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

export const safeReportFileName = (value: string) => {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

  return normalized || "cosmic-report.txt";
};

export type CosmicProfileInput = z.infer<typeof cosmicProfileInput>;
export type CosmicBriefInput = z.infer<typeof cosmicBriefInput>;
export type CosmicFileMetadataInput = z.infer<typeof cosmicFileMetadataInput>;
export type CosmicProfileAssetUploadInput = z.infer<typeof cosmicProfileAssetUploadInput>;

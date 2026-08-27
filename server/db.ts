/**
 * Database helpers for Cosmic keep all queries member-scoped. Private birth data
 * and stored-file references are never queried without the authenticated owner ID.
 */
import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/mysql2";
import {
  cosmicDailyBriefs,
  cosmicFiles,
  cosmicNatalCharts,
  cosmicProfiles,
  cosmicReadings,
  CosmicFile,
  CosmicNatalChart,
  CosmicProfile,
  CosmicReading,
  InsertUser,
  users,
} from "../drizzle/schema";
import type { CosmicBriefInput, CosmicFileMetadataInput, CosmicProfileInput, CosmicReadingInput } from "./cosmicSchemas";
import type { NatalCalculation } from "./natalAstrology";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Cosmic data is temporarily unavailable. Please try again shortly.");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];

  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };

  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await requireDb();
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0] ?? null;
}

export async function createLocalUser(input: { email: string; displayName: string; passwordHash: string }) {
  const db = await requireDb();
  const openId = `local_${randomUUID().replaceAll("-", "")}`;
  await db.insert(users).values({
    openId,
    name: input.displayName,
    email: input.email,
    passwordHash: input.passwordHash,
    loginMethod: "email_password",
    lastSignedIn: new Date(),
  });
  const user = await getUserByOpenId(openId);
  if (!user) throw new Error("Your account could not be created.");
  return user;
}

export async function getCosmicProfileByUserId(userId: number): Promise<CosmicProfile | null> {
  const db = await requireDb();
  const result = await db.select().from(cosmicProfiles).where(eq(cosmicProfiles.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function saveCosmicProfile(userId: number, input: CosmicProfileInput): Promise<CosmicProfile> {
  const db = await requireDb();
  await db
    .insert(cosmicProfiles)
    .values({
      userId,
      displayName: input.displayName,
      birthDate: input.birthDate,
      birthTime: input.birthTime ?? null,
      birthLocation: input.birthLocation,
      timezone: input.timezone,
      calculationStatus: "pending",
    })
    .onDuplicateKeyUpdate({
      set: {
        displayName: input.displayName,
        birthDate: input.birthDate,
        birthTime: input.birthTime ?? null,
        birthLocation: input.birthLocation,
        timezone: input.timezone,
        calculationStatus: "stale",
        calculationData: null,
        calculationVersion: null,
      },
    });

  const profile = await getCosmicProfileByUserId(userId);
  if (!profile) throw new Error("Your Cosmic profile could not be saved.");
  return profile;
}

async function requireOwnedProfile(userId: number, profileId?: number | null) {
  if (!profileId) return getCosmicProfileByUserId(userId);
  const profile = await getCosmicProfileByUserId(userId);
  if (!profile || profile.id !== profileId) throw new Error("That Cosmic profile is not available to this member.");
  return profile;
}

export async function saveCosmicDailyBrief(userId: number, input: CosmicBriefInput) {
  const profile = await requireOwnedProfile(userId);
  if (!profile) throw new Error("Create your Cosmic profile before saving a daily brief.");
  const db = await requireDb();
  await db
    .insert(cosmicDailyBriefs)
    .values({ profileId: profile.id, ...input })
    .onDuplicateKeyUpdate({ set: { narrative: input.narrative, sourceSummary: input.sourceSummary ?? null } });
  const result = await db
    .select()
    .from(cosmicDailyBriefs)
    .where(eq(cosmicDailyBriefs.profileId, profile.id))
    .orderBy(desc(cosmicDailyBriefs.briefDate))
    .limit(1);
  return result[0] ?? null;
}

export async function listCosmicDailyBriefs(userId: number) {
  const profile = await requireOwnedProfile(userId);
  if (!profile) return [];
  const db = await requireDb();
  return db.select().from(cosmicDailyBriefs).where(eq(cosmicDailyBriefs.profileId, profile.id)).orderBy(desc(cosmicDailyBriefs.briefDate)).limit(30);
}

export async function createCosmicFileRecord(userId: number, input: CosmicFileMetadataInput): Promise<CosmicFile> {
  const profile = await requireOwnedProfile(userId, input.profileId);
  const db = await requireDb();
  await db.insert(cosmicFiles).values({
    userId,
    profileId: profile?.id ?? null,
    fileKind: input.fileKind,
    storageKey: input.storageKey,
    storageUrl: input.storageUrl,
    originalFilename: input.originalFilename,
    mimeType: input.mimeType,
    byteSize: input.byteSize ?? null,
  });
  const result = await db.select().from(cosmicFiles).where(eq(cosmicFiles.storageKey, input.storageKey)).limit(1);
  if (!result[0]) throw new Error("The file reference could not be saved.");
  return result[0];
}

export async function listCosmicFiles(userId: number) {
  const db = await requireDb();
  return db.select().from(cosmicFiles).where(eq(cosmicFiles.userId, userId)).orderBy(desc(cosmicFiles.createdAt));
}

export async function getCosmicFileByUserIdAndStorageKey(userId: number, storageKey: string) {
  const db = await requireDb();
  const result = await db
    .select()
    .from(cosmicFiles)
    .where(and(eq(cosmicFiles.userId, userId), eq(cosmicFiles.storageKey, storageKey)))
    .limit(1);
  return result[0] ?? null;
}

export async function getCosmicFileByUserIdAndId(userId: number, fileId: number) {
  const db = await requireDb();
  const result = await db
    .select()
    .from(cosmicFiles)
    .where(and(eq(cosmicFiles.userId, userId), eq(cosmicFiles.id, fileId)))
    .limit(1);
  return result[0] ?? null;
}

export async function saveCosmicReading(userId: number, input: CosmicReadingInput): Promise<CosmicReading> {
  const profile = await requireOwnedProfile(userId, input.profileId);
  const db = await requireDb();
  const result = await db.insert(cosmicReadings).values({
    userId,
    profileId: profile?.id ?? null,
    readingType: input.readingType,
    title: input.title,
    readingContext: input.readingContext,
    narrative: input.narrative,
    inputData: input.inputData ?? null,
    consentVersion: input.consentVersion,
    // Camera is a momentary framing guide only. Raw palm frames are not retained by this flow.
    cameraMediaStored: 0,
  });
  const insertedId = Number(result[0].insertId);
  const reading = await db.select().from(cosmicReadings).where(eq(cosmicReadings.id, insertedId)).limit(1);
  if (!reading[0]) throw new Error("The private reading could not be saved.");
  return reading[0];
}

export async function listCosmicReadings(userId: number) {
  const db = await requireDb();
  return db.select().from(cosmicReadings).where(eq(cosmicReadings.userId, userId)).orderBy(desc(cosmicReadings.createdAt)).limit(24);
}

export async function getCosmicNatalChartByUserId(userId: number): Promise<CosmicNatalChart | null> {
  const profile = await requireOwnedProfile(userId);
  if (!profile) return null;
  const db = await requireDb();
  const result = await db.select().from(cosmicNatalCharts).where(eq(cosmicNatalCharts.profileId, profile.id)).limit(1);
  return result[0] ?? null;
}

export async function saveCosmicNatalChart(userId: number, calculation: NatalCalculation): Promise<CosmicNatalChart> {
  const profile = await requireOwnedProfile(userId);
  if (!profile) throw new Error("Save your private birth details before calculating a natal chart.");
  const db = await requireDb();
  await db.insert(cosmicNatalCharts).values({
    userId,
    profileId: profile.id,
    provider: calculation.provider,
    providerVersion: calculation.providerVersion,
    calculationStatus: "ready",
    chartData: calculation.chartData,
    readingData: calculation.readingData,
    sourceData: calculation.sourceData,
    calculatedAt: new Date(calculation.calculatedAt),
  }).onDuplicateKeyUpdate({
    set: {
      provider: calculation.provider,
      providerVersion: calculation.providerVersion,
      calculationStatus: "ready",
      chartData: calculation.chartData,
      readingData: calculation.readingData,
      sourceData: calculation.sourceData,
      calculatedAt: new Date(calculation.calculatedAt),
    },
  });
  await db.update(cosmicProfiles).set({
    calculationStatus: "ready",
    calculationVersion: calculation.providerVersion,
    calculationData: { provider: calculation.provider, calculatedAt: calculation.calculatedAt },
  }).where(eq(cosmicProfiles.id, profile.id));
  const result = await db.select().from(cosmicNatalCharts).where(eq(cosmicNatalCharts.profileId, profile.id)).limit(1);
  if (!result[0]) throw new Error("Your natal chart could not be saved.");
  return result[0];
}

export async function markCosmicNatalCalculationFailed(userId: number) {
  const profile = await requireOwnedProfile(userId);
  if (!profile) return;
  const db = await requireDb();
  await db.update(cosmicProfiles).set({ calculationStatus: "failed" }).where(eq(cosmicProfiles.id, profile.id));
}

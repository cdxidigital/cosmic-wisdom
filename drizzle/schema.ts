/**
 * Cosmic persistence model: member-owned personal pattern records stay relational,
 * calculated detail stays structured JSON, and file bytes stay in object storage.
 */
import {
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    /** Lowercase, trimmed account email. OAuth identities retain their existing value. */
    email: varchar("email", { length: 320 }),
    /** scrypt-derived local credential; never exposed to the client or returned from account procedures. */
    passwordHash: varchar("passwordHash", { length: 255 }),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  },
  table => [uniqueIndex("users_email_unique").on(table.email)],
);

/** One private primary pattern profile per authenticated member. */
export const cosmicProfiles = mysqlTable(
  "cosmicProfiles",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    displayName: varchar("displayName", { length: 120 }).notNull(),
    birthDate: varchar("birthDate", { length: 10 }).notNull(),
    birthTime: varchar("birthTime", { length: 5 }),
    birthLocation: varchar("birthLocation", { length: 512 }).notNull(),
    timezone: varchar("timezone", { length: 64 }).notNull(),
    calculationStatus: mysqlEnum("calculationStatus", ["pending", "ready", "stale", "failed"]).default("pending").notNull(),
    calculationVersion: varchar("calculationVersion", { length: 40 }),
    calculationData: json("calculationData").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("cosmicProfiles_userId_unique").on(table.userId)],
);

/** Auditable source signals that inform a Cosmic pattern reading. */
export const cosmicPatternSignals = mysqlTable(
  "cosmicPatternSignals",
  {
    id: int("id").autoincrement().primaryKey(),
    profileId: int("profileId").notNull().references(() => cosmicProfiles.id, { onDelete: "cascade" }),
    sourceSystem: mysqlEnum("sourceSystem", ["astrology", "numerology", "human_design"]).notNull(),
    signalKey: varchar("signalKey", { length: 120 }).notNull(),
    label: varchar("label", { length: 200 }).notNull(),
    detail: text("detail"),
    signalData: json("signalData").$type<Record<string, unknown> | null>(),
    observedAt: timestamp("observedAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("cosmicPatternSignals_profileId_idx").on(table.profileId)],
);

/** A dated, generated daily reading tied to a member’s private profile. */
export const cosmicDailyBriefs = mysqlTable(
  "cosmicDailyBriefs",
  {
    id: int("id").autoincrement().primaryKey(),
    profileId: int("profileId").notNull().references(() => cosmicProfiles.id, { onDelete: "cascade" }),
    briefDate: varchar("briefDate", { length: 10 }).notNull(),
    narrative: text("narrative").notNull(),
    sourceSummary: json("sourceSummary").$type<Record<string, unknown> | null>(),
    generatedAt: timestamp("generatedAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("cosmicDailyBriefs_profileId_briefDate_unique").on(table.profileId, table.briefDate),
    index("cosmicDailyBriefs_profileId_idx").on(table.profileId),
  ],
);

/** A private, source-traceable Western natal calculation for one member profile. */
export const cosmicNatalCharts = mysqlTable(
  "cosmicNatalCharts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    profileId: int("profileId").notNull().references(() => cosmicProfiles.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 80 }).notNull(),
    providerVersion: varchar("providerVersion", { length: 80 }).notNull(),
    calculationStatus: mysqlEnum("calculationStatus", ["ready", "failed"]).default("ready").notNull(),
    chartData: json("chartData").$type<Record<string, unknown>>().notNull(),
    readingData: json("readingData").$type<Record<string, unknown>>().notNull(),
    sourceData: json("sourceData").$type<Record<string, unknown>>().notNull(),
    calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("cosmicNatalCharts_profileId_unique").on(table.profileId),
    index("cosmicNatalCharts_userId_idx").on(table.userId),
  ],
);

/** Private Tarot and Palmistry reading records. Camera frames are never stored in this table. */
export const cosmicReadings = mysqlTable(
  "cosmicReadings",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    profileId: int("profileId").references(() => cosmicProfiles.id, { onDelete: "set null" }),
    readingType: mysqlEnum("readingType", ["tarot", "palmistry"]).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    readingContext: varchar("readingContext", { length: 80 }).notNull(),
    narrative: text("narrative").notNull(),
    inputData: json("inputData").$type<Record<string, unknown> | null>(),
    consentVersion: varchar("consentVersion", { length: 32 }).notNull(),
    cameraMediaStored: int("cameraMediaStored").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("cosmicReadings_userId_idx").on(table.userId), index("cosmicReadings_profileId_idx").on(table.profileId)],
);

/** Member-owned shortcuts to Cosmic Wisdom surfaces. Content is referenced by safe summary metadata only. */
export const cosmicSavedItems = mysqlTable(
  "cosmicSavedItems",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    contentKey: varchar("contentKey", { length: 120 }).notNull(),
    contentType: mysqlEnum("contentType", ["natal", "numerology", "tarot", "palmistry", "compatibility", "daily_quote"]).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    summary: varchar("summary", { length: 500 }).notNull(),
    href: varchar("href", { length: 256 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("cosmicSavedItems_userId_contentKey_unique").on(table.userId, table.contentKey),
    index("cosmicSavedItems_userId_idx").on(table.userId),
  ],
);

/** Metadata for member files. The actual bytes remain in the S3 storage layer. */
export const cosmicFiles = mysqlTable(
  "cosmicFiles",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    profileId: int("profileId").references(() => cosmicProfiles.id, { onDelete: "set null" }),
    fileKind: mysqlEnum("fileKind", ["report", "profile_asset", "attachment"]).notNull(),
    storageKey: varchar("storageKey", { length: 768 }).notNull().unique(),
    storageUrl: varchar("storageUrl", { length: 1024 }).notNull(),
    originalFilename: varchar("originalFilename", { length: 512 }).notNull(),
    mimeType: varchar("mimeType", { length: 160 }).notNull(),
    byteSize: int("byteSize"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("cosmicFiles_userId_idx").on(table.userId), index("cosmicFiles_profileId_idx").on(table.profileId)],
);

/** One-time tokens for secure password recovery. */
export const passwordResetTokens = mysqlTable(
  "passwordResetTokens",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 128 }).notNull().unique(),
    expiresAt: timestamp("expiresAt").notNull(),
    usedAt: timestamp("usedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("passwordResetTokens_userId_idx").on(table.userId)]
);

/** One-time tokens for member email verification. */
export const emailVerificationTokens = mysqlTable(
  "emailVerificationTokens",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 128 }).notNull().unique(),
    expiresAt: timestamp("expiresAt").notNull(),
    usedAt: timestamp("usedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("emailVerificationTokens_userId_idx").on(table.userId)]
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type CosmicProfile = typeof cosmicProfiles.$inferSelect;
export type CosmicDailyBrief = typeof cosmicDailyBriefs.$inferSelect;
export type CosmicFile = typeof cosmicFiles.$inferSelect;
export type CosmicReading = typeof cosmicReadings.$inferSelect;
export type CosmicNatalChart = typeof cosmicNatalCharts.$inferSelect;
export type CosmicSavedItem = typeof cosmicSavedItems.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;

/**
 * Cosmic’s tRPC boundary exposes private data only through authenticated procedures.
 * Each write resolves ownership from ctx.user instead of trusting a client-supplied user ID.
 */
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { Buffer } from "node:buffer";
import { z } from "zod";
import {
  cosmicBriefInput,
  cosmicFileMetadataInput,
  cosmicProfileAssetUploadInput,
  cosmicProfileInput,
  cosmicPrivateStoragePrefix,
  cosmicReadingInput,
  cosmicTextReportInput,
  isMemberPrivateStorageKey,
  safeReportFileName,
} from "./cosmicSchemas";
import {
  createCosmicFileRecord,
  createLocalUser,
  deleteMemberAccount,
  getCosmicFileByUserIdAndId,
  getCosmicNatalChartByUserId,
  getCosmicProfileByUserId,
  getUserByEmail,
  listCosmicDailyBriefs,
  listCosmicFiles,
  listCosmicReadings,
  markCosmicNatalCalculationFailed,
  saveCosmicDailyBrief,
  saveCosmicProfile,
  saveCosmicReading,
  saveCosmicNatalChart,
  touchUserLastSignedIn,
  updateUserPasswordHash,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { hashPassword, normalizeAccountEmail, validatePassword, verifyPassword } from "./passwordAuth";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storageGetSignedUrl, storagePut } from "./storage";
import { calculateNatalChart } from "./natalAstrology";

const localAccountInput = z.object({
  displayName: z.string().trim().min(1, "Enter your name.").max(120),
  email: z.string().trim().email("Enter a valid email address.").max(320),
  password: z.string().min(12).max(128),
});

const localSignInInput = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(320),
  password: z.string().min(1).max(128),
});

const changePasswordInput = z.object({
  currentPassword: z.string().max(128).optional(),
  newPassword: z.string().min(12).max(128),
});

const deleteAccountInput = z.object({
  confirmation: z.literal("DELETE MY ACCOUNT"),
  currentPassword: z.string().max(128).optional(),
});

const failedSignIns = new Map<string, { count: number; resetAt: number }>();
const MAX_FAILED_SIGN_INS = 5;
const SIGN_IN_WINDOW_MS = 15 * 60 * 1000;

function signInKey(email: string, ip: string | undefined) { return `${email}:${ip ?? "unknown"}`; }
function checkSignInRate(key: string) {
  const attempt = failedSignIns.get(key);
  if (!attempt) return;
  if (attempt.resetAt <= Date.now()) { failedSignIns.delete(key); return; }
  if (attempt.count >= MAX_FAILED_SIGN_INS) throw new Error("Too many sign-in attempts. Please wait 15 minutes and try again.");
}
function recordFailedSignIn(key: string) {
  const existing = failedSignIns.get(key);
  const fresh = !existing || existing.resetAt <= Date.now();
  failedSignIns.set(key, { count: fresh ? 1 : existing.count + 1, resetAt: Date.now() + SIGN_IN_WINDOW_MS });
}

async function issueLocalSession(ctx: { req: import("express").Request; res: import("express").Response }, user: { openId: string; name: string | null; email: string | null; id: number }) {
  const displayName = user.name?.trim() || "Cosmic member";
  const sessionToken = await sdk.createSessionToken(user.openId, { expiresInMs: ONE_YEAR_MS, name: displayName });
  ctx.res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
  return { id: user.id, name: displayName, email: user.email };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    registerWithEmail: publicProcedure.input(localAccountInput).mutation(async ({ ctx, input }) => {
      const email = normalizeAccountEmail(input.email);
      const passwordCheck = validatePassword(input.password);
      if (!passwordCheck.valid) throw new Error(passwordCheck.message);
      if (await getUserByEmail(email)) throw new Error("An account with that email already exists. Sign in instead.");
      const user = await createLocalUser({ email, displayName: input.displayName.trim(), passwordHash: await hashPassword(input.password) });
      return issueLocalSession(ctx, user);
    }),
    signInWithEmail: publicProcedure.input(localSignInInput).mutation(async ({ ctx, input }) => {
      const email = normalizeAccountEmail(input.email);
      const key = signInKey(email, ctx.req.ip);
      checkSignInRate(key);
      const user = await getUserByEmail(email);
      if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
        recordFailedSignIn(key);
        throw new Error("Invalid email or password.");
      }
      failedSignIns.delete(key);
      await touchUserLastSignedIn(user.id);
      return issueLocalSession(ctx, user);
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    getAccountSettings: protectedProcedure.query(({ ctx }) => ({
      name: ctx.user.name?.trim() || "Cosmic member",
      email: ctx.user.email ?? null,
      loginMethod: ctx.user.loginMethod ?? "connected account",
      hasPassword: Boolean(ctx.user.passwordHash),
    })),
    changePassword: protectedProcedure.input(changePasswordInput).mutation(async ({ ctx, input }) => {
      const passwordCheck = validatePassword(input.newPassword);
      if (!passwordCheck.valid) throw new Error(passwordCheck.message);
      if (ctx.user.passwordHash && !(await verifyPassword(input.currentPassword ?? "", ctx.user.passwordHash))) {
        throw new Error("Your current password is incorrect.");
      }
      await updateUserPasswordHash(ctx.user.id, await hashPassword(input.newPassword));
      return { success: true } as const;
    }),
    deleteAccount: protectedProcedure.input(deleteAccountInput).mutation(async ({ ctx, input }) => {
      if (ctx.user.passwordHash && !(await verifyPassword(input.currentPassword ?? "", ctx.user.passwordHash))) {
        throw new Error("Your current password is incorrect.");
      }
      const result = await deleteMemberAccount(ctx.user.id);
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true, ...result } as const;
    }),
  }),
  cosmic: router({
    getMyProfile: protectedProcedure.query(({ ctx }) => getCosmicProfileByUserId(ctx.user.id)),
    saveProfile: protectedProcedure.input(cosmicProfileInput).mutation(({ ctx, input }) => saveCosmicProfile(ctx.user.id, input)),
    listDailyBriefs: protectedProcedure.query(({ ctx }) => listCosmicDailyBriefs(ctx.user.id)),
    saveDailyBrief: protectedProcedure.input(cosmicBriefInput).mutation(({ ctx, input }) => saveCosmicDailyBrief(ctx.user.id, input)),
    listFiles: protectedProcedure.query(({ ctx }) => listCosmicFiles(ctx.user.id)),
    getFileDownloadUrl: protectedProcedure.input(z.object({ fileId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const file = await getCosmicFileByUserIdAndId(ctx.user.id, input.fileId);
      if (!file) throw new Error("That private file is not available to this member.");
      return { url: await storageGetSignedUrl(file.storageKey), originalFilename: file.originalFilename };
    }),
    listReadings: protectedProcedure.query(({ ctx }) => listCosmicReadings(ctx.user.id)),
    saveReading: protectedProcedure.input(cosmicReadingInput).mutation(({ ctx, input }) => saveCosmicReading(ctx.user.id, input)),
    getNatalChart: protectedProcedure.query(({ ctx }) => getCosmicNatalChartByUserId(ctx.user.id)),
    calculateNatalChart: protectedProcedure.input(z.object({ consentToCalculate: z.literal(true) })).mutation(async ({ ctx }) => {
      const profile = await getCosmicProfileByUserId(ctx.user.id);
      if (!profile) throw new Error("Save your private birth details before calculating a natal chart.");
      try {
        return await saveCosmicNatalChart(ctx.user.id, await calculateNatalChart(profile));
      } catch (error) {
        await markCosmicNatalCalculationFailed(ctx.user.id);
        throw error;
      }
    }),
    registerStoredFile: protectedProcedure.input(cosmicFileMetadataInput).mutation(({ ctx, input }) => {
      if (!isMemberPrivateStorageKey(input.storageKey, ctx.user.id)) throw new Error("Files can only be registered inside your private Cosmic storage space.");
      return createCosmicFileRecord(ctx.user.id, input);
    }),
    uploadTextReport: protectedProcedure.input(cosmicTextReportInput).mutation(async ({ ctx, input }) => {
      const profile = input.profileId ? await getCosmicProfileByUserId(ctx.user.id) : null;
      if (input.profileId && (!profile || profile.id !== input.profileId)) throw new Error("That Cosmic profile is not available to this member.");

      const fileName = safeReportFileName(input.fileName.endsWith(".txt") ? input.fileName : `${input.fileName}.txt`);
      const payload = Buffer.from(input.content, "utf8");
      const stored = await storagePut(`${cosmicPrivateStoragePrefix(ctx.user.id)}reports/${Date.now()}-${fileName}`, payload, "text/plain; charset=utf-8");

      return createCosmicFileRecord(ctx.user.id, {
        profileId: input.profileId ?? null,
        fileKind: "report",
        storageKey: stored.key,
        storageUrl: stored.url,
        originalFilename: fileName,
        mimeType: "text/plain",
        byteSize: payload.byteLength,
      });
    }),
    uploadProfileAsset: protectedProcedure.input(cosmicProfileAssetUploadInput).mutation(async ({ ctx, input }) => {
      const profile = await getCosmicProfileByUserId(ctx.user.id);
      if (!profile || (input.profileId && profile.id !== input.profileId)) {
        throw new Error("Save your private Cosmic profile before attaching an asset.");
      }

      const bytes = Buffer.from(input.contentBase64, "base64");
      if (!bytes.byteLength || bytes.byteLength > 7_500_000) {
        throw new Error("Profile assets must be smaller than 7.5 MB.");
      }

      const fileName = safeReportFileName(input.fileName);
      const stored = await storagePut(`${cosmicPrivateStoragePrefix(ctx.user.id)}profile-assets/${Date.now()}-${fileName}`, bytes, input.mimeType);

      return createCosmicFileRecord(ctx.user.id, {
        profileId: profile.id,
        fileKind: "profile_asset",
        storageKey: stored.key,
        storageUrl: stored.url,
        originalFilename: fileName,
        mimeType: input.mimeType,
        byteSize: bytes.byteLength,
      });
    }),
  }),
});

export type AppRouter = typeof appRouter;

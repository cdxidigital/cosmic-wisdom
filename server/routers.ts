/**
 * Cosmic’s tRPC boundary exposes private data only through authenticated procedures.
 * Each write resolves ownership from ctx.user instead of trusting a client-supplied user ID.
 */
import { COOKIE_NAME } from "@shared/const";
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
  getCosmicFileByUserIdAndId,
  getCosmicNatalChartByUserId,
  getCosmicProfileByUserId,
  listCosmicDailyBriefs,
  listCosmicFiles,
  listCosmicReadings,
  markCosmicNatalCalculationFailed,
  saveCosmicDailyBrief,
  saveCosmicProfile,
  saveCosmicReading,
  saveCosmicNatalChart,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storageGetSignedUrl, storagePut } from "./storage";
import { calculateNatalChart } from "./natalAstrology";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
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

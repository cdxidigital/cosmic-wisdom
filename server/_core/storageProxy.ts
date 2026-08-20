import type { Express } from "express";
import { getCosmicFileByUserIdAndStorageKey } from "../db";
import { isPrivateCosmicStorageKey } from "../cosmicSchemas";
import { ENV } from "./env";
import { sdk } from "./sdk";

export function parseStorageRouteKey(rawKey: string | undefined): string | null {
  if (!rawKey) return null;
  try {
    const key = decodeURIComponent(rawKey);
    const segments = key.split("/");
    if (!key || key.startsWith("/") || key.includes("\0") || segments.some(segment => segment === "." || segment === "..")) {
      return null;
    }
    return key;
  } catch {
    return null;
  }
}

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = parseStorageRouteKey((req.params as Record<string, string>)[0]);
    if (!key) {
      res.status(400).send("Invalid storage key");
      return;
    }

    if (isPrivateCosmicStorageKey(key)) {
      try {
        const user = await sdk.authenticateRequest(req);
        const file = await getCosmicFileByUserIdAndStorageKey(user.id, key);
        if (!file) {
          res.status(404).send("Private file not found");
          return;
        }
      } catch {
        res.status(401).send("Sign in to access this private file");
        return;
      }
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

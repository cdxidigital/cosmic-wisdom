import crypto from "node:crypto";
import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
const forgeUrl = process.env.BUILT_IN_FORGE_API_URL?.replace(/\/+$/, "");
const forgeKey = process.env.BUILT_IN_FORGE_API_KEY;

if (!databaseUrl || !forgeUrl || !forgeKey) {
  throw new Error("The database or object-storage configuration is unavailable.");
}

const connection = await mysql.createConnection(databaseUrl);

try {
  const [rows] = await connection.execute(
    "SELECT id, userId, storageKey, mimeType FROM cosmicFiles WHERE storageKey LIKE 'cosmic/%'",
  );

  let migrated = 0;
  for (const row of rows) {
    const sourceKey = row.storageKey;
    const getPresign = new URL("v1/storage/presign/get", `${forgeUrl}/`);
    getPresign.searchParams.set("path", sourceKey);
    const getResponse = await fetch(getPresign, { headers: { Authorization: `Bearer ${forgeKey}` } });
    if (!getResponse.ok) throw new Error(`Could not create a private migration download URL (${getResponse.status}).`);
    const { url: downloadUrl } = await getResponse.json();
    const fileResponse = await fetch(downloadUrl);
    if (!fileResponse.ok) throw new Error(`Could not copy a legacy private file (${fileResponse.status}).`);
    const bytes = Buffer.from(await fileResponse.arrayBuffer());

    const sourceName = sourceKey.split("/").pop() || "cosmic-file";
    const lastDot = sourceName.lastIndexOf(".");
    const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
    const filename = lastDot >= 0 ? `${sourceName.slice(0, lastDot)}_${suffix}${sourceName.slice(lastDot)}` : `${sourceName}_${suffix}`;
    const targetKey = `cosmic-private/${row.userId}/legacy/${filename}`;
    const putPresign = new URL("v1/storage/presign/put", `${forgeUrl}/`);
    putPresign.searchParams.set("path", targetKey);
    const putResponse = await fetch(putPresign, { headers: { Authorization: `Bearer ${forgeKey}` } });
    if (!putResponse.ok) throw new Error(`Could not create a private migration upload URL (${putResponse.status}).`);
    const { url: uploadUrl } = await putResponse.json();
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": row.mimeType || "application/octet-stream" },
      body: bytes,
    });
    if (!uploadResponse.ok) throw new Error(`Could not upload a protected private-file copy (${uploadResponse.status}).`);

    const [updateResult] = await connection.execute(
      "UPDATE cosmicFiles SET storageKey = ?, storageUrl = ? WHERE id = ? AND storageKey = ?",
      [targetKey, `/manus-storage/${targetKey}`, row.id, sourceKey],
    );
    if (updateResult.affectedRows !== 1) throw new Error("A private-file reference changed during migration; no further files were moved.");
    migrated += 1;
  }

  console.log(`Migrated ${migrated} legacy Cosmic file record(s) to protected storage.`);
} finally {
  await connection.end();
}

import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is unavailable.");

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(
    "SELECT storageKey FROM cosmicFiles WHERE storageKey LIKE 'cosmic-private/%' LIMIT 1",
  );
  if (!rows[0]?.storageKey) {
    console.log("No private Cosmic file exists yet; proxy verification skipped.");
  } else {
    const baseUrl = process.env.COSMIC_LOCAL_URL || "http://127.0.0.1:3000";
    const response = await fetch(`${baseUrl}/manus-storage/${encodeURI(rows[0].storageKey)}`, { redirect: "manual" });
    if (response.status !== 401) throw new Error(`Unauthenticated private-file request returned ${response.status}, expected 401.`);
    console.log("Private storage proxy correctly rejects unauthenticated member-file access.");
  }
} finally {
  await connection.end();
}

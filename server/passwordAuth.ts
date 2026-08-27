import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const PASSWORD_HASH_PREFIX = "scrypt-v1";

export type PasswordValidation = { valid: true } | { valid: false; message: string };

export function normalizeAccountEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function validatePassword(value: string): PasswordValidation {
  if (value.length < 12) return { valid: false, message: "Use at least 12 characters." };
  if (value.length > 128) return { valid: false, message: "Use 128 characters or fewer." };
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) {
    return { valid: false, message: "Include upper- and lowercase letters plus a number." };
  }
  return { valid: true };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = await scrypt(password, salt, KEY_LENGTH) as Buffer;
  return `${PASSWORD_HASH_PREFIX}$${salt}$${derivedKey.toString("base64url")}`;
}

export async function verifyPassword(password: string, storedValue: string | null | undefined): Promise<boolean> {
  if (!storedValue) return false;
  const [prefix, salt, encodedKey] = storedValue.split("$");
  if (prefix !== PASSWORD_HASH_PREFIX || !salt || !encodedKey) return false;
  try {
    const expectedKey = Buffer.from(encodedKey, "base64url");
    const actualKey = await scrypt(password, salt, expectedKey.length) as Buffer;
    return actualKey.length === expectedKey.length && timingSafeEqual(actualKey, expectedKey);
  } catch {
    return false;
  }
}

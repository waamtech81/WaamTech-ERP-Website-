import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "fs/promises";
import path from "path";
import { createOpaqueToken, hashToken } from "@/lib/security/crypto";

export type PendingSignup = {
  tokenHash: string;
  email: string;
  name: string;
  passwordEnc: string;
  phone?: string;
  company_name: string;
  country: string;
  profile_id: string;
  industry_id?: string;
  plan?: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
};

const STORE_DIR = path.join(process.cwd(), ".data", "verifications");
const TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

function secretKey(): Buffer {
  const raw =
    process.env.VERIFICATION_SECRET ||
    process.env.WAAMTECH_API_URL ||
    "waamto-dev-verification-secret-change-me";
  return createHash("sha256").update(raw).digest();
}

function encrypt(text: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secretKey(), iv);
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

function decrypt(payload: string): string {
  const buf = Buffer.from(payload, "base64url");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", secretKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

async function ensureDir() {
  await mkdir(STORE_DIR, { recursive: true });
}

function fileForHash(tokenHash: string) {
  return path.join(STORE_DIR, `${tokenHash}.json`);
}

export async function createPendingSignup(input: {
  email: string;
  name: string;
  password: string;
  phone?: string;
  company_name: string;
  country: string;
  profile_id: string;
  industry_id?: string;
  plan?: string;
}): Promise<{ token: string; expiresAt: number }> {
  await ensureDir();
  const token = createOpaqueToken(32);
  const tokenHash = hashToken(token);
  const now = Date.now();
  const record: PendingSignup = {
    tokenHash,
    email: input.email.toLowerCase().trim(),
    name: input.name,
    passwordEnc: encrypt(input.password),
    phone: input.phone,
    company_name: input.company_name,
    country: input.country.toUpperCase(),
    profile_id: input.profile_id,
    industry_id: input.industry_id,
    plan: input.plan,
    createdAt: now,
    expiresAt: now + TTL_MS,
    attempts: 0,
  };

  const tmp = `${fileForHash(tokenHash)}.tmp`;
  await writeFile(tmp, JSON.stringify(record), "utf8");
  await rename(tmp, fileForHash(tokenHash));
  return { token, expiresAt: record.expiresAt };
}

export async function readPendingByToken(token: string): Promise<PendingSignup | null> {
  const tokenHash = hashToken(token);
  try {
    const raw = await readFile(fileForHash(tokenHash), "utf8");
    const record = JSON.parse(raw) as PendingSignup;
    if (!record || record.expiresAt < Date.now()) {
      await deletePending(tokenHash);
      return null;
    }
    return record;
  } catch {
    return null;
  }
}

export function decryptPendingPassword(record: PendingSignup): string {
  return decrypt(record.passwordEnc);
}

export async function deletePending(tokenHash: string) {
  try {
    await unlink(fileForHash(tokenHash));
  } catch {
    /* ignore */
  }
}

export async function bumpAttempts(record: PendingSignup) {
  record.attempts += 1;
  await writeFile(fileForHash(record.tokenHash), JSON.stringify(record), "utf8");
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "***";
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}${"*".repeat(Math.max(user.length - visible.length, 2))}@${domain}`;
}

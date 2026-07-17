import { createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";

function captchaSecret() {
  return (
    process.env.CONTACT_CAPTCHA_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.RESEND_API_KEY ||
    "waamto-contact-captcha-dev"
  );
}

function sign(payload: string) {
  return createHmac("sha256", captchaSecret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  try {
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

type Pending = { exp: number; target: number };

/** One-time challenge registry (memory; Redis not required) */
const pendingChallenges = new Map<string, Pending>();
const MAX_PENDING = 5000;

function pruneChallenges(now = Date.now()) {
  for (const [nonce, row] of pendingChallenges) {
    if (row.exp <= now) pendingChallenges.delete(nonce);
  }
  if (pendingChallenges.size > MAX_PENDING) {
    const oldest = [...pendingChallenges.entries()].sort((a, b) => a[1].exp - b[1].exp);
    for (let i = 0; i < oldest.length - MAX_PENDING + 200; i++) {
      pendingChallenges.delete(oldest[i]![0]);
    }
  }
}

function registerChallenge(nonce: string, exp: number, target: number) {
  pruneChallenges();
  pendingChallenges.set(nonce, { exp, target });
}

function consumeChallenge(nonce: string): Pending | null {
  pruneChallenges();
  const row = pendingChallenges.get(nonce);
  if (!row) return null;
  if (Date.now() > row.exp) {
    pendingChallenges.delete(nonce);
    return null;
  }
  pendingChallenges.delete(nonce);
  return row;
}

const TRACK_WIDTH = 280;
const PIECE_SIZE = 44;
const TOLERANCE = 10;

function puzzleBgSvg(targetX: number, seed: number): string {
  const hue = 200 + (seed % 40);
  const gap = targetX;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${TRACK_WIDTH}" height="120" viewBox="0 0 ${TRACK_WIDTH} 120">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue},55%,42%)"/>
      <stop offset="100%" stop-color="hsl(${hue + 30},60%,28%)"/>
    </linearGradient>
    <pattern id="d" width="16" height="16" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.2" fill="rgba(255,255,255,0.18)"/>
    </pattern>
  </defs>
  <rect width="${TRACK_WIDTH}" height="120" rx="16" fill="url(#g)"/>
  <rect width="${TRACK_WIDTH}" height="120" rx="16" fill="url(#d)"/>
  <path d="M${gap} 38
    h12 a10 10 0 0 1 10 10 v4 a12 12 0 0 0 0 16 v4 a10 10 0 0 1 -10 10 h-12
    v-44 z" fill="rgba(7,21,38,0.35)"/>
  <circle cx="${gap + 22}" cy="60" r="14" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="2" stroke-dasharray="3 3"/>
</svg>`;
}

function puzzlePieceSvg(seed: number): string {
  const hue = 200 + (seed % 40);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PIECE_SIZE}" height="${PIECE_SIZE}" viewBox="0 0 ${PIECE_SIZE} ${PIECE_SIZE}">
  <defs>
    <linearGradient id="p" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue},70%,58%)"/>
      <stop offset="100%" stop-color="hsl(${hue + 25},65%,40%)"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="40" height="40" rx="10" fill="url(#p)" stroke="rgba(255,255,255,0.7)" stroke-width="2"/>
  <circle cx="22" cy="22" r="7" fill="rgba(255,255,255,0.35)"/>
</svg>`;
}

export type PuzzleCaptchaChallenge = {
  question: string;
  token: string;
  trackWidth: number;
  pieceSize: number;
  background: string;
  piece: string;
};

/**
 * Slide-to-fit puzzle captcha.
 * Target offset stays server-side (one-time nonce map) — never exposed in the token.
 */
export function createContactCaptcha(): PuzzleCaptchaChallenge {
  const seed = randomInt(1, 10_000);
  const maxX = TRACK_WIDTH - PIECE_SIZE - 8;
  const targetX = randomInt(48, Math.max(49, maxX));

  const nonce = randomBytes(16).toString("hex");
  const exp = Date.now() + 5 * 60_000;
  const payload = `v3.${nonce}.${exp}`;
  const token = `${payload}.${sign(payload)}`;

  registerChallenge(nonce, exp, targetX);

  const bg = puzzleBgSvg(targetX, seed);
  const piece = puzzlePieceSvg(seed);

  return {
    question: "Slide the piece to complete the puzzle",
    token,
    trackWidth: TRACK_WIDTH,
    pieceSize: PIECE_SIZE,
    background: `data:image/svg+xml;base64,${Buffer.from(bg).toString("base64")}`,
    piece: `data:image/svg+xml;base64,${Buffer.from(piece).toString("base64")}`,
  };
}

export type CaptchaVerifyResult =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Verify puzzle slide position. Token is single-use.
 */
export function verifyContactCaptcha(
  token: string,
  selectedRaw: unknown
): CaptchaVerifyResult {
  const tokenStr = String(token || "").trim();
  const parts = tokenStr.split(".");
  // v3.nonce.exp.sig => 4 parts
  if (parts.length !== 4 || parts[0] !== "v3") {
    return { ok: false, reason: "Invalid captcha token." };
  }

  const [, nonce, expStr, sig] = parts;
  const payload = `v3.${nonce}.${expStr}`;
  if (!safeEqual(sig || "", sign(payload))) {
    return { ok: false, reason: "Invalid captcha signature." };
  }

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) {
    return { ok: false, reason: "Captcha expired. Please open the puzzle again." };
  }

  const pending = consumeChallenge(nonce || "");
  if (!pending) {
    return { ok: false, reason: "Captcha already used. Please open the puzzle again." };
  }

  const given = Number(Array.isArray(selectedRaw) ? selectedRaw[0] : selectedRaw);
  if (!Number.isFinite(given)) {
    return { ok: false, reason: "Please complete the puzzle." };
  }

  if (Math.abs(given - pending.target) > TOLERANCE) {
    return { ok: false, reason: "Puzzle not aligned. Please try again." };
  }

  return { ok: true };
}

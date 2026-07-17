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

type IconKind = "shield" | "lock" | "cloud" | "key" | "users" | "server";

const ICON_LABELS: Record<IconKind, string> = {
  shield: "shields",
  lock: "locks",
  cloud: "clouds",
  key: "keys",
  users: "people icons",
  server: "servers",
};

const ALL_KINDS: IconKind[] = ["shield", "lock", "cloud", "key", "users", "server"];

/** One-time challenge registry (memory; Redis not required) */
const pendingChallenges = new Map<string, number>(); // nonce -> expiresAt
const MAX_PENDING = 5000;

function pruneChallenges(now = Date.now()) {
  for (const [nonce, exp] of pendingChallenges) {
    if (exp <= now) pendingChallenges.delete(nonce);
  }
  if (pendingChallenges.size > MAX_PENDING) {
    const oldest = [...pendingChallenges.entries()].sort((a, b) => a[1] - b[1]);
    for (let i = 0; i < oldest.length - MAX_PENDING + 200; i++) {
      pendingChallenges.delete(oldest[i]![0]);
    }
  }
}

function registerChallenge(nonce: string, exp: number) {
  pruneChallenges();
  pendingChallenges.set(nonce, exp);
}

/** Returns true only on first successful consume */
function consumeChallenge(nonce: string): boolean {
  pruneChallenges();
  const exp = pendingChallenges.get(nonce);
  if (exp == null) return false;
  if (Date.now() > exp) {
    pendingChallenges.delete(nonce);
    return false;
  }
  pendingChallenges.delete(nonce);
  return true;
}

function iconPath(kind: IconKind): string {
  switch (kind) {
    case "shield":
      return "M32 8 L52 16 V32 c0 14-8 24-20 28 C20 56 12 46 12 32 V16 Z";
    case "lock":
      return "M22 28 V20 a10 10 0 0 1 20 0 v8 M18 28 h28 v24 a4 4 0 0 1-4 4 H22 a4 4 0 0 1-4-4 Z M32 38 v8";
    case "cloud":
      return "M20 40 H48 a10 10 0 0 0 0-20 a14 14 0 0 0-26-4 a10 10 0 0 0-2 24 Z";
    case "key":
      return "M26 32 a10 10 0 1 1 0 0.1 M34 32 H52 M46 28 V36 M50 28 V36";
    case "users":
      return "M24 40 c0-8 6-12 12-12 s12 4 12 12 M36 18 a8 8 0 1 1 0 0.1 M16 42 c0-6 4-9 8-10 M14 22 a6 6 0 1 1 0 0.1";
    case "server":
      return "M14 16 h36 v12 H14 Z M14 32 h36 v12 H14 Z M20 22 h4 M20 38 h4";
    default:
      return "";
  }
}

function renderTileSvg(kind: IconKind, seed: number): string {
  const rot = (seed % 17) - 8;
  const hue = 200 + (seed % 40);
  const noise = Array.from({ length: 6 }, (_, i) => {
    const x = 8 + ((seed * (i + 3)) % 48);
    const y = 8 + ((seed * (i + 7)) % 48);
    const r = 1 + (seed + i) % 3;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="rgba(5,73,164,0.08)"/>`;
  }).join("");

  const stroke = `hsl(${hue} 72% 38%)`;
  const bg = `hsl(${hue} 40% 96%)`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 64 64" role="img">
  <rect width="64" height="64" rx="14" fill="${bg}"/>
  <g transform="rotate(${rot} 32 32)" fill="none" stroke="${stroke}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
    <path d="${iconPath(kind)}"/>
  </g>
  ${noise}
</svg>`;
}

export type CaptchaTile = {
  id: string;
  image: string; // data URI — no category label exposed
};

export type ImageCaptchaChallenge = {
  question: string;
  token: string;
  tiles: CaptchaTile[];
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/**
 * Hard image-match captcha: select all tiles matching a visual category.
 * Answers are HMAC-signed + one-time nonce — never sent to the client.
 */
export function createContactCaptcha(): ImageCaptchaChallenge {
  const target = ALL_KINDS[randomInt(0, ALL_KINDS.length)]!;
  const matchCount = randomInt(3, 5); // 3 or 4 matches in 9 tiles
  const tilesMeta: { id: string; kind: IconKind; seed: number }[] = [];

  for (let i = 0; i < matchCount; i++) {
    tilesMeta.push({
      id: randomBytes(8).toString("hex"),
      kind: target,
      seed: randomInt(1, 10_000),
    });
  }

  const distractors = ALL_KINDS.filter((k) => k !== target);
  while (tilesMeta.length < 9) {
    const kind = distractors[randomInt(0, distractors.length)]!;
    tilesMeta.push({
      id: randomBytes(8).toString("hex"),
      kind,
      seed: randomInt(1, 10_000),
    });
  }

  const shuffled = shuffle(tilesMeta);
  const correctIds = shuffled
    .filter((t) => t.kind === target)
    .map((t) => t.id)
    .sort();

  const nonce = randomBytes(16).toString("hex");
  const exp = Date.now() + 5 * 60_000; // 5 minutes
  const answerHash = sign(`ans:${correctIds.join(",")}`);
  const payload = `v2.${nonce}.${exp}.${answerHash}.${correctIds.length}`;
  const token = `${payload}.${sign(payload)}`;

  registerChallenge(nonce, exp);

  const tiles: CaptchaTile[] = shuffled.map((t) => {
    const svg = renderTileSvg(t.kind, t.seed);
    const image = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
    return { id: t.id, image };
  });

  return {
    question: `Select all images with ${ICON_LABELS[target]}`,
    token,
    tiles,
  };
}

export type CaptchaVerifyResult =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Verify image selection. Token is single-use — replay attacks fail.
 */
export function verifyContactCaptcha(
  token: string,
  selectedIdsRaw: unknown
): CaptchaVerifyResult {
  const tokenStr = String(token || "").trim();
  const parts = tokenStr.split(".");
  // v2.nonce.exp.answerHash.count.sig  => 6 parts
  if (parts.length !== 6 || parts[0] !== "v2") {
    return { ok: false, reason: "Invalid captcha token." };
  }

  const [, nonce, expStr, answerHash, countStr, sig] = parts;
  const payload = `v2.${nonce}.${expStr}.${answerHash}.${countStr}`;
  if (!safeEqual(sig || "", sign(payload))) {
    return { ok: false, reason: "Invalid captcha signature." };
  }

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) {
    return { ok: false, reason: "Captcha expired. Please refresh." };
  }

  if (!consumeChallenge(nonce || "")) {
    return { ok: false, reason: "Captcha already used. Please refresh." };
  }

  const selected = Array.isArray(selectedIdsRaw)
    ? selectedIdsRaw.map((id) => String(id).trim().toLowerCase()).filter(Boolean)
    : String(selectedIdsRaw || "")
        .split(",")
        .map((id) => id.trim().toLowerCase())
        .filter(Boolean);

  // Deduplicate + validate hex tile ids
  const unique = [...new Set(selected)];
  if (unique.length === 0) {
    return { ok: false, reason: "Please select the matching images." };
  }
  if (unique.some((id) => !/^[a-f0-9]{16}$/.test(id))) {
    return { ok: false, reason: "Invalid captcha selection." };
  }

  const expectedCount = Number(countStr);
  if (!Number.isFinite(expectedCount) || unique.length !== expectedCount) {
    return { ok: false, reason: "Incorrect selection. Please try again." };
  }

  const givenHash = sign(`ans:${[...unique].sort().join(",")}`);
  if (!safeEqual(givenHash, answerHash || "")) {
    return { ok: false, reason: "Incorrect selection. Please try again." };
  }

  return { ok: true };
}

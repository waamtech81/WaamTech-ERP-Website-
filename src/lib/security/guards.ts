const buckets = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

/** Sliding window rate limit. Returns null when allowed, or retry-after seconds. */
export function rateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000
): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (entry.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { ok: true };
}

export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!host) return false;

  if (!origin) {
    const fetchSite = req.headers.get("sec-fetch-site");
    if (fetchSite === "cross-site") return false;
    return true;
  }

  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

export function looksLikeBotPayload(body: Record<string, unknown>): boolean {
  const honeypot = String(body.website || body.company_url || body.fax || "").trim();
  if (honeypot) return true;

  const started = Number(body._t || body.formStartedAt || 0);
  if (started > 0 && Date.now() - started < 1200) return true;

  return false;
}

export function sanitizeText(value: unknown, max = 200): string {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254;
}

/** Block obvious scanner / exploit paths */
export const BLOCKED_PATH_PREFIXES = [
  "/.env",
  "/.git",
  "/wp-admin",
  "/wp-login",
  "/xmlrpc.php",
  "/phpmyadmin",
  "/admin.php",
  "/.aws",
  "/server-status",
  "/actuator",
  "/vendor/phpunit",
];

export function isBlockedPath(pathname: string): boolean {
  const p = pathname.toLowerCase();
  return BLOCKED_PATH_PREFIXES.some((prefix) => p === prefix || p.startsWith(prefix + "/"));
}

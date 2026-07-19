export const authConfig = {
  /** Optional SaaS Core API (locale + optional ERP portal widgets) */
  apiUrl:
    process.env.WAAMTECH_API_URL ||
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://apierp.waamto.com/api"
      : "http://localhost:5001/api"),
  /** Live WAAMTO ERP application */
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://app.waamto.com",
  trialDays: Number(process.env.NEXT_PUBLIC_TRIAL_DAYS || 14),
};

export function normalizeApiBase(url: string) {
  return url.replace(/\/+$/, "").replace(/\.+$/, "");
}

/** Build URL on the live ERP app (login, forgot password, etc.) */
export function getAppUrl(path = "", query?: Record<string, string | undefined>) {
  const raw = authConfig.appUrl.trim();
  let base: string;
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    u.hostname = u.hostname.replace(/\.+$/, "");
    base = u.origin;
  } catch {
    base = "https://app.waamto.com";
  }
  const normalizedPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  const url = new URL(`${base}${normalizedPath.replace(/\/{2,}/g, "/")}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value) url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export function getAppLoginUrl(opts?: {
  email?: string;
  verified?: boolean;
  registered?: boolean;
}) {
  return getAppUrl("/login", {
    email: opts?.email,
    username: opts?.email,
    verified: opts?.verified ? "1" : undefined,
    registered: opts?.registered ? "1" : undefined,
  });
}

/**
 * Customer Portal login on this website (waamto.com), not ERP app login.
 * Use after signup OTP / password reset so users land in the portal flow.
 */
export function getPortalLoginPath(opts?: {
  email?: string;
  next?: string;
}): string {
  const params = new URLSearchParams();
  params.set("next", opts?.next?.startsWith("/") ? opts.next : "/portal");
  if (opts?.email?.trim()) {
    params.set("email", opts.email.trim());
    params.set("username", opts.email.trim());
  }
  return `/login?${params.toString()}`;
}

/**
 * @deprecated Unused — do not wire into login. Putting tokens in a URL hash
 * is unsafe (referrer leakage, browser history). Quarantined intentionally.
 */
export function buildHandoffUrl(_payload: {
  accessToken: string;
  refreshToken: string;
  user: unknown;
}): never {
  throw new Error(
    "buildHandoffUrl is disabled for security. Use HttpOnly cookie sessions only."
  );
}

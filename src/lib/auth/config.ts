export const authConfig = {
  /** WaamTech SaaS Core API base (include /api) — server-only preferred */
  apiUrl:
    process.env.WAAMTECH_API_URL ||
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5001/api",
  /** Live WAAMTO ERP application */
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://app.waamto.com",
  trialDays: Number(process.env.NEXT_PUBLIC_TRIAL_DAYS || 14),
};

export function normalizeApiBase(url: string) {
  return url.replace(/\/+$/, "");
}

/** Build URL on the live ERP app (login, forgot password, etc.) */
export function getAppUrl(path = "", query?: Record<string, string | undefined>) {
  const base = authConfig.appUrl.replace(/\/+$/, "");
  const normalizedPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  const url = new URL(`${base}${normalizedPath}`);
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

/** @deprecated Login happens on app.waamto.com — handoff kept for legacy integrations only */
export function buildHandoffUrl(payload: {
  accessToken: string;
  refreshToken: string;
  user: unknown;
}) {
  const base = authConfig.appUrl.replace(/\/+$/, "");
  const user = encodeURIComponent(JSON.stringify(payload.user ?? {}));
  const hash = new URLSearchParams({
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    user,
  }).toString();
  return `${base}/auth/handoff#${hash}`;
}

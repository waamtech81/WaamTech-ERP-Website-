export const authConfig = {
  /** WaamTech SaaS Core API base (include /api) */
  apiUrl:
    process.env.WAAMTECH_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5001/api",
  /** SaaS app URL where users land after auth */
  appUrl:
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3001",
  trialDays: Number(process.env.NEXT_PUBLIC_TRIAL_DAYS || 14),
};

export function normalizeApiBase(url: string) {
  return url.replace(/\/+$/, "");
}

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

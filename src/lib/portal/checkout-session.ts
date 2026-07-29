/** Client-side checkout session — keep tokens out of shareable URLs. */
export const CHECKOUT_SESSION_STORAGE_KEY = "wt_portal_checkout_session";

export function saveCheckoutSessionToken(token: string): void {
  const value = String(token || "").trim();
  if (!value || typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CHECKOUT_SESSION_STORAGE_KEY, value);
  } catch {
    /* ignore quota / private mode */
  }
}

export function readCheckoutSessionToken(): string {
  if (typeof window === "undefined") return "";
  try {
    return String(sessionStorage.getItem(CHECKOUT_SESSION_STORAGE_KEY) || "").trim();
  } catch {
    return "";
  }
}

export function clearCheckoutSessionToken(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CHECKOUT_SESSION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Public checkout path — no session token in query string. */
export function portalCheckoutHref(mode = "signup", token?: string): string {
  if (token) saveCheckoutSessionToken(token);
  const params = new URLSearchParams();
  if (mode) params.set("mode", mode);
  const qs = params.toString();
  return qs ? `/portal/checkout?${qs}` : "/portal/checkout";
}

/** Prefer stored token; accept legacy `?session=` once then strip from the bar. */
export function resolveCheckoutSessionToken(sessionFromUrl: string | null | undefined): string {
  const fromUrl = String(sessionFromUrl || "").trim();
  if (fromUrl) {
    saveCheckoutSessionToken(fromUrl);
    return fromUrl;
  }
  return readCheckoutSessionToken();
}

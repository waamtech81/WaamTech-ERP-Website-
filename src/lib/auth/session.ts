import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isValidSessionToken } from "@/lib/security/session-token";

export { isValidSessionToken } from "@/lib/security/session-token";

export const PORTAL_COOKIES = {
  access: "wt_portal_at",
  refresh: "wt_portal_rt",
  remember: "wt_portal_remember",
} as const;

const ACCESS_MAX_AGE = 60 * 60 * 8; // 8h — aligns with Engine JWT_EXPIRES_IN default
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7; // 7d
const REMEMBER_REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30d

function cookieSecure() {
  return process.env.NODE_ENV === "production";
}

export type PortalSessionTokens = {
  accessToken: string;
  refreshToken: string;
  remember?: boolean;
};

export function applySessionCookies(
  res: NextResponse,
  tokens: PortalSessionTokens
) {
  if (
    !isValidSessionToken(tokens.accessToken) ||
    !isValidSessionToken(tokens.refreshToken)
  ) {
    return clearSessionCookies(res);
  }

  const secure = cookieSecure();
  const remember = Boolean(tokens.remember);
  const refreshMaxAge = remember ? REMEMBER_REFRESH_MAX_AGE : REFRESH_MAX_AGE;

  res.cookies.set(PORTAL_COOKIES.access, tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_MAX_AGE,
  });

  res.cookies.set(PORTAL_COOKIES.refresh, tokens.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: refreshMaxAge,
  });

  if (remember) {
    res.cookies.set(PORTAL_COOKIES.remember, "1", {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: refreshMaxAge,
    });
  } else {
    res.cookies.set(PORTAL_COOKIES.remember, "", {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }

  return res;
}

export function clearSessionCookies(res: NextResponse) {
  const secure = cookieSecure();
  for (const name of Object.values(PORTAL_COOKIES)) {
    res.cookies.set(name, "", {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
  return res;
}

export async function readPortalTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
  remember: boolean;
}> {
  const jar = await cookies();
  const accessRaw = jar.get(PORTAL_COOKIES.access)?.value || null;
  const refreshRaw = jar.get(PORTAL_COOKIES.refresh)?.value || null;
  return {
    accessToken: isValidSessionToken(accessRaw) ? accessRaw : null,
    refreshToken: isValidSessionToken(refreshRaw) ? refreshRaw : null,
    remember: jar.get(PORTAL_COOKIES.remember)?.value === "1",
  };
}

export async function hasPortalSession(): Promise<boolean> {
  const { accessToken, refreshToken } = await readPortalTokens();
  return Boolean(accessToken || refreshToken);
}

/**
 * Mask full license keys for API / UI. Never return the raw key to the browser.
 * Example: XXXX-XXXX-XXXX-ABCD
 */
export function maskLicenseKey(key: string | null | undefined): string {
  if (!key) return "—";
  const alnum = String(key)
    .trim()
    .replace(/[^A-Za-z0-9]/g, "");
  if (alnum.length < 4) return "XXXX-XXXX-XXXX-XXXX";
  const last = alnum.slice(-4).toUpperCase();
  return `XXXX-XXXX-XXXX-${last}`;
}

export function friendlyAuthMessage(raw?: string | null): string {
  const msg = String(raw || "").toLowerCase();
  if (msg.includes("lock")) {
    return "Your account is temporarily locked. Please try again in about 30 minutes.";
  }
  if (msg.includes("rate") || msg.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (msg.includes("otp") || msg.includes("verification code") || msg.includes("email_code")) {
    return "Invalid or expired verification code. Please try again.";
  }
  if (msg.includes("session") || msg.includes("token") || msg.includes("unauthorized")) {
    return "Your session expired. Please sign in again.";
  }
  // Never reveal whether email or password was wrong
  return "Login failed. Check your credentials and try again.";
}

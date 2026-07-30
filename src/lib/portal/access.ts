import {
  identityListLicenses,
  identityMe,
  identityRefresh,
} from "@/lib/license/identity";
import {
  applySessionCookies,
  clearSessionCookies,
  readPortalTokens,
} from "@/lib/auth/session";
import { evaluatePortalLicenseAccess } from "@/lib/portal/license-access";
import type { NextResponse } from "next/server";

export type PortalAccess = {
  accessToken: string;
  refreshed?: { accessToken: string; refreshToken: string };
};

/** Short-lived in-process cache — dedupes parallel BFF routes (e.g. security panel). */
const PORTAL_ACCESS_CACHE_MS = 30_000;
const portalAccessCache = new Map<
  string,
  { expires: number; value: Awaited<ReturnType<typeof resolvePortalAccessUncached>> }
>();

async function resolvePortalAccessUncached(): Promise<
  | { ok: true; access: PortalAccess }
  | { ok: false; status: number; message: string; code?: string }
> {
  const { accessToken, refreshToken } = await readPortalTokens();
  if (!accessToken && !refreshToken) {
    return { ok: false, status: 401, message: "Authentication required." };
  }

  let token = accessToken || "";
  let refreshed: PortalAccess["refreshed"];

  if (token) {
    const [me, licensesRes] = await Promise.all([
      identityMe(token),
      identityListLicenses(token),
    ]);
    if (me.ok && me.data?.identity) {
      const licenses = Array.isArray(licensesRes.data) ? licensesRes.data : [];
      const access = evaluatePortalLicenseAccess({
        identity: me.data.identity,
        customer: me.data.customer,
        licenses,
      });
      if (!access.ok) {
        return {
          ok: false,
          status: access.status,
          message: access.message,
          code: access.code,
        };
      }
      return { ok: true, access: { accessToken: token } };
    }
    if (me.status === 403 || me.status === 404 || me.status === 410) {
      return {
        ok: false,
        status: 403,
        code: "ACCOUNT_DELETED",
        message:
          me.message ||
          "This account is no longer available in the license system.",
      };
    }
  }

  if (refreshToken) {
    const refreshedTokens = await identityRefresh(refreshToken);
    if (refreshedTokens.ok && refreshedTokens.data?.accessToken) {
      token = refreshedTokens.data.accessToken;
      refreshed = {
        accessToken: refreshedTokens.data.accessToken,
        refreshToken: refreshedTokens.data.refreshToken || refreshToken,
      };
      const [me, licensesRes] = await Promise.all([
        identityMe(token),
        identityListLicenses(token),
      ]);
      if (me.ok && me.data?.identity) {
        const licenses = Array.isArray(licensesRes.data) ? licensesRes.data : [];
        const access = evaluatePortalLicenseAccess({
          identity: me.data.identity,
          customer: me.data.customer,
          licenses,
        });
        if (!access.ok) {
          return {
            ok: false,
            status: access.status,
            message: access.message,
            code: access.code,
          };
        }
        return { ok: true, access: { accessToken: token, refreshed } };
      }
      if (me.status === 403 || me.status === 404 || me.status === 410) {
        return {
          ok: false,
          status: 403,
          code: "ACCOUNT_DELETED",
          message:
            me.message ||
            "This account is no longer available in the license system.",
        };
      }
    }
  }

  return { ok: false, status: 401, message: "Session expired. Please sign in again." };
}

/** Resolve a valid portal access token, refreshing when needed. Blocks deleted accounts. */
export async function resolvePortalAccess(): Promise<
  | { ok: true; access: PortalAccess }
  | { ok: false; status: number; message: string; code?: string }
> {
  const { accessToken, refreshToken } = await readPortalTokens();
  const cacheKey = `${String(accessToken || "").slice(0, 24)}:${String(refreshToken || "").slice(0, 12)}`;
  const hit = portalAccessCache.get(cacheKey);
  if (hit && hit.expires > Date.now()) {
    return hit.value;
  }
  const value = await resolvePortalAccessUncached();
  if (value.ok) {
    portalAccessCache.set(cacheKey, {
      expires: Date.now() + PORTAL_ACCESS_CACHE_MS,
      value,
    });
  }
  return value;
}

export function invalidatePortalAccessCache() {
  portalAccessCache.clear();
}

export function applyPortalRefreshCookies(
  res: NextResponse,
  access: PortalAccess,
  remember?: boolean
) {
  if (access.refreshed) {
    applySessionCookies(res, {
      accessToken: access.refreshed.accessToken,
      refreshToken: access.refreshed.refreshToken,
      remember,
    });
  }
}

export function clearPortalOnUnauthorized(res: NextResponse, status: number) {
  if (status === 401 || status === 403) clearSessionCookies(res);
  return res;
}

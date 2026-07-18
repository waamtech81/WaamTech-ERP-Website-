import { identityMe, identityRefresh } from "@/lib/license/identity";
import {
  applySessionCookies,
  clearSessionCookies,
  readPortalTokens,
} from "@/lib/auth/session";
import type { NextResponse } from "next/server";

export type PortalAccess = {
  accessToken: string;
  refreshed?: { accessToken: string; refreshToken: string };
};

/** Resolve a valid portal access token, refreshing when needed. */
export async function resolvePortalAccess(): Promise<
  | { ok: true; access: PortalAccess }
  | { ok: false; status: number; message: string }
> {
  const { accessToken, refreshToken } = await readPortalTokens();
  if (!accessToken && !refreshToken) {
    return { ok: false, status: 401, message: "Authentication required." };
  }

  let token = accessToken || "";
  let refreshed: PortalAccess["refreshed"];

  if (token) {
    const me = await identityMe(token);
    if (me.ok) {
      return { ok: true, access: { accessToken: token } };
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
      const me = await identityMe(token);
      if (me.ok) {
        return { ok: true, access: { accessToken: token, refreshed } };
      }
    }
  }

  return { ok: false, status: 401, message: "Session expired. Please sign in again." };
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
  if (status === 401) clearSessionCookies(res);
  return res;
}

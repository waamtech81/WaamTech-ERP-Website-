import { NextResponse } from "next/server";
import { identityMe, identityRefresh, identityListLicenses } from "@/lib/license/identity";
import {
  applySessionCookies,
  clearSessionCookies,
  readPortalTokens,
} from "@/lib/auth/session";
import { evaluatePortalLicenseAccess } from "@/lib/portal/license-access";

/** Lightweight session probe — identity + license gate only (no dashboard aggregation). */
export async function GET() {
  const { accessToken, refreshToken } = await readPortalTokens();
  if (!accessToken && !refreshToken) {
    return NextResponse.json(
      { success: false, message: "Authentication required." },
      { status: 401, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  let token = accessToken || "";
  let refreshed: { accessToken: string; refreshToken: string } | undefined;

  const probe = async (activeToken: string) => {
    const [me, licensesRes] = await Promise.all([
      identityMe(activeToken),
      identityListLicenses(activeToken),
    ]);
    if (!me.ok || !me.data?.identity) {
      return { ok: false as const, status: me.status || 401 };
    }
    const access = evaluatePortalLicenseAccess({
      identity: me.data.identity,
      customer: me.data.customer,
      licenses: Array.isArray(licensesRes.data) ? licensesRes.data : [],
    });
    if (!access.ok) {
      return { ok: false as const, status: access.status };
    }
    return { ok: true as const };
  };

  let result = token ? await probe(token) : { ok: false as const, status: 401 };

  if (!result.ok && refreshToken) {
    const refreshedTokens = await identityRefresh(refreshToken);
    if (refreshedTokens.ok && refreshedTokens.data?.accessToken) {
      token = refreshedTokens.data.accessToken;
      refreshed = {
        accessToken: refreshedTokens.data.accessToken,
        refreshToken: refreshedTokens.data.refreshToken || refreshToken,
      };
      result = await probe(token);
    }
  }

  if (!result.ok) {
    const res = NextResponse.json(
      { success: false, message: "Session expired." },
      { status: result.status === 403 ? 403 : 401, headers: { "Cache-Control": "private, no-store" } },
    );
    if (result.status === 401 || result.status === 403) clearSessionCookies(res);
    return res;
  }

  const res = NextResponse.json(
    { success: true, data: { authenticated: true } },
    { headers: { "Cache-Control": "private, no-store" } },
  );
  if (refreshed) {
    applySessionCookies(res, {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
    });
  }
  return res;
}

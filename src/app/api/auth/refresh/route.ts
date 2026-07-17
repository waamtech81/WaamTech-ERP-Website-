import { NextResponse } from "next/server";
import { identityRefresh } from "@/lib/license/identity";
import {
  applySessionCookies,
  clearSessionCookies,
  friendlyAuthMessage,
  readPortalTokens,
} from "@/lib/auth/session";
import { getClientIp, isSameOrigin, rateLimit } from "@/lib/security/guards";

export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) {
      return NextResponse.json(
        { success: false, message: "Invalid request origin." },
        { status: 403 }
      );
    }

    const ip = getClientIp(req);
    const limited = await rateLimit(`portal-refresh:${ip}`, 30, 15 * 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        { success: false, message: "Too many refresh attempts." },
        { status: 429 }
      );
    }

    const { refreshToken, remember } = await readPortalTokens();
    if (!refreshToken) {
      const res = NextResponse.json(
        { success: false, message: "No refresh session." },
        { status: 401 }
      );
      return clearSessionCookies(res);
    }

    const result = await identityRefresh(refreshToken);
    if (!result.ok || !result.data?.accessToken || !result.data?.refreshToken) {
      const res = NextResponse.json(
        { success: false, message: friendlyAuthMessage(result.message) },
        { status: 401 }
      );
      return clearSessionCookies(res);
    }

    const res = NextResponse.json({
      success: true,
      message: "Session refreshed.",
    });
    return applySessionCookies(res, {
      accessToken: result.data.accessToken,
      refreshToken: result.data.refreshToken,
      remember,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to refresh session." },
      { status: 502 }
    );
  }
}

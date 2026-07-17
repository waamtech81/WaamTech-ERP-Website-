import { NextResponse } from "next/server";
import { loadPortalDashboard } from "@/lib/portal/dashboard";
import {
  applySessionCookies,
  clearSessionCookies,
  readPortalTokens,
} from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/security/guards";

export async function GET(req: Request) {
  try {
    if (!isSameOrigin(req)) {
      return NextResponse.json(
        { success: false, message: "Invalid request origin." },
        { status: 403 }
      );
    }

    const { accessToken, refreshToken, remember } = await readPortalTokens();
    if (!accessToken && !refreshToken) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      );
    }

    const result = await loadPortalDashboard(accessToken || "", refreshToken);
    if (!result.ok || !result.data) {
      const res = NextResponse.json(
        { success: false, message: result.message },
        { status: result.status || 401 }
      );
      if (result.status === 401) clearSessionCookies(res);
      return res;
    }

    const res = NextResponse.json({
      success: true,
      data: result.data,
    });
    res.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
    res.headers.set("Pragma", "no-cache");

    if (result.refreshed) {
      applySessionCookies(res, {
        accessToken: result.refreshed.accessToken,
        refreshToken: result.refreshed.refreshToken,
        remember,
      });
    }

    return res;
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to load portal data." },
      { status: 502 }
    );
  }
}

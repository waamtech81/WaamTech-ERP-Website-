import { NextResponse } from "next/server";
import { identityLogout, identityLogoutAll } from "@/lib/license/identity";
import {
  clearSessionCookies,
  readPortalTokens,
} from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/security/guards";

export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) {
      return NextResponse.json(
        { success: false, message: "Invalid request origin." },
        { status: 403 }
      );
    }

    let allDevices = false;
    try {
      const body = await req.json();
      allDevices = body?.allDevices === true || body?.all === true;
    } catch {
      allDevices = false;
    }

    const { accessToken, refreshToken } = await readPortalTokens();

    if (allDevices && accessToken) {
      await identityLogoutAll(accessToken);
    } else if (refreshToken) {
      await identityLogout(refreshToken);
    }

    const res = NextResponse.json({
      success: true,
      message: allDevices ? "Signed out of all devices." : "Signed out.",
      redirectUrl: "/login",
    });
    return clearSessionCookies(res);
  } catch {
    const res = NextResponse.json({
      success: true,
      message: "Signed out.",
      redirectUrl: "/login",
    });
    return clearSessionCookies(res);
  }
}

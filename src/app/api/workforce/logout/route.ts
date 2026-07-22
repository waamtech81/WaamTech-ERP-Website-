import type { NextRequest } from "next/server";
import {
  accessTokenFrom,
  clearSessionCookies,
  json,
  requireMutationRequest,
  upstream,
} from "@/lib/workforce/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const blocked = await requireMutationRequest(
    request,
    "logout",
    20,
    5 * 60_000
  );
  if (blocked) return blocked;

  const accessToken = accessTokenFrom(request);
  if (accessToken) {
    try {
      await upstream("/sso/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      // Local cookies are still removed when upstream is unavailable.
    }
  }

  const response = json({ success: true, redirectUrl: "/workforce/login" });
  clearSessionCookies(response);
  return response;
}

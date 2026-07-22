import { NextResponse, type NextRequest } from "next/server";
import {
  accessTokenFrom,
  clearSessionCookies,
  noStoreHeaders,
  validateWorkforceSession,
  workforceConfig,
} from "@/lib/workforce/auth";
import { getSiteOrigin } from "@/lib/urls";

export const runtime = "nodejs";

// Always resolve against the configured public Website origin
// (NEXT_PUBLIC_SITE_URL), never request.url — a reverse proxy / process
// manager can present an internal loopback origin (e.g. localhost:3200).
function localRedirect(path: string): NextResponse {
  return NextResponse.redirect(new URL(path, getSiteOrigin()), {
    status: 303,
    headers: noStoreHeaders(),
  });
}

export async function GET(request: NextRequest) {
  const accessToken = accessTokenFrom(request);
  if (!accessToken) {
    return localRedirect("/workforce/login?next=%2Fcontrol-center");
  }

  const session = await validateWorkforceSession(accessToken);
  if (!session.ok) {
    const response = localRedirect("/workforce/session-expired");
    clearSessionCookies(response);
    return response;
  }

  try {
    const target = workforceConfig().controlCenterUrl;
    return NextResponse.redirect(target, {
      status: 303,
      headers: noStoreHeaders({ "Referrer-Policy": "no-referrer" }),
    });
  } catch {
    return localRedirect("/workforce/access-denied");
  }
}

import { NextResponse, type NextRequest } from "next/server";
import {
  accessTokenFrom,
  clearSessionCookies,
  noStoreHeaders,
  validateWorkforceSession,
  workforceConfig,
} from "@/lib/workforce/auth";

export const runtime = "nodejs";

function localRedirect(request: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, request.url), {
    status: 303,
    headers: noStoreHeaders(),
  });
}

export async function GET(request: NextRequest) {
  const accessToken = accessTokenFrom(request);
  if (!accessToken) {
    return localRedirect(
      request,
      "/workforce/login?next=%2Fcontrol-center"
    );
  }

  const session = await validateWorkforceSession(accessToken);
  if (!session.ok) {
    const response = localRedirect(request, "/workforce/session-expired");
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
    return localRedirect(request, "/workforce/access-denied");
  }
}

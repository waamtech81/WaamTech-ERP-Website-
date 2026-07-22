import type { NextRequest } from "next/server";
import {
  accessTokenFrom,
  clearSessionCookies,
  json,
  requireMutationRequest,
  safeIdentity,
  validateWorkforceSession,
} from "@/lib/workforce/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const blocked = await requireMutationRequest(
    request,
    "session",
    120,
    60_000
  );
  if (blocked) return blocked;

  const accessToken = accessTokenFrom(request);
  if (!accessToken) {
    return json(
      { authenticated: false, reason: "missing_session" },
      { status: 401 }
    );
  }

  const session = await validateWorkforceSession(accessToken);
  if (!session.ok) {
    const response = json(
      { authenticated: false, reason: "expired_or_revoked" },
      { status: 401 }
    );
    clearSessionCookies(response);
    return response;
  }

  return json({
    authenticated: true,
    identity: safeIdentity(session.identity),
    expiresAt: session.payload.exp ?? null,
  });
}

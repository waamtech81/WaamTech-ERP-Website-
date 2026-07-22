import { NextResponse, type NextRequest } from "next/server";
import {
  clearPkceCookies,
  clearSessionCookies,
  constantEqual,
  exchangeAuthorizationCode,
  noStoreHeaders,
  readPkceContext,
  safeString,
  setSessionCookies,
  validateUpstreamSession,
  verifyAccessToken,
} from "@/lib/workforce/auth";
import { getSiteOrigin } from "@/lib/urls";

export const runtime = "nodejs";

// Redirect targets must resolve against the configured public Website origin
// (NEXT_PUBLIC_SITE_URL), never the inbound request host — a reverse proxy /
// process manager can present an internal loopback origin (e.g. localhost:3200)
// as request.url, which would otherwise leak into browser-facing redirects.
function workforceRedirect(
  path: string,
  clearAll = false
): NextResponse {
  const response = NextResponse.redirect(new URL(path, getSiteOrigin()), {
    status: 303,
    headers: noStoreHeaders(),
  });
  if (clearAll) clearSessionCookies(response);
  else clearPkceCookies(response);
  return response;
}

export async function GET(request: NextRequest) {
  const context = readPkceContext(request);
  const code = safeString(request.nextUrl.searchParams.get("code"), 4096);
  const state = safeString(request.nextUrl.searchParams.get("state"), 256);
  const providerError = safeString(
    request.nextUrl.searchParams.get("error"),
    128
  );

  if (providerError === "access_denied") {
    console.warn("[workforce-sso-callback] provider_access_denied");
    return workforceRedirect("/workforce/access-denied", true);
  }
  if (
    !context ||
    !code ||
    !state ||
    !constantEqual(state, context.state)
  ) {
    console.warn("[workforce-sso-callback] invalid_transaction");
    return workforceRedirect("/workforce/unauthorized", true);
  }

  const expectedCallback = new URL(
    "/api/workforce/sso/callback",
    getSiteOrigin()
  ).toString();
  if (context.redirectUri !== expectedCallback) {
    console.warn("[workforce-sso-callback] callback_uri_mismatch");
    return workforceRedirect("/workforce/unauthorized", true);
  }

  try {
    const exchanged = await exchangeAuthorizationCode(code, context);
    if (!exchanged.ok) {
      console.warn("[workforce-sso-callback] token_exchange_rejected");
      return workforceRedirect(
        exchanged.status === 401
          ? "/workforce/session-expired"
          : "/workforce/unauthorized",
        true
      );
    }

    const payload = await verifyAccessToken(
      exchanged.tokens.accessToken,
      context.nonce
    );
    const active = await validateUpstreamSession(
      exchanged.tokens.accessToken,
      payload.sub!,
      typeof payload.sid === "string" ? payload.sid : undefined
    );
    if (!active.ok) {
      console.warn("[workforce-sso-callback] session_inactive");
      return workforceRedirect("/workforce/unauthorized", true);
    }

    const response = NextResponse.redirect(
      new URL("/control-center", getSiteOrigin()),
      { status: 303, headers: noStoreHeaders() }
    );
    clearPkceCookies(response);
    setSessionCookies(response, exchanged.tokens, payload);
    return response;
  } catch (error) {
    console.error(
      "[workforce-sso-callback]",
      error instanceof Error ? error.message : "validation_failed"
    );
    return workforceRedirect("/workforce/unauthorized", true);
  }
}

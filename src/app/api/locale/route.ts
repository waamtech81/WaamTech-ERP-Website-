import { NextResponse } from "next/server";
import { authConfig, normalizeApiBase } from "@/lib/auth/config";
import { isSameOrigin } from "@/lib/security/guards";

/**
 * SaaS localization sync proxy.
 *
 * Bridges the marketing site to the WaamTech SaaS Core localization APIs
 * (same contract the SaaS frontend uses):
 *   - GET  /settings/public/localization  (tenant defaults, no auth)
 *   - GET  /auth/locale                   (resolved user preference, auth)
 *   - PUT  /auth/locale                   (persist user preference, auth)
 *
 * External Core calls happen here so the browser stays same-origin (CSP).
 * Every failure degrades gracefully — the site then relies on GeoIP + cookies.
 */
const base = normalizeApiBase(authConfig.apiUrl);

function authHeader(req: Request): Record<string, string> {
  const auth = req.headers.get("authorization");
  return auth ? { Authorization: auth } : {};
}

export async function GET(req: Request) {
  const auth = authHeader(req);
  const path = auth.Authorization ? "/v1/auth/locale" : "/v1/settings/public/localization";
  try {
    const res = await fetch(`${base}${path}`, {
      headers: { Accept: "application/json", ...auth },
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as {
      localization?: Record<string, unknown>;
      data?: { localization?: Record<string, unknown> };
    };
    const localization = json.localization || json.data?.localization || null;
    return NextResponse.json({ success: !!localization, localization });
  } catch {
    return NextResponse.json({ success: false, localization: null });
  }
}

export async function PUT(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json(
      { success: false, message: "Invalid request origin." },
      { status: 403 }
    );
  }
  const auth = authHeader(req);
  if (!auth.Authorization) {
    // Anonymous visitors persist locally (cookie + localStorage); nothing to sync.
    return NextResponse.json({ success: true, synced: false });
  }
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  try {
    const res = await fetch(`${base}/v1/auth/locale`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json", ...auth },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return NextResponse.json({ success: res.ok, synced: res.ok, ...json });
  } catch {
    return NextResponse.json({ success: false, synced: false });
  }
}

import { withApiHandler } from "@/lib/api/handler";
import { ApiErrorCode } from "@/lib/api/codes";
import { apiFail, apiSuccess } from "@/lib/api/response";
import { authConfig, normalizeApiBase } from "@/lib/auth/config";
import { isSameOrigin } from "@/lib/security/guards";

/**
 * SaaS localization sync proxy.
 * Failures degrade gracefully — the site then relies on GeoIP + cookies.
 */
const base = normalizeApiBase(authConfig.apiUrl);

function authHeader(req: Request): Record<string, string> {
  const auth = req.headers.get("authorization");
  return auth ? { Authorization: auth } : {};
}

export const GET = withApiHandler(
  async (req) => {
    const auth = authHeader(req);
    const path = auth.Authorization
      ? "/v1/auth/locale"
      : "/v1/settings/public/localization";
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
      return Response.json({ success: !!localization, localization });
    } catch {
      return Response.json({ success: false, localization: null });
    }
  },
  { endpoint: "/api/locale" }
);

export const PUT = withApiHandler(
  async (req) => {
    if (!isSameOrigin(req)) {
      return apiFail("Invalid request origin.", {
        status: 403,
        code: ApiErrorCode.FORBIDDEN,
      });
    }
    const auth = authHeader(req);
    if (!auth.Authorization) {
      return apiSuccess("OK", { extra: { synced: false } });
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
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...auth,
        },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      return Response.json({ success: res.ok, synced: res.ok, ...json });
    } catch {
      return Response.json({ success: false, synced: false });
    }
  },
  { endpoint: "/api/locale" }
);

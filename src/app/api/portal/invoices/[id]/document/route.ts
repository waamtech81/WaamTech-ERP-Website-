import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { apiFail } from "@/lib/api/response";
import { licenseConfig, normalizeLicenseBase } from "@/lib/license/config";
import {
  clearPortalOnUnauthorized,
  resolvePortalAccess,
} from "@/lib/portal/access";
import { isSameOrigin } from "@/lib/security/guards";

export const GET = withApiHandler(
  async (req, context) => {
    if (!isSameOrigin(req)) {
      return apiFail("Invalid request origin.", {
        status: 403,
        code: ApiErrorCode.FORBIDDEN,
      });
    }

    const params = context?.params ? await context.params : {};
    const id = String(params?.id || "").trim();
    if (!id) {
      return apiFail("Invoice is required.", {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    }

    const resolved = await resolvePortalAccess();
    if (!resolved.ok) {
      const res = apiFail(resolved.message, {
        status: resolved.status,
        code: ApiErrorCode.UNAUTHORIZED,
      });
      return clearPortalOnUnauthorized(res, resolved.status);
    }

    const base = normalizeLicenseBase(licenseConfig.apiUrl);
    for (const path of [
      `/v1/public/billing/invoices/${encodeURIComponent(id)}/document`,
      `/public/billing/invoices/${encodeURIComponent(id)}/document`,
    ]) {
      const upstream = await fetch(`${base}${path}`, {
        headers: {
          Authorization: `Bearer ${resolved.access.accessToken}`,
          Accept: "text/html",
        },
        cache: "no-store",
      });
      if (upstream.status === 404) continue;
      if (!upstream.ok) {
        return apiFail("Unable to load invoice document.", {
          status: upstream.status || 502,
        });
      }
      return new Response(upstream.body, {
        status: 200,
        headers: {
          "Content-Type":
            upstream.headers.get("content-type") || "text/html; charset=utf-8",
          "Cache-Control": "private, no-store",
        },
      });
    }

    return apiFail("Invoice document not found.", { status: 404 });
  },
  { endpoint: "/api/portal/invoices/[id]/document" }
);

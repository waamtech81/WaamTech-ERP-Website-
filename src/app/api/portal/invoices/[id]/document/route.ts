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
      const contentType =
        upstream.headers.get("content-type") || "text/html; charset=utf-8";
      // Inject Waamto favicon for browser tab branding (does not affect print/PDF CSS).
      if (contentType.includes("text/html")) {
        const html = await upstream.text();
        const faviconLinks =
          `<link rel="icon" href="/favicon.ico" sizes="any" />` +
          `<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32" />` +
          `<link rel="icon" href="/favicon-waamto-v2-32.webp" type="image/webp" sizes="32x32" />` +
          `<link rel="icon" href="/favicon-waamto-v2-48.webp" type="image/webp" sizes="48x48" />`;
        const branded = /<head([^>]*)>/i.test(html)
          ? html.replace(/<head([^>]*)>/i, `<head$1>${faviconLinks}`)
          : `${faviconLinks}${html}`;
        return new Response(branded, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "private, no-store",
          },
        });
      }
      return new Response(upstream.body, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "private, no-store",
        },
      });
    }

    return apiFail("Invoice document not found.", { status: 404 });
  },
  { endpoint: "/api/portal/invoices/[id]/document" }
);

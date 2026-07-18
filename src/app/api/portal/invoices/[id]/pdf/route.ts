import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { apiFail } from "@/lib/api/response";
import { licenseConfig, normalizeLicenseBase } from "@/lib/license/config";
import {
  clearPortalOnUnauthorized,
  resolvePortalAccess,
} from "@/lib/portal/access";
import { isSameOrigin } from "@/lib/security/guards";

async function proxyInvoiceFile(
  req: Request,
  invoiceId: string,
  kind: "pdf" | "document"
) {
  if (!isSameOrigin(req)) {
    return apiFail("Invalid request origin.", {
      status: 403,
      code: ApiErrorCode.FORBIDDEN,
    });
  }

  const id = String(invoiceId || "").trim();
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
  const paths = [
    `/v1/public/billing/invoices/${encodeURIComponent(id)}/${kind}`,
    `/public/billing/invoices/${encodeURIComponent(id)}/${kind}`,
  ];

  let lastStatus = 502;
  for (const path of paths) {
    const upstream = await fetch(`${base}${path}`, {
      headers: {
        Authorization: `Bearer ${resolved.access.accessToken}`,
        Accept: kind === "pdf" ? "application/pdf" : "text/html",
      },
      cache: "no-store",
    });
    lastStatus = upstream.status;
    if (upstream.status === 404) continue;
    if (!upstream.ok) {
      return apiFail("Unable to load invoice document.", {
        status: upstream.status || 502,
      });
    }

    const headers = new Headers();
    const contentType =
      upstream.headers.get("content-type") ||
      (kind === "pdf" ? "application/pdf" : "text/html; charset=utf-8");
    headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "private, no-store");
    const disposition = upstream.headers.get("content-disposition");
    if (disposition) headers.set("Content-Disposition", disposition);
    else if (kind === "pdf") {
      headers.set(
        "Content-Disposition",
        `attachment; filename="invoice-${id}.pdf"`
      );
    }

    return new Response(upstream.body, { status: 200, headers });
  }

  return apiFail("Invoice document not found.", { status: lastStatus || 404 });
}

export const GET = withApiHandler(
  async (req, context) => {
    const params = context?.params ? await context.params : {};
    const id = String(params?.id || "");
    return proxyInvoiceFile(req, id, "pdf");
  },
  { endpoint: "/api/portal/invoices/[id]/pdf" }
);

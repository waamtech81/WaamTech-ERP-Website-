import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { apiFail, apiSuccess } from "@/lib/api/response";
import { fetchMyInvoice } from "@/lib/commercial/client";
import { readPortalTokens } from "@/lib/auth/session";
import {
  applyPortalRefreshCookies,
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

    const result = await fetchMyInvoice(resolved.access.accessToken, id);
    if (!result.ok || !result.data) {
      return apiFail(result.message || "Invoice not found.", {
        status: result.status || 404,
      });
    }

    const { remember } = await readPortalTokens();
    const res = apiSuccess("OK", { data: result.data });
    applyPortalRefreshCookies(res, resolved.access, Boolean(remember));
    return res;
  },
  { endpoint: "/api/portal/invoices/[id]" }
);

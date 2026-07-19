import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { apiFail, apiSuccess } from "@/lib/api/response";
import {
  confirmCheckoutSession,
  fetchCheckoutSession,
} from "@/lib/commercial/client";
import { readPortalTokens } from "@/lib/auth/session";
import {
  applyPortalRefreshCookies,
  clearPortalOnUnauthorized,
  resolvePortalAccess,
} from "@/lib/portal/access";
import { isSameOrigin } from "@/lib/security/guards";

export const GET = withApiHandler(
  async (_req, routeContext) => {
    const params = await routeContext?.params;
    const sessionToken = String(params?.token || "").trim();
    if (!sessionToken) {
      return apiFail("Checkout session is required.", {
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

    const result = await fetchCheckoutSession(
      resolved.access.accessToken,
      sessionToken
    );
    if (!result.ok || !result.data) {
      return apiFail(result.message || "Checkout session not found.", {
        status: result.status || 404,
      });
    }

    const { remember } = await readPortalTokens();
    const res = apiSuccess("OK", { data: result.data });
    applyPortalRefreshCookies(res, resolved.access, Boolean(remember));
    return res;
  },
  { endpoint: "/api/portal/billing/checkout/[token]" }
);

export const POST = withApiHandler(
  async (req, routeContext) => {
    if (!isSameOrigin(req)) {
      return apiFail("Invalid request origin.", {
        status: 403,
        code: ApiErrorCode.FORBIDDEN,
      });
    }

    const params = await routeContext?.params;
    const sessionToken = String(params?.token || "").trim();
    if (!sessionToken) {
      return apiFail("Checkout session is required.", {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    }

    const body = (await req.json().catch(() => ({}))) as {
      reference?: string;
      gateway?: string;
      payment_method?: string;
      transaction_id?: string;
    };

    const resolved = await resolvePortalAccess();
    if (!resolved.ok) {
      const res = apiFail(resolved.message, {
        status: resolved.status,
        code: ApiErrorCode.UNAUTHORIZED,
      });
      return clearPortalOnUnauthorized(res, resolved.status);
    }

    const method = String(body.payment_method || "").trim();
    const txn = String(body.transaction_id || "").trim();
    const reference =
      String(body.reference || "").trim() ||
      (txn
        ? `method=${method || "manual"}|txn=${txn}`.slice(0, 240)
        : undefined);

    const result = await confirmCheckoutSession(
      resolved.access.accessToken,
      sessionToken,
      { reference, gateway: body.gateway }
    );
    if (!result.ok) {
      return apiFail(result.message || "Unable to confirm checkout.", {
        status: result.status || 502,
      });
    }

    const { remember } = await readPortalTokens();
    const res = apiSuccess(result.message || "Payment confirmed.", {
      data: result.data,
    });
    applyPortalRefreshCookies(res, resolved.access, Boolean(remember));
    return res;
  },
  { endpoint: "/api/portal/billing/checkout/[token]" }
);

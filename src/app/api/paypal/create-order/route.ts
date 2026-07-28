import { withApiHandler } from "@/lib/api/handler";
import { apiFail, apiSuccess } from "@/lib/api/response";
import { isSameOrigin } from "@/lib/security/guards";
import { resolvePortalAccess, applyPortalRefreshCookies, clearPortalOnUnauthorized } from "@/lib/portal/access";
import { fetchCheckoutSession } from "@/lib/commercial/client";
import { readPortalTokens } from "@/lib/auth/session";
import { createPayPalOrder, paypalEnabled } from "@/lib/paypal/client";
import { ApiError } from "@/lib/api/errors";
import { ApiErrorCode } from "@/lib/api/codes";

export const POST = withApiHandler(
  async (req) => {
    if (!isSameOrigin(req)) {
      return apiFail("Invalid request origin.", { status: 403 });
    }

    if (!paypalEnabled()) {
      return apiFail("PayPal is not configured.", { status: 503 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      session_token?: string;
    };
    const sessionToken = String(body.session_token || "").trim();
    if (!sessionToken) {
      return apiFail("session_token is required.", { status: 400 });
    }

    const resolved = await resolvePortalAccess();
    if (!resolved.ok) {
      const res = apiFail(resolved.message, { status: resolved.status });
      return clearPortalOnUnauthorized(res, resolved.status);
    }

    const session = await fetchCheckoutSession(
      resolved.access.accessToken,
      sessionToken
    );
    if (!session.ok || !session.data) {
      return apiFail("Checkout session not found.", { status: 404 });
    }

    const amount = Number(session.data.amount ?? 0);
    const currency = String(session.data.currency || "USD");

    if (!amount || amount <= 0) {
      return apiFail("Checkout session has an invalid amount.", { status: 400 });
    }

    let order;
    try {
      order = await createPayPalOrder({
        amount,
        currency,
        sessionToken,
        description: String(session.data.purpose || "WAAMTO ERP subscription"),
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to start PayPal checkout.";
      throw new ApiError(ApiErrorCode.VALIDATION_ERROR, {
        message,
        status: 400,
        cause: error,
      });
    }

    const { remember } = await readPortalTokens();
    const res = apiSuccess("PayPal order created.", {
      data: { order_id: order.id, status: order.status },
    });
    applyPortalRefreshCookies(res, resolved.access, Boolean(remember));
    return res;
  },
  { endpoint: "/api/paypal/create-order" }
);

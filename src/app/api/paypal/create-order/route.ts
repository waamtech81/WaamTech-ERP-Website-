import { withApiHandler } from "@/lib/api/handler";
import { apiFail, apiSuccess } from "@/lib/api/response";
import { isSameOrigin } from "@/lib/security/guards";
import { resolvePortalAccess, applyPortalRefreshCookies, clearPortalOnUnauthorized } from "@/lib/portal/access";
import { fetchCheckoutSession } from "@/lib/commercial/client";
import { readPortalTokens } from "@/lib/auth/session";
import { createPayPalOrder, paypalEnabled } from "@/lib/paypal/client";

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

    const order = await createPayPalOrder({
      amount,
      currency,
      sessionToken,
      description: String(session.data.purpose || "WAAMTO ERP subscription"),
    });

    const { remember } = await readPortalTokens();
    const res = apiSuccess("PayPal order created.", {
      data: { order_id: order.id, status: order.status },
    });
    applyPortalRefreshCookies(res, resolved.access, Boolean(remember));
    return res;
  },
  { endpoint: "/api/paypal/create-order" }
);

import { withApiHandler } from "@/lib/api/handler";
import { apiFail, apiSuccess } from "@/lib/api/response";
import { isSameOrigin } from "@/lib/security/guards";
import {
  resolvePortalAccess,
  applyPortalRefreshCookies,
  clearPortalOnUnauthorized,
} from "@/lib/portal/access";
import { confirmCheckoutSession, fetchCheckoutSession } from "@/lib/commercial/client";
import { readPortalTokens } from "@/lib/auth/session";
import { capturePayPalOrder, paypalEnabled } from "@/lib/paypal/client";
import { sendPaymentNotificationEmail } from "@/lib/auth/email";

export const POST = withApiHandler(
  async (req) => {
    if (!isSameOrigin(req)) {
      return apiFail("Invalid request origin.", { status: 403 });
    }

    if (!paypalEnabled()) {
      return apiFail("PayPal is not configured.", { status: 503 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      order_id?: string;
      session_token?: string;
    };
    const orderId = String(body.order_id || "").trim();
    const sessionToken = String(body.session_token || "").trim();

    if (!orderId || !sessionToken) {
      return apiFail("order_id and session_token are required.", { status: 400 });
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

    // Capture the payment on PayPal
    const capture = await capturePayPalOrder(orderId);

    if (capture.status !== "COMPLETED") {
      return apiFail(
        `PayPal payment is ${capture.status || "incomplete"}. Please try again.`,
        { status: 400 }
      );
    }

    const captureUnit = capture.purchase_units?.[0]?.payments?.captures?.[0];
    const captureId = captureUnit?.id || orderId;
    const capturedAmount = captureUnit?.amount?.value;
    const capturedCurrency = captureUnit?.amount?.currency_code;

    // Build reference string for License Engine
    const reference = `method=paypal|txn=${captureId}|order=${orderId}`.slice(0, 240);

    // Confirm on License Engine — gateway must match the checkout session (often manual when LE PayPal is off).
    const confirm = await confirmCheckoutSession(
      resolved.access.accessToken,
      sessionToken,
      {
        reference,
        gateway: String(session.data.gateway || "manual"),
      }
    );

    // Notify superadmin (non-blocking — never fail the user response)
    // Extract email from JWT payload (for display only, no signature check)
    let userEmail = "portal user";
    try {
      const jwtPayload = JSON.parse(
        Buffer.from(resolved.access.accessToken.split(".")[1], "base64url").toString()
      ) as Record<string, unknown>;
      userEmail = String(
        jwtPayload.email || jwtPayload.sub || jwtPayload.username || "portal user"
      );
    } catch {
      /* ignore — token may not be parseable */
    }

    void sendPaymentNotificationEmail({
      userEmail,
      amount: capturedAmount,
      currency: capturedCurrency,
      transactionId: captureId,
      orderId,
      sessionToken,
      engineOk: confirm.ok,
    }).catch(() => {});

    const { remember } = await readPortalTokens();
    const res = apiSuccess(
      confirm.ok ? "Payment confirmed." : "Payment captured — pending confirmation.",
      {
        data: {
          capture_id: captureId,
          engine_ok: confirm.ok,
        },
      }
    );
    applyPortalRefreshCookies(res, resolved.access, Boolean(remember));
    return res;
  },
  { endpoint: "/api/paypal/capture-order" }
);

import { NextRequest } from "next/server";
import { apiSuccess, apiFail } from "@/lib/api/response";
import { verifyPayPalWebhook } from "@/lib/paypal/client";
import { sendPaymentNotificationEmail } from "@/lib/auth/email";
import { licenseConfig } from "@/lib/license/config";

type PayPalWebhookEvent = {
  event_type?: string;
  resource?: {
    id?: string;
    status?: string;
    custom_id?: string;
    amount?: { value?: string; currency_code?: string };
    supplementary_data?: {
      related_ids?: { order_id?: string };
    };
  };
};

/** POST /api/paypal/webhook — receives PayPal payment events. */
export async function POST(req: NextRequest) {
  // Read raw body for signature verification
  const body = await req.text();

  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim();

  // Verify signature when webhook ID is configured
  if (webhookId) {
    const verified = await verifyPayPalWebhook({
      webhookId,
      transmissionId: req.headers.get("paypal-transmission-id") || "",
      transmissionTime: req.headers.get("paypal-transmission-time") || "",
      certUrl: req.headers.get("paypal-cert-url") || "",
      authAlgo: req.headers.get("paypal-auth-algo") || "",
      transmissionSig: req.headers.get("paypal-transmission-sig") || "",
      body,
    });

    if (!verified) {
      return apiFail("Webhook signature verification failed.", { status: 401 });
    }
  }

  let event: PayPalWebhookEvent;
  try {
    event = JSON.parse(body) as PayPalWebhookEvent;
  } catch {
    return apiFail("Invalid JSON body.", { status: 400 });
  }

  const eventType = event.event_type || "";
  const resource = event.resource || {};
  const captureId = resource.id || "";
  const captureStatus = resource.status || "";
  const sessionToken = resource.custom_id || "";
  const amount = resource.amount?.value;
  const currency = resource.amount?.currency_code;
  const orderId = resource.supplementary_data?.related_ids?.order_id || "";

  // PAYMENT.CAPTURE.COMPLETED — payment was successfully captured
  if (eventType === "PAYMENT.CAPTURE.COMPLETED" && captureStatus === "COMPLETED") {
    // Attempt to confirm with License Engine using the server API key (if mounted)
    if (sessionToken && licenseConfig.apiKey) {
      try {
        const reference = `method=paypal|txn=${captureId}|order=${orderId}`.slice(0, 240);
        const url = `${licenseConfig.apiUrl}/v1/public/billing/checkout/${encodeURIComponent(sessionToken)}/confirm`;

        await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": licenseConfig.apiKey,
            Authorization: `Bearer ${licenseConfig.apiKey}`,
          },
          body: JSON.stringify({ reference, gateway: "paypal" }),
          cache: "no-store",
        }).catch(() => {});
      } catch {
        // Webhook confirmation best-effort — superadmin email will alert
      }
    }

    // Notify superadmin
    void sendPaymentNotificationEmail({
      userEmail: "via PayPal webhook",
      amount,
      currency,
      transactionId: captureId,
      orderId,
      sessionToken,
      engineOk: Boolean(sessionToken && licenseConfig.apiKey),
      source: "webhook",
    }).catch(() => {});
  }

  // PAYMENT.CAPTURE.DENIED or PAYMENT.CAPTURE.REVERSED
  if (
    eventType === "PAYMENT.CAPTURE.DENIED" ||
    eventType === "PAYMENT.CAPTURE.REVERSED"
  ) {
    void sendPaymentNotificationEmail({
      userEmail: "via PayPal webhook",
      amount,
      currency,
      transactionId: captureId,
      orderId,
      sessionToken,
      engineOk: false,
      source: "webhook",
      status: captureStatus,
      eventType,
    }).catch(() => {});
  }

  // Always return 200 so PayPal stops retrying
  return apiSuccess("Webhook received.", {});
}

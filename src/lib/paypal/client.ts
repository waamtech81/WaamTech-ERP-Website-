/** Server-side PayPal REST API v2 client. Reads from PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET. */

const PAYPAL_BASE =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const secret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  if (!clientId || !secret) throw new Error("PayPal credentials not configured.");

  const creds = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PayPal auth failed (${res.status}): ${text}`);
  }
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

export type PayPalOrderResult = {
  id: string;
  status: string;
};

export type PayPalCaptureUnit = {
  id: string;
  status: string;
  amount?: { value: string; currency_code: string };
  custom_id?: string;
};

export type PayPalCaptureResult = {
  id: string;
  status: string;
  purchase_units: Array<{
    reference_id?: string;
    custom_id?: string;
    payments?: {
      captures?: PayPalCaptureUnit[];
    };
  }>;
};

export async function createPayPalOrder(opts: {
  amount: number;
  currency: string;
  sessionToken: string;
  description?: string;
}): Promise<PayPalOrderResult> {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: opts.sessionToken.slice(0, 255),
          custom_id: opts.sessionToken.slice(0, 127),
          description: (opts.description || "WAAMTO ERP subscription").slice(0, 127),
          amount: {
            currency_code: opts.currency.toUpperCase(),
            value: Number(opts.amount).toFixed(2),
          },
        },
      ],
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string; name?: string };
    throw new Error(err.message || err.name || `PayPal create order: ${res.status}`);
  }
  return res.json() as Promise<PayPalOrderResult>;
}

export async function capturePayPalOrder(
  orderId: string
): Promise<PayPalCaptureResult> {
  const token = await getAccessToken();

  const res = await fetch(
    `${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string; name?: string };
    throw new Error(err.message || err.name || `PayPal capture: ${res.status}`);
  }
  return res.json() as Promise<PayPalCaptureResult>;
}

export async function verifyPayPalWebhook(opts: {
  webhookId: string;
  transmissionId: string;
  transmissionTime: string;
  certUrl: string;
  authAlgo: string;
  transmissionSig: string;
  body: string;
}): Promise<boolean> {
  try {
    const token = await getAccessToken();
    const res = await fetch(
      `${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth_algo: opts.authAlgo,
          cert_url: opts.certUrl,
          client_id: process.env.PAYPAL_CLIENT_ID,
          transmission_id: opts.transmissionId,
          transmission_sig: opts.transmissionSig,
          transmission_time: opts.transmissionTime,
          webhook_id: opts.webhookId,
          webhook_event: JSON.parse(opts.body),
        }),
        cache: "no-store",
      }
    );
    if (!res.ok) return false;
    const json = (await res.json()) as { verification_status?: string };
    return json.verification_status === "SUCCESS";
  } catch {
    return false;
  }
}

export function paypalEnabled(): boolean {
  return Boolean(
    process.env.PAYPAL_CLIENT_ID?.trim() &&
      process.env.PAYPAL_CLIENT_SECRET?.trim()
  );
}

export function paypalMode(): "sandbox" | "live" {
  return process.env.PAYPAL_MODE === "live" ? "live" : "sandbox";
}

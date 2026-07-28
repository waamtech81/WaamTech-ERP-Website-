import { withApiHandler } from "@/lib/api/handler";
import { apiFail, apiSuccess } from "@/lib/api/response";
import { paypalEnabled, paypalMode } from "@/lib/paypal/client";

/** Returns the public PayPal client ID so the frontend can load the SDK. */
export const GET = withApiHandler(
  async () => {
    if (!paypalEnabled()) {
      return apiFail("PayPal is not configured on this server.", { status: 503 });
    }
    return apiSuccess("OK", {
      data: {
        client_id: process.env.PAYPAL_CLIENT_ID!.trim(),
        mode: paypalMode(),
      },
    });
  },
  { endpoint: "/api/paypal/config" }
);

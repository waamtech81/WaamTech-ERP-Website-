import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { apiFail, apiSuccess } from "@/lib/api/response";
import { requestSubscriptionRenewal } from "@/lib/commercial/client";
import { readPortalTokens } from "@/lib/auth/session";
import {
  applyPortalRefreshCookies,
  clearPortalOnUnauthorized,
  resolvePortalAccess,
} from "@/lib/portal/access";
import { resolvePreferredGateway } from "@/lib/portal/gateway";
import { isSameOrigin } from "@/lib/security/guards";
import { getSiteOrigin } from "@/lib/urls";

export const POST = withApiHandler(
  async (req) => {
    if (!isSameOrigin(req)) {
      return apiFail("Invalid request origin.", {
        status: 403,
        code: ApiErrorCode.FORBIDDEN,
      });
    }

    const body = (await req.json().catch(() => ({}))) as {
      subscription_id?: string;
      gateway?: string;
    };
    const subscriptionId = String(body.subscription_id || "").trim();
    if (!subscriptionId) {
      return apiFail("Subscription is required.", {
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

    const gateway = await resolvePreferredGateway(
      resolved.access.accessToken,
      body.gateway
    );
    const origin = getSiteOrigin();
    const result = await requestSubscriptionRenewal(
      resolved.access.accessToken,
      subscriptionId,
      {
        gateway,
        success_url: `${origin}/portal/checkout/success`,
        cancel_url: `${origin}/portal/checkout/cancel`,
      }
    );

    if (!result.ok || !result.data) {
      return apiFail(result.message || "Unable to start renewal.", {
        status: result.status || 502,
      });
    }

    const { remember } = await readPortalTokens();
    const res = apiSuccess(result.message || "Renewal checkout created.", {
      data: result.data,
    });
    applyPortalRefreshCookies(res, resolved.access, Boolean(remember));
    return res;
  },
  { endpoint: "/api/portal/billing/renew" }
);

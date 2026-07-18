import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { apiFail, apiSuccess } from "@/lib/api/response";
import { requestPlanChange, requestTrialConvert } from "@/lib/commercial/client";
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
      to_plan_id?: string;
      gateway?: string;
      billing_cycle?: string;
      mode?: string;
    };
    const subscriptionId = String(body.subscription_id || "").trim();
    const toPlanId = String(body.to_plan_id || "").trim();
    const isTrialConvert =
      body.mode === "trial-convert" || Boolean(body.billing_cycle);

    if (!subscriptionId) {
      return apiFail("Subscription is required.", {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    }
    if (!isTrialConvert && !toPlanId) {
      return apiFail("Subscription and plan are required.", {
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

    const result = isTrialConvert
      ? await requestTrialConvert(resolved.access.accessToken, {
          subscription_id: subscriptionId,
          billing_cycle: String(body.billing_cycle || "yearly"),
          plan_id: toPlanId || undefined,
          gateway,
          success_url: `${origin}/portal/checkout/success`,
          cancel_url: `${origin}/portal/checkout/cancel`,
        })
      : await requestPlanChange(resolved.access.accessToken, {
          subscription_id: subscriptionId,
          to_plan_id: toPlanId,
          timing: "immediate",
          gateway,
        });

    if (!result.ok || !result.data) {
      return apiFail(result.message || "Unable to start plan upgrade.", {
        status: result.status || 502,
      });
    }

    const { remember } = await readPortalTokens();
    const res = apiSuccess(result.message || "Plan change created.", {
      data: result.data,
    });
    applyPortalRefreshCookies(res, resolved.access, Boolean(remember));
    return res;
  },
  { endpoint: "/api/portal/billing/plan-change" }
);

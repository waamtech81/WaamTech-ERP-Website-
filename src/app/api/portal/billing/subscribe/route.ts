import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { apiFail, apiSuccess } from "@/lib/api/response";
import {
  fetchMySubscriptions,
  requestAdditionalSubscription,
  requestPlanChange,
  requestSubscriptionRenewal,
  requestTrialConvert,
} from "@/lib/commercial/client";
import { readPortalTokens } from "@/lib/auth/session";
import {
  applyPortalRefreshCookies,
  clearPortalOnUnauthorized,
  resolvePortalAccess,
} from "@/lib/portal/access";
import { resolvePreferredGateway } from "@/lib/portal/gateway";
import { isSameOrigin, sanitizeText } from "@/lib/security/guards";
import { getSiteOrigin } from "@/lib/urls";

async function resolveSubscriptionId(
  accessToken: string,
  requested: string
): Promise<string> {
  if (requested) return requested;
  const subs = await fetchMySubscriptions(accessToken, { limit: 50 });
  const rows = Array.isArray(subs.data?.data) ? subs.data.data : [];
  const preferred =
    rows.find((s) =>
      ["trial", "trialing", "active", "grace", "pending", "suspended"].includes(
        String(s.status || "").toLowerCase()
      )
    ) || rows[0];
  return preferred?.id ? String(preferred.id) : "";
}

/**
 * Unified portal subscribe entry:
 * - renew: renew existing subscription
 * - upgrade: plan-change on existing subscription (optional industry/category forwarded)
 * - new_place: additional subscription under same identity
 * - trial-convert: convert trial
 */
export const POST = withApiHandler(
  async (req) => {
    if (!isSameOrigin(req)) {
      return apiFail("Invalid request origin.", {
        status: 403,
        code: ApiErrorCode.FORBIDDEN,
      });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    let mode = sanitizeText(body.mode || body.intent || "upgrade", 40);
    let subscriptionId = sanitizeText(body.subscription_id, 80);
    const toPlanId = sanitizeText(body.to_plan_id || body.plan_id, 80);
    const industryId = sanitizeText(body.industry_id, 80);
    const categoryId = sanitizeText(
      body.category_id || body.business_category_id,
      80
    );
    const profileId = sanitizeText(body.business_profile_id || body.profile_id, 80);
    const billingCycle = sanitizeText(body.billing_cycle || "yearly", 20);
    const companyName = sanitizeText(body.company_name, 160);
    const productId = sanitizeText(body.product_id, 80);

    const resolved = await resolvePortalAccess();
    if (!resolved.ok) {
      const res = apiFail(resolved.message, {
        status: resolved.status,
        code:
          resolved.status === 403
            ? ApiErrorCode.FORBIDDEN
            : ApiErrorCode.UNAUTHORIZED,
        ...(resolved.code ? { extra: { reason: resolved.code } } : {}),
      });
      return clearPortalOnUnauthorized(res, resolved.status);
    }

    const gateway = await resolvePreferredGateway(
      resolved.access.accessToken,
      sanitizeText(body.gateway || body.payment_method, 40) || null
    );
    const origin = getSiteOrigin();
    const successUrl = `${origin}/portal/checkout/success`;
    const cancelUrl = `${origin}/portal/checkout/cancel`;

    if (
      !subscriptionId &&
      (mode === "renew" ||
        mode === "upgrade" ||
        mode === "trial-convert" ||
        mode === "trial_convert")
    ) {
      subscriptionId = await resolveSubscriptionId(
        resolved.access.accessToken,
        ""
      );
    }

    // Trial pay with no commercial subscription → create checkout via additional subscription.
    if (
      !subscriptionId &&
      (mode === "renew" ||
        mode === "upgrade" ||
        mode === "trial-convert" ||
        mode === "trial_convert") &&
      toPlanId &&
      industryId &&
      categoryId
    ) {
      mode = "new_place";
    }

    let result;

    if (mode === "renew") {
      if (!subscriptionId) {
        return apiFail(
          "No subscription found to renew. If you are on trial, choose industry, category, and a plan to activate.",
          {
            status: 400,
            code: ApiErrorCode.VALIDATION_ERROR,
          }
        );
      }
      result = await requestSubscriptionRenewal(
        resolved.access.accessToken,
        subscriptionId,
        { gateway, success_url: successUrl, cancel_url: cancelUrl }
      );
    } else if (mode === "trial-convert" || mode === "trial_convert") {
      if (!subscriptionId) {
        return apiFail(
          "No trial subscription found. Choose industry, category, and a plan to activate your trial.",
          {
            status: 400,
            code: ApiErrorCode.VALIDATION_ERROR,
          }
        );
      }
      result = await requestTrialConvert(resolved.access.accessToken, {
        subscription_id: subscriptionId,
        billing_cycle: billingCycle || "yearly",
        plan_id: toPlanId || undefined,
        gateway,
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
    } else if (mode === "new_place" || mode === "add_place" || mode === "additional") {
      if (!toPlanId || !industryId || !categoryId) {
        return apiFail(
          "Industry, category, and plan are required to add a new place.",
          { status: 400, code: ApiErrorCode.VALIDATION_ERROR }
        );
      }
      result = await requestAdditionalSubscription(resolved.access.accessToken, {
        plan_id: toPlanId,
        product_id: productId || undefined,
        industry_id: industryId,
        category_id: categoryId,
        business_profile_id: profileId || undefined,
        billing_cycle: billingCycle || "yearly",
        gateway,
        success_url: successUrl,
        cancel_url: cancelUrl,
        company_name: companyName || undefined,
      });
    } else {
      // upgrade (default)
      if (!subscriptionId || !toPlanId) {
        return apiFail("Subscription and plan are required.", {
          status: 400,
          code: ApiErrorCode.VALIDATION_ERROR,
        });
      }
      result = await requestPlanChange(resolved.access.accessToken, {
        subscription_id: subscriptionId,
        to_plan_id: toPlanId,
        timing: "immediate",
        gateway,
        success_url: successUrl,
        cancel_url: cancelUrl,
        billing_cycle: billingCycle || undefined,
        industry_id: industryId || undefined,
        category_id: categoryId || undefined,
        business_profile_id: profileId || undefined,
      });
    }

    if (!result.ok || !result.data) {
      return apiFail(
        result.message ||
          (mode === "new_place"
            ? "Unable to start new place checkout. License Engine may still need the additional-subscription API."
            : "Unable to start checkout."),
        {
          status: result.status || 502,
        }
      );
    }

    const { remember } = await readPortalTokens();
    const res = apiSuccess(result.message || "Checkout ready.", {
      data: {
        ...((result.data as object) || {}),
        mode,
        gateway,
        plan_id: toPlanId || null,
        industry_id: industryId || null,
        category_id: categoryId || null,
        billing_cycle: billingCycle || null,
      },
    });
    applyPortalRefreshCookies(res, resolved.access, Boolean(remember));
    return res;
  },
  { endpoint: "/api/portal/billing/subscribe" }
);

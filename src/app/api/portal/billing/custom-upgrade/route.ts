import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { apiFail, apiSuccess } from "@/lib/api/response";
import { requestCustomErpUpgrade } from "@/lib/commercial/client";
import { validateCustomErpBillingCycle } from "@/lib/commercial/custom-erp-billing";
import { readPortalTokens } from "@/lib/auth/session";
import {
  applyPortalRefreshCookies,
  clearPortalOnUnauthorized,
  resolvePortalAccess,
} from "@/lib/portal/access";
import { invalidatePortalDashboardCache } from "@/lib/portal/dashboard";
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
      selected_modules?: string[];
      selected_feature_packs?: string[];
      user_limit?: number | null;
      company_limit?: number | null;
      branch_limit?: number | null;
      warehouse_limit?: number | null;
      billing_cycle?: string;
      coupon?: string | null;
      gateway?: string;
    };

    const subscriptionId = String(body.subscription_id || "").trim();
    if (!subscriptionId) {
      return apiFail("subscription_id is required.", {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    }

    let billingCycle = body.billing_cycle;
    if (billingCycle != null && String(billingCycle).trim() !== "") {
      const cycleCheck = validateCustomErpBillingCycle(billingCycle);
      if (!cycleCheck.ok) {
        return apiFail(cycleCheck.message, {
          status: 400,
          code: ApiErrorCode.VALIDATION_ERROR,
        });
      }
      billingCycle = cycleCheck.cycle;
    }

    const selectedModules = Array.isArray(body.selected_modules)
      ? body.selected_modules.filter(Boolean)
      : [];
    if (selectedModules.length === 0) {
      return apiFail("At least one module must be selected for upgrade.", {
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

    const result = await requestCustomErpUpgrade(resolved.access.accessToken, {
      subscription_id: subscriptionId,
      selected_modules: selectedModules,
      selected_feature_packs: Array.isArray(body.selected_feature_packs)
        ? body.selected_feature_packs.filter(Boolean)
        : [],
      user_limit: body.user_limit ?? null,
      company_limit: body.company_limit ?? null,
      branch_limit: body.branch_limit ?? null,
      warehouse_limit: body.warehouse_limit ?? null,
      billing_cycle: billingCycle,
      coupon: body.coupon ?? null,
      gateway,
      success_url: `${origin}/portal/checkout/success`,
      cancel_url: `${origin}/portal/checkout/cancel`,
    });

    if (!result.ok || !result.data) {
      return apiFail(result.message || "Unable to create upgrade checkout.", {
        status: result.status || 502,
      });
    }

    const { remember } = await readPortalTokens();
    // Bust portal aggregate so licenses/limits/modules refresh after upgrade checkout starts.
    invalidatePortalDashboardCache();
    const res = apiSuccess("Upgrade checkout created.", { data: result.data });
    applyPortalRefreshCookies(res, resolved.access, Boolean(remember));
    return res;
  },
  { endpoint: "/api/portal/billing/custom-upgrade" }
);

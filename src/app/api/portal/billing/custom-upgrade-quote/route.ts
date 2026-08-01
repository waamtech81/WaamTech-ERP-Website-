import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { apiFail, apiSuccess } from "@/lib/api/response";
import { fetchBillingCompany, fetchCustomErpUpgradeCouponVisibility } from "@/lib/commercial/client";
import { validateCustomErpBillingCycle } from "@/lib/commercial/custom-erp-billing";
import {
  applyPortalRefreshCookies,
  clearPortalOnUnauthorized,
  resolvePortalAccess,
} from "@/lib/portal/access";
import { quoteCustomErpUpgradePayable } from "@/lib/portal/custom-upgrade-quote";
import { isSameOrigin } from "@/lib/security/guards";
import { readPortalTokens } from "@/lib/auth/session";

export const POST = withApiHandler(
  async (req) => {
    if (!isSameOrigin(req)) {
      return apiFail("Invalid request origin.", {
        status: 403,
        code: ApiErrorCode.FORBIDDEN,
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

    const body = (await req.json().catch(() => ({}))) as {
      product_slug?: string;
      billing_cycle?: string;
      selected_modules?: string[];
      selected_feature_packs?: string[];
      user_limit?: number | null;
      company_limit?: number | null;
      branch_limit?: number | null;
      warehouse_limit?: number | null;
      discount_code?: string | null;
    };

    const selectedModules = Array.isArray(body.selected_modules)
      ? body.selected_modules.filter(Boolean)
      : [];
    if (!selectedModules.length) {
      return apiFail("At least one module must be selected.", {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    }

    const cycleCheck = validateCustomErpBillingCycle(body.billing_cycle || "monthly");
    if (!cycleCheck.ok) {
      return apiFail(cycleCheck.message, {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    }

    const companyRes = await fetchBillingCompany(resolved.access.accessToken);
    const company =
      companyRes.ok && companyRes.data && typeof companyRes.data === "object"
        ? (companyRes.data as Record<string, unknown>)
        : null;

    const quoted = await quoteCustomErpUpgradePayable({
      company,
      body: {
        product_slug: body.product_slug || "waamto-erp",
        billing_cycle: cycleCheck.cycle,
        selected_modules: selectedModules,
        selected_feature_packs: Array.isArray(body.selected_feature_packs)
          ? body.selected_feature_packs.filter(Boolean)
          : [],
        user_limit: body.user_limit,
        company_limit: body.company_limit,
        branch_limit: body.branch_limit,
        warehouse_limit: body.warehouse_limit,
        discount_code: body.discount_code ?? null,
      },
    });

    if (!quoted.ok) {
      return apiFail(quoted.message, { status: quoted.status });
    }

    const couponVis = await fetchCustomErpUpgradeCouponVisibility(resolved.access.accessToken);

    const { remember } = await readPortalTokens();
    const res = apiSuccess("Custom ERP upgrade quote ready.", {
      data: {
        ...quoted.data,
        coupon_field_visible: couponVis.ok
          ? Boolean(couponVis.data?.coupon_field_visible)
          : false,
      },
    });
    applyPortalRefreshCookies(res, resolved.access, Boolean(remember));
    return res;
  },
  { endpoint: "/api/portal/billing/custom-upgrade-quote" }
);

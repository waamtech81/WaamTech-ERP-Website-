import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { apiFail, apiSuccess } from "@/lib/api/response";
import { requestSubscriptionCancel } from "@/lib/commercial/client";
import { readPortalTokens } from "@/lib/auth/session";
import {
  applyPortalRefreshCookies,
  clearPortalOnUnauthorized,
  resolvePortalAccess,
} from "@/lib/portal/access";
import { invalidatePortalDashboardCache } from "@/lib/portal/dashboard";
import { isSameOrigin } from "@/lib/security/guards";

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
      notes?: string;
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

    const result = await requestSubscriptionCancel(
      resolved.access.accessToken,
      subscriptionId,
      body.notes ? { notes: String(body.notes).slice(0, 500) } : undefined
    );

    if (!result.ok || !result.data) {
      return apiFail(result.message || "Unable to cancel subscription.", {
        status: result.status || 502,
      });
    }

    const { remember } = await readPortalTokens();
    invalidatePortalDashboardCache();
    const res = apiSuccess(
      result.message ||
        "Auto-renewal cancelled. Your subscription remains active until the end of the current billing period.",
      { data: result.data }
    );
    applyPortalRefreshCookies(res, resolved.access, Boolean(remember));
    return res;
  },
  { endpoint: "/api/portal/billing/cancel" }
);

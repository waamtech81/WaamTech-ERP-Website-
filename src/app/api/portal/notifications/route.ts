import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { apiFail, apiSuccess } from "@/lib/api/response";
import { readPortalTokens } from "@/lib/auth/session";
import {
  applyPortalRefreshCookies,
  clearPortalOnUnauthorized,
  resolvePortalAccess,
} from "@/lib/portal/access";
import {
  fetchMyNotifications,
  markAllMyNotificationsRead,
  markMyNotificationRead,
} from "@/lib/portal/support";
import { isSameOrigin } from "@/lib/security/guards";

export const GET = withApiHandler(
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

    const url = new URL(req.url);
    const result = await fetchMyNotifications(resolved.access.accessToken, {
      category: url.searchParams.get("category") || undefined,
      unread: url.searchParams.get("unread") === "1",
      limit: Number(url.searchParams.get("limit") || 50) || 50,
      page: Number(url.searchParams.get("page") || 1) || 1,
    });

    if (!result.ok) {
      return apiFail(result.message || "Unable to load notifications.", {
        status: result.status || 502,
      });
    }

    const { remember } = await readPortalTokens();
    const res = apiSuccess("OK", {
      data: result.data || [],
      extra: {
        unread_count: result.unread_count ?? 0,
        total: result.total ?? 0,
      },
    });
    applyPortalRefreshCookies(res, resolved.access, Boolean(remember));
    return res;
  },
  { endpoint: "/api/portal/notifications" }
);

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
      action?: string;
      id?: string;
    };
    const action = String(body.action || "read").trim();

    const result =
      action === "read-all"
        ? await markAllMyNotificationsRead(resolved.access.accessToken)
        : await markMyNotificationRead(
            resolved.access.accessToken,
            String(body.id || "").trim()
          );

    if (!result.ok) {
      return apiFail(result.message || "Unable to update notification.", {
        status: result.status || 502,
      });
    }

    const { remember } = await readPortalTokens();
    const res = apiSuccess(result.message || "OK", { data: result.data ?? null });
    applyPortalRefreshCookies(res, resolved.access, Boolean(remember));
    return res;
  },
  { endpoint: "/api/portal/notifications" }
);

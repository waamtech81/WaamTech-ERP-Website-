import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { toPublicError } from "@/lib/api/errors";
import { apiFail, apiSuccess } from "@/lib/api/response";
import { loadPortalDashboard } from "@/lib/portal/dashboard";
import {
  applySessionCookies,
  clearSessionCookies,
  readPortalTokens,
} from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/security/guards";

export const GET = withApiHandler(
  async (req) => {
    if (!isSameOrigin(req)) {
      return apiFail("Invalid request origin.", {
        status: 403,
        code: ApiErrorCode.FORBIDDEN,
      });
    }

    const { accessToken, refreshToken, remember } = await readPortalTokens();
    if (!accessToken && !refreshToken) {
      return apiFail("Authentication required.", {
        status: 401,
        code: ApiErrorCode.UNAUTHORIZED,
      });
    }

    const result = await loadPortalDashboard(accessToken || "", refreshToken);
    if (!result.ok || !result.data) {
      const publicError = toPublicError(
        result.message,
        result.status || 401
      );
      const res = apiFail(
        result.status === 401
          ? "Authentication required."
          : publicError.message,
        {
          status: result.status || 401,
          code:
            result.status === 401
              ? ApiErrorCode.UNAUTHORIZED
              : publicError.code,
        }
      );
      if (result.status === 401) clearSessionCookies(res);
      return res;
    }

    const res = apiSuccess("OK", { data: result.data });
    res.headers.set(
      "Cache-Control",
      "private, no-store, max-age=0, must-revalidate"
    );
    res.headers.set("Pragma", "no-cache");

    if (result.refreshed) {
      applySessionCookies(res, {
        accessToken: result.refreshed.accessToken,
        refreshToken: result.refreshed.refreshToken,
        remember,
      });
    }

    return res;
  },
  { endpoint: "/api/portal/dashboard" }
);

import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { apiFail, apiSuccess } from "@/lib/api/response";
import { identityRefresh } from "@/lib/license/identity";
import {
  applySessionCookies,
  clearSessionCookies,
  friendlyAuthMessage,
  readPortalTokens,
} from "@/lib/auth/session";
import { getClientIp, isSameOrigin, rateLimit } from "@/lib/security/guards";

export const POST = withApiHandler(
  async (req) => {
    if (!isSameOrigin(req)) {
      return apiFail("Invalid request origin.", {
        status: 403,
        code: ApiErrorCode.FORBIDDEN,
      });
    }

    const ip = getClientIp(req);
    const limited = await rateLimit(`portal-refresh:${ip}`, 30, 15 * 60_000);
    if (!limited.ok) {
      return apiFail("Too many refresh attempts.", {
        status: 429,
        code: ApiErrorCode.RATE_LIMITED,
      });
    }

    const { refreshToken, remember } = await readPortalTokens();
    if (!refreshToken) {
      const res = apiFail("No refresh session.", {
        status: 401,
        code: ApiErrorCode.UNAUTHORIZED,
      });
      return clearSessionCookies(res);
    }

    const result = await identityRefresh(refreshToken);
    if (!result.ok || !result.data?.accessToken || !result.data?.refreshToken) {
      const res = apiFail(friendlyAuthMessage(result.message, result.code), {
        status: 401,
        code: result.code || ApiErrorCode.INVALID_TOKEN,
      });
      return clearSessionCookies(res);
    }

    const res = apiSuccess("Session refreshed.");
    return applySessionCookies(res, {
      accessToken: result.data.accessToken,
      refreshToken: result.data.refreshToken,
      remember,
    });
  },
  { endpoint: "/api/auth/refresh" }
);

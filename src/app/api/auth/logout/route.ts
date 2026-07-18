import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { apiFail, apiSuccess } from "@/lib/api/response";
import { identityLogout, identityLogoutAll } from "@/lib/license/identity";
import {
  clearSessionCookies,
  readPortalTokens,
} from "@/lib/auth/session";
import { isSameOrigin } from "@/lib/security/guards";

export const POST = withApiHandler(
  async (req) => {
    if (!isSameOrigin(req)) {
      return apiFail("Invalid request origin.", {
        status: 403,
        code: ApiErrorCode.FORBIDDEN,
      });
    }

    let allDevices = false;
    try {
      const body = await req.json();
      allDevices = body?.allDevices === true || body?.all === true;
    } catch {
      allDevices = false;
    }

    const { accessToken, refreshToken } = await readPortalTokens();

    try {
      if (allDevices && accessToken) {
        await identityLogoutAll(accessToken);
      } else if (refreshToken) {
        await identityLogout(refreshToken);
      }
    } catch {
      // Always clear local session even if Engine logout fails
    }

    const res = apiSuccess(
      allDevices ? "Signed out of all devices." : "Signed out.",
      { extra: { redirectUrl: "/login" } }
    );
    return clearSessionCookies(res);
  },
  { endpoint: "/api/auth/logout" }
);

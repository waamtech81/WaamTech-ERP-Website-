import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { apiFail, apiSuccess } from "@/lib/api/response";
import { readPortalTokens } from "@/lib/auth/session";
import {
  identityChangePassword,
  identityUpdateProfile,
} from "@/lib/license/identity";
import {
  applyPortalRefreshCookies,
  clearPortalOnUnauthorized,
  resolvePortalAccess,
} from "@/lib/portal/access";
import { isPasswordStrong } from "@/lib/auth/password-rules";
import { isSameOrigin } from "@/lib/security/guards";

export const PATCH = withApiHandler(
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
        code:
          resolved.status === 403
            ? ApiErrorCode.FORBIDDEN
            : ApiErrorCode.UNAUTHORIZED,
        ...(resolved.code ? { extra: { reason: resolved.code } } : {}),
      });
      return clearPortalOnUnauthorized(res, resolved.status);
    }

    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
      full_name?: string;
      phone?: string;
      whatsapp_number?: string;
      current_password?: string;
      new_password?: string;
      photo_base64?: string;
      content_type?: string;
    };

    const action = String(body.action || "profile").trim();
    let result;

    if (action === "password") {
      const current = String(body.current_password || "");
      const next = String(body.new_password || "");
      if (!current || !next) {
        return apiFail("Current and new password are required.", {
          status: 400,
          code: ApiErrorCode.VALIDATION_ERROR,
        });
      }
      if (!isPasswordStrong(next)) {
        return apiFail("Password does not meet strength requirements.", {
          status: 400,
          code: ApiErrorCode.VALIDATION_ERROR,
        });
      }
      result = await identityChangePassword(resolved.access.accessToken, {
        current_password: current,
        new_password: next,
      });
    } else if (action === "photo") {
      return apiFail("Profile photo can only be updated from WAAMTO SaaS.", {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    } else {
      result = await identityUpdateProfile(resolved.access.accessToken, {
        full_name: body.full_name,
        phone: body.phone,
        whatsapp_number: body.whatsapp_number,
      });
    }

    if (!result.ok) {
      return apiFail(result.message || "Unable to update account.", {
        status: result.status || 502,
      });
    }

    const { remember } = await readPortalTokens();
    const res = apiSuccess(result.message || "Account updated.", {
      data: result.data ?? null,
    });
    applyPortalRefreshCookies(res, resolved.access, Boolean(remember));
    return res;
  },
  { endpoint: "/api/portal/settings" }
);

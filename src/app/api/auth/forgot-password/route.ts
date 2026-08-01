import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { apiFail, apiSuccess } from "@/lib/api/response";
import { normalizePasswordResetOrigin } from "@/lib/auth/reset-flow";
import { identityForgotPassword } from "@/lib/license/identity";
import {
  getClientIp,
  isSameOrigin,
  isValidEmail,
  rateLimit,
  sanitizeText,
} from "@/lib/security/guards";

const GENERIC_RESET_MESSAGE =
  "If an account exists for that email, a reset link has been sent.";

/**
 * Password reset request — forwards to License Engine (SSOT for reset tokens).
 * Website never mints local reset codes (reset completion requires Engine tokens).
 */
export const POST = withApiHandler(
  async (req) => {
    if (!isSameOrigin(req)) {
      return apiFail("Invalid request origin.", {
        status: 403,
        code: ApiErrorCode.FORBIDDEN,
      });
    }

    const ip = getClientIp(req);
    const limited = await rateLimit(`portal-forgot:${ip}`, 6, 15 * 60_000);
    if (!limited.ok) {
      return apiFail(
        `Too many requests. Try again in ${limited.retryAfter}s.`,
        { status: 429, code: ApiErrorCode.RATE_LIMITED }
      );
    }

    const body = await req.json();
    const email = sanitizeText(body?.email, 254).toLowerCase();
    const origin = normalizePasswordResetOrigin(
      body?.origin || body?.origin_value || body?.reset_origin
    );
    const captchaToken = sanitizeText(
      body?.captcha_token || body?.recaptchaToken || body?.recaptcha_token,
      8192
    );

    if (!email || !isValidEmail(email)) {
      return apiFail("Enter a valid email address.", {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    }

    // Engine owns token issuance + email. Always return a generic success
    // (anti-enumeration); do not surface Engine not-found / errors to clients.
    await identityForgotPassword(
      email,
      captchaToken || undefined,
      origin === "erp" ? "erp" : "website"
    ).catch(() => null);

    return apiSuccess(GENERIC_RESET_MESSAGE, {
      extra: { origin },
    });
  },
  { endpoint: "/api/auth/forgot-password" }
);

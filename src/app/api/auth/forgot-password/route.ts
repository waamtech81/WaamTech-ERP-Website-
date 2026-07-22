import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { apiFail, apiSuccess } from "@/lib/api/response";
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
    const captchaToken = sanitizeText(
      body?.captcha_token || body?.recaptchaToken || body?.recaptcha_token,
      8192
    );

    // License Engine is the sole reCAPTCHA verifier (tokens are single-use).
    if (!captchaToken) {
      return apiFail("Captcha verification required. Please refresh and try again.", {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    }

    if (!email || !isValidEmail(email)) {
      return apiFail("Enter a valid email address.", {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    }

    // Forward captcha to Engine (sole verifier). Preserve anti-enumeration for
    // non-captcha outcomes, but surface CAPTCHA failures so bots cannot skip it.
    const result = await identityForgotPassword(email, captchaToken).catch(() => null);
    if (
      result &&
      result.ok === false &&
      /captcha/i.test(String(result.message || ""))
    ) {
      return apiFail(result.message || "Captcha verification failed. Please try again.", {
        status: result.status >= 400 && result.status < 600 ? result.status : 400,
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    }
    return apiSuccess(GENERIC_RESET_MESSAGE);
  },
  { endpoint: "/api/auth/forgot-password" }
);

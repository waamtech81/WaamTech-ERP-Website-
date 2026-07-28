import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { apiFail, apiSuccess, upstreamFail } from "@/lib/api/response";
import { normalizePasswordResetOrigin, getPasswordResetLoginUrl } from "@/lib/auth/reset-flow";
import {
  getClientIp,
  isSameOrigin,
  rateLimit,
  sanitizeText,
} from "@/lib/security/guards";

/**
 * Password reset completion — takes reset token from email, then forwards new password to License Engine.
 * Website never stores or hashes passwords locally.
 * 
 * Flow:
 * 1. User receives email with reset token from License Engine
 * 2. User clicks link: /forgot-password?token=...
 * 3. ResetPasswordForm submits: code (which is the token), password, confirm_password
 * 4. Forward token + password to License Engine for actual update
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
    const limited = await rateLimit(`portal-reset:${ip}`, 8, 15 * 60_000);
    if (!limited.ok) {
      return apiFail(
        `Too many attempts. Try again in ${limited.retryAfter}s.`,
        {
          status: 429,
          code: ApiErrorCode.RATE_LIMITED,
          headers: { "Retry-After": String(limited.retryAfter) },
        }
      );
    }

    const body = await req.json();
    const token = sanitizeText(body?.code || body?.token, 256);
    const password = String(body?.password || body?.new_password || "");
    const confirm = String(body?.confirm_password || body?.confirmPassword || "");
    const origin = normalizePasswordResetOrigin(body?.origin || body?.origin_value || body?.reset_origin);
    const captchaToken = sanitizeText(
      body?.captcha_token || body?.recaptchaToken || body?.recaptcha_token,
      8192
    );

    if (!token || token.length < 20) {
      return apiFail("This reset link is invalid or incomplete.", {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    }

    if (password.length < 8) {
      return apiFail("Password must be at least 8 characters.", {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    }
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      return apiFail(
        "Password must include uppercase, lowercase, and a number.",
        { status: 400, code: ApiErrorCode.VALIDATION_ERROR }
      );
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return apiFail("Password must include a special character.", {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    }

    if (password !== confirm) {
      return apiFail("Passwords do not match.", {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    }

    // Forward to License Engine with reset token
    const { identityResetPassword } = await import("@/lib/license/identity");
    
    const result = await identityResetPassword({
      token,
      new_password: password,
      captcha_token: captchaToken || undefined,
    });

    if (!result.ok) {
      return upstreamFail(
        result.message || "Reset link is invalid or expired. Request a new one.",
        result.status >= 400 && result.status < 600 ? result.status : 400,
        { endpoint: "/api/auth/reset-password" },
        result.code
      );
    }

    const redirectUrl = getPasswordResetLoginUrl(origin === "erp" ? "erp" : "website");

    return apiSuccess(result.message || "Password updated successfully.", {
      extra: { redirectUrl, origin: origin || "website" },
    });
  },
  { endpoint: "/api/auth/reset-password" }
);

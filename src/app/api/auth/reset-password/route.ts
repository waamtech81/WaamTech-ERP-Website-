import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { apiFail, apiSuccess, upstreamFail } from "@/lib/api/response";
import { normalizePasswordResetOrigin, getPasswordResetLoginUrl } from "@/lib/auth/reset-flow";
import { isValidPasswordResetCode } from "@/lib/security/password-reset-code";
import { getPasswordResetStore } from "@/lib/security/password-reset-store";
import {
  getClientIp,
  isSameOrigin,
  rateLimit,
  sanitizeText,
} from "@/lib/security/guards";

/**
 * Password reset completion — validates reset code, then forwards new password to License Engine.
 * Website never stores or hashes passwords locally.
 * 
 * Flow:
 * 1. Client provides: code (from email), password, confirm_password
 * 2. Validate code against password reset store
 * 3. Retrieve email + origin from stored code
 * 4. Forward password to License Engine for actual update
 * 5. Delete used code from store
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
    const code = sanitizeText(body?.code, 256);
    const password = String(body?.password || body?.new_password || "");
    const confirm = String(body?.confirm_password || body?.confirmPassword || "");
    const origin = normalizePasswordResetOrigin(body?.origin || body?.origin_value || body?.reset_origin);
    const captchaToken = sanitizeText(
      body?.captcha_token || body?.recaptchaToken || body?.recaptcha_token,
      8192
    );

    if (!code || !isValidPasswordResetCode(code)) {
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

    // Retrieve stored password reset data
    const store = getPasswordResetStore();
    const resetData = await store.get(code);

    if (!resetData) {
      return apiFail("Reset link is invalid or expired. Request a new one.", {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    }

    // Delete code immediately (single-use)
    await store.delete(code);

    // Now send the actual password reset to License Engine using email-based reset
    const { identityResetPasswordByEmail } = await import("@/lib/license/identity");
    
    const result = await identityResetPasswordByEmail({
      email: resetData.email,
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

    const redirectUrl = getPasswordResetLoginUrl(resetData.origin);

    return apiSuccess(result.message || "Password updated successfully.", {
      extra: { redirectUrl, origin: resetData.origin },
    });
  },
  { endpoint: "/api/auth/reset-password" }
);

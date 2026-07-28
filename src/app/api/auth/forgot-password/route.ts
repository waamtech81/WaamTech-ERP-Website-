import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { apiFail, apiSuccess } from "@/lib/api/response";
import { normalizePasswordResetOrigin } from "@/lib/auth/reset-flow";
import { sendPasswordResetEmail } from "@/lib/auth/email";
import { identityCheckEmailExists } from "@/lib/license/identity";
import { generatePasswordResetCode } from "@/lib/security/password-reset-code";
import { getPasswordResetStore } from "@/lib/security/password-reset-store";
import {
  getClientIp,
  isSameOrigin,
  isValidEmail,
  rateLimit,
  sanitizeText,
} from "@/lib/security/guards";

function isUnregisteredEmail(result: {
  status: number;
  code?: string;
  message?: string;
}): boolean {
  if (result.status === 404) return true;

  const code = String(result.code || "").toUpperCase();
  if (
    code === "EMAIL_NOT_FOUND" ||
    code === "USER_NOT_FOUND" ||
    code === "ACCOUNT_NOT_FOUND"
  ) {
    return true;
  }

  return /\b(not found|not registered|does not exist|no account)\b/i.test(
    String(result.message || "")
  );
}

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
    const origin = normalizePasswordResetOrigin(body?.origin || body?.origin_value || body?.reset_origin);
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

    // Check if email exists in identity system
    const emailCheckResult = await identityCheckEmailExists(email).catch(() => null);
    if (!emailCheckResult || !emailCheckResult.ok) {
      if (emailCheckResult && isUnregisteredEmail(emailCheckResult)) {
        return apiFail(
          "This email is not registered. Please check the address or create an account.",
          { status: 404, code: ApiErrorCode.NOT_FOUND }
        );
      }
    }

    // Generate and store password reset code (website-owned, not from License Engine)
    // Code valid for 15 minutes
    const code = generatePasswordResetCode();
    const store = getPasswordResetStore();
    await store.set(code, { email, createdAt: Date.now(), origin }, 15 * 60_000);

    // Send password reset email
    await sendPasswordResetEmail({
      to: email,
      code,
      origin: origin === "erp" ? "erp" : "website",
    });

    return apiSuccess("If an account exists for that email, a reset link has been sent.", {
      extra: { origin, code },
    });
  },
  { endpoint: "/api/auth/forgot-password" }
);

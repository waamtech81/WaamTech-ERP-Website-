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

    // Forward captcha to Engine when the public site has one. The Engine remains
    // the sole verifier; requiring a token here would block deployments where
    // captcha is disabled or unavailable before the Engine can apply its policy.
    const result = await identityForgotPassword(email, captchaToken || undefined).catch(() => null);
    if (!result) {
      return apiFail("Password reset service is temporarily unavailable. Please try again.", {
        status: 503,
        code: ApiErrorCode.SERVICE_UNAVAILABLE,
      });
    }

    if (!result.ok) {
      if (isUnregisteredEmail(result)) {
        return apiFail(
          "This email is not registered. Please check the address or create an account.",
          { status: 404, code: ApiErrorCode.NOT_FOUND }
        );
      }

      return apiFail(result.message || "Could not send a reset link. Please try again.", {
        status: result.status >= 400 && result.status < 600 ? result.status : 502,
        code: /captcha/i.test(String(result.message || ""))
          ? ApiErrorCode.VALIDATION_ERROR
          : ApiErrorCode.SERVICE_UNAVAILABLE,
      });
    }

    return apiSuccess("A reset link has been sent to your registered email.");
  },
  { endpoint: "/api/auth/forgot-password" }
);

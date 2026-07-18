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
    if (!email || !isValidEmail(email)) {
      return apiFail("Enter a valid email address.", {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    }

    // Always return a generic success-style message (anti-enumeration)
    await identityForgotPassword(email).catch(() => null);
    return apiSuccess(GENERIC_RESET_MESSAGE);
  },
  { endpoint: "/api/auth/forgot-password" }
);

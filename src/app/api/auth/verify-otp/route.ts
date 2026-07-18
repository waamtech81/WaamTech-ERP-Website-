import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { apiFail, apiSuccess, upstreamFail } from "@/lib/api/response";
import { authConfig } from "@/lib/auth/config";
import {
  resendRegistrationOtp,
  verifyRegistrationOtp,
} from "@/lib/license/client";
import {
  getClientIp,
  isSameOrigin,
  rateLimit,
  sanitizeText,
} from "@/lib/security/guards";

export const POST = withApiHandler(
  async (req) => {
    if (!isSameOrigin(req)) {
      return apiFail("Invalid request origin.", {
        status: 403,
        code: ApiErrorCode.FORBIDDEN,
      });
    }

    const ip = getClientIp(req);
    const limited = await rateLimit(`verify-otp:${ip}`, 20, 15 * 60_000);
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
    const action = sanitizeText(body?.action, 20) || "verify";
    const registrationId = sanitizeText(
      body?.registration_id || body?.registrationId,
      64
    );
    const email = sanitizeText(body?.email, 254).toLowerCase() || undefined;
    const otp = sanitizeText(body?.otp || body?.code, 10);

    if (!registrationId) {
      return apiFail("Registration session is required.", {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    }

    if (action === "resend") {
      const result = await resendRegistrationOtp({
        registration_id: registrationId,
        email,
      });
      if (!result.ok) {
        return upstreamFail(
          result.message,
          result.status,
          {
            endpoint: "/api/auth/verify-otp",
            userEmail: email,
          },
          result.code
        );
      }
      return apiSuccess(result.message || "A new verification code was sent.", {
        data: {
          otpExpiresInMinutes:
            typeof result.data?.otpExpiresInMinutes === "number"
              ? result.data.otpExpiresInMinutes
              : 10,
        },
      });
    }

    if (!otp || otp.length < 4) {
      return apiFail("Enter the verification code from your email.", {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    }

    const result = await verifyRegistrationOtp({
      registration_id: registrationId,
      otp,
      email,
    });

    if (!result.ok || !result.data) {
      return upstreamFail(
        result.message || "Verification failed.",
        result.status,
        {
          endpoint: "/api/auth/verify-otp",
          userEmail: email,
        },
        result.code
      );
    }

    const appUrl = result.data.appUrl || result.data.loginUrl || authConfig.appUrl;
    const trialDays = result.data.trialDays || authConfig.trialDays;

    return apiSuccess(
      result.message || `Email verified. Your ${trialDays}-day trial is ready.`,
      {
        data: {
          appUrl,
          loginUrl: result.data.loginUrl || appUrl,
          trialDays,
          trialEndsAt: result.data.trialEndsAt || undefined,
          username: result.data.username || undefined,
          email: result.data.email || undefined,
          redirectUrl: appUrl,
        },
      }
    );
  },
  { endpoint: "/api/auth/verify-otp" }
);

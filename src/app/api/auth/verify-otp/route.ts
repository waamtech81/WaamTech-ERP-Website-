import { NextResponse } from "next/server";
import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { apiFail, apiSuccess, upstreamFail } from "@/lib/api/response";
import { authConfig, getPortalLoginPath } from "@/lib/auth/config";
import { applySessionCookies } from "@/lib/auth/session";
import {
  resendRegistrationOtp,
  verifyRegistrationOtp,
} from "@/lib/license/client";
import { normalizeIdentityLoginData } from "@/lib/license/identity";
import {
  getClientIp,
  isSameOrigin,
  rateLimit,
  sanitizeText,
} from "@/lib/security/guards";
import { isValidSessionToken } from "@/lib/security/session-token";

/** Server-safe checkout redirect — session token must stay in the URL (no sessionStorage). */
function paidCheckoutRedirectPath(token: string, mode = "signup"): string {
  const params = new URLSearchParams();
  params.set("session", token);
  if (mode) params.set("mode", mode);
  return `/portal/checkout?${params.toString()}`;
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
    const captchaToken = sanitizeText(
      body?.captcha_token || body?.recaptchaToken || body?.recaptcha_token,
      8192
    );

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
        captcha_token: captchaToken,
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
      captcha_token: captchaToken,
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

    const data = result.data;
    const appUrl = data.appUrl || data.loginUrl || authConfig.appUrl;
    const trialDays = data.trialDays || authConfig.trialDays;
    const signupMode =
      data.signup_mode === "paid" || data.payment_required === true
        ? ("paid" as const)
        : ("trial" as const);

    const checkoutToken = String(data.checkout_session_token || "").trim();
    const paymentRequired =
      Boolean(data.payment_required) || Boolean(checkoutToken);

    const checkoutPath = checkoutToken
      ? paidCheckoutRedirectPath(checkoutToken, "signup")
      : null;

    const portalLogin = getPortalLoginPath({
      email: data.email || email,
      next: checkoutPath || "/portal",
    });

    let redirectUrl = portalLogin;
    if (paymentRequired && checkoutPath) {
      redirectUrl = checkoutPath;
    } else if (data.checkoutUrl && paymentRequired) {
      try {
        const parsed = new URL(String(data.checkoutUrl), "https://waamto.com");
        const legacyToken = parsed.searchParams.get("session");
        if (legacyToken) {
          redirectUrl = paidCheckoutRedirectPath(
            legacyToken,
            parsed.searchParams.get("mode") || "signup"
          );
        } else if (parsed.pathname.startsWith("/portal/")) {
          redirectUrl = `${parsed.pathname}${parsed.search}`;
        }
      } catch {
        /* keep portal login */
      }
    }

    const payload = {
      appUrl,
      loginUrl: portalLogin,
      trialDays: signupMode === "paid" ? 0 : trialDays,
      trialEndsAt: data.trialEndsAt || undefined,
      username: data.username || undefined,
      email: data.email || undefined,
      signup_mode: signupMode,
      payment_required: paymentRequired,
      checkout_session_token: checkoutToken || undefined,
      checkoutUrl: data.checkoutUrl || checkoutPath || undefined,
      redirectUrl,
      erpLoginUrl: appUrl,
      session_established: false as boolean,
    };

    const tokens = normalizeIdentityLoginData(data as Record<string, unknown>);
    const accessToken =
      tokens && typeof (tokens as { accessToken?: unknown }).accessToken === "string"
        ? String((tokens as { accessToken: string }).accessToken)
        : "";
    const refreshToken =
      tokens && typeof (tokens as { refreshToken?: unknown }).refreshToken === "string"
        ? String((tokens as { refreshToken: string }).refreshToken)
        : "";
    const canApplySession =
      isValidSessionToken(accessToken) && isValidSessionToken(refreshToken);

    const message =
      result.message ||
      (signupMode === "paid" || paymentRequired
        ? "Email verified. Continue to checkout to activate your account."
        : `Email verified. Your ${trialDays}-day trial is ready.`);

    if (canApplySession) {
      payload.session_established = true;
      // Prefer checkout when paid; otherwise land in portal already signed in.
      if (!(paymentRequired && checkoutToken)) {
        payload.redirectUrl = "/portal";
      }
      const res = NextResponse.json({
        success: true,
        message,
        data: payload,
      });
      return applySessionCookies(res, {
        accessToken,
        refreshToken,
        remember: false,
      });
    }

    return apiSuccess(message, { data: payload });
  },
  { endpoint: "/api/auth/verify-otp" }
);

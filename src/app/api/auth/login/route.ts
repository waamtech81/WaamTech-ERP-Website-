import { NextResponse } from "next/server";
import {
  hasLoginTokens,
  identityLogin,
  isCustomerMfaChallenge,
  isLoginChallenge,
  normalizeIdentityLoginData,
  type IdentityLoginChallenge,
  type IdentityLoginSuccess,
} from "@/lib/license/identity";
import {
  hasPlatformTokens,
  isPlatformEmailChallenge,
  isPlatformStaffRole,
  isPlatformTotpChallenge,
  looksLikeEmail,
  platformAdminPortalUrl,
  platformLogin,
} from "@/lib/license/platform-auth";
import {
  applySessionCookies,
  friendlyAuthMessage,
} from "@/lib/auth/session";
import {
  getClientIp,
  isSameOrigin,
  looksLikeBotPayload,
  rateLimit,
  sanitizeText,
} from "@/lib/security/guards";

function platformSuccessPayload(data: {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    first_name?: string | null;
    last_name?: string | null;
  };
}):
  | {
      accountKind: "platform";
      redirectUrl: string;
      role: string;
      user: {
        id: string;
        email: string;
        role: string;
        first_name: string | null;
        last_name: string | null;
      };
      accessToken: string;
      refreshToken: string;
    }
  | { ok: false; message: string } {
  const portal = platformAdminPortalUrl();
  if (!portal.ok) {
    return {
      ok: false,
      message:
        "Unable to complete platform sign-in from this environment. Contact your administrator.",
    };
  }
  return {
    accountKind: "platform" as const,
    redirectUrl: portal.url,
    role: data.user.role,
    user: {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role,
      first_name: data.user.first_name ?? null,
      last_name: data.user.last_name ?? null,
    },
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  };
}

function isPlatformSuperAdminPayload(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (d.account_type === "platform_super_admin") return true;
  const user = d.user as { role?: string } | undefined;
  return user?.role === "super_admin" && (hasPlatformTokens(data) || hasLoginTokens(data) || d.requires_step_up === true);
}

/**
 * Unified login (permanent policy):
 * 1) Password step uses identity login ONLY (Engine also resolves Platform Super Admin
 *    via tryLogin — never probe mutating staff /auth/login with commercial emails).
 * 2) Verified customers receive tokens and get a session immediately.
 * 3) OTP only when Engine returns a genuine unverified-email challenge.
 */
export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) {
      return NextResponse.json(
        { success: false, message: "Invalid request origin." },
        { status: 403 }
      );
    }

    const ip = getClientIp(req);
    const limited = await rateLimit(`portal-login:${ip}`, 12, 15 * 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        {
          success: false,
          message: `Too many login attempts. Try again in ${limited.retryAfter}s.`,
        },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
      );
    }

    const body = await req.json();

    if (looksLikeBotPayload(body || {})) {
      return NextResponse.json(
        { success: false, message: friendlyAuthMessage("invalid") },
        { status: 401 }
      );
    }

    const username = sanitizeText(body?.username || body?.email, 254);
    const password = String(body?.password || "");
    // JWT challenge tokens exceed 128 chars — truncating breaks OTP completion permanently.
    const challengeToken = sanitizeText(body?.challenge_token, 4096);
    const emailCode = sanitizeText(body?.email_code || body?.otp, 12);
    const totpCode = sanitizeText(body?.totp_code, 12);
    const recoveryCode = sanitizeText(body?.recovery_code, 64);
    const captchaToken = sanitizeText(
      body?.captcha_token || body?.recaptchaToken || body?.recaptcha_token,
      8192
    );
    const remember = body?.remember === true || body?.rememberMe === true;
    const trustDevice = body?.trust_device === true || body?.remember_device === true;
    const deviceToken = sanitizeText(body?.device_token, 128);
    const accountKindHint = sanitizeText(body?.account_kind, 32);
    // Platform staff step-up only when explicitly hinted — never infer from totp/recovery
    // (customers also use those for MFA).
    const isPlatformChallenge =
      accountKindHint === "platform" || body?.platform === true;

    // Platform staff challenge completion (email OTP / TOTP) — explicit step only.
    if (challengeToken && (emailCode || totpCode || recoveryCode) && isPlatformChallenge) {
      if (!captchaToken) {
        return NextResponse.json(
          {
            success: false,
            message: "Captcha verification required. Please refresh and try again.",
          },
          { status: 400 }
        );
      }

      const otpLimited = await rateLimit(`portal-login-otp:${ip}`, 20, 15 * 60_000);
      if (!otpLimited.ok) {
        return NextResponse.json(
          {
            success: false,
            message: `Too many OTP attempts. Try again in ${otpLimited.retryAfter}s.`,
          },
          { status: 429, headers: { "Retry-After": String(otpLimited.retryAfter) } }
        );
      }

      const platformResult = await platformLogin({
        email: looksLikeEmail(username) ? username : sanitizeText(body?.email, 254),
        password: password || undefined,
        challenge_token: challengeToken,
        email_code: emailCode || undefined,
        totp_code: totpCode || undefined,
        recovery_code: recoveryCode || undefined,
        captcha_token: captchaToken,
      });

      if (platformResult.ok && isPlatformTotpChallenge(platformResult.data)) {
        return NextResponse.json({
          success: true,
          accountKind: "platform",
          requires2fa: true,
          requires_2fa: true,
          message:
            platformResult.data.message ||
            "Enter your authenticator app code.",
          data: {
            challenge_token:
              platformResult.data.challenge_token || challengeToken,
            account_kind: "platform",
          },
        });
      }

      if (platformResult.ok && hasPlatformTokens(platformResult.data)) {
        if (!isPlatformStaffRole(platformResult.data.user.role)) {
          return NextResponse.json(
            { success: false, message: friendlyAuthMessage("invalid") },
            { status: 401 }
          );
        }
        const sso = platformSuccessPayload(platformResult.data);
        if ("ok" in sso && sso.ok === false) {
          return NextResponse.json(
            { success: false, message: sso.message },
            { status: 409 }
          );
        }
        return NextResponse.json({
          success: true,
          message: "Logged in successfully.",
          data: sso,
        });
      }

      return NextResponse.json(
        {
          success: false,
          message: friendlyAuthMessage(platformResult.message),
        },
        {
          status:
            platformResult.status >= 400 && platformResult.status < 600
              ? platformResult.status
              : 401,
        }
      );
    }

    // Customer identity OTP / MFA verification.
    if (challengeToken && (emailCode || totpCode || recoveryCode) && !isPlatformChallenge) {
      if (!captchaToken) {
        return NextResponse.json(
          {
            success: false,
            message: "Captcha verification required. Please refresh and try again.",
          },
          { status: 400 }
        );
      }

      const otpLimited = await rateLimit(`portal-login-otp:${ip}`, 20, 15 * 60_000);
      if (!otpLimited.ok) {
        return NextResponse.json(
          {
            success: false,
            message: `Too many OTP attempts. Try again in ${otpLimited.retryAfter}s.`,
          },
          { status: 429, headers: { "Retry-After": String(otpLimited.retryAfter) } }
        );
      }

      const result = await identityLogin({
        challenge_token: challengeToken,
        email_code: emailCode || undefined,
        otp: emailCode || undefined,
        username: username || undefined,
        password: password || undefined,
        totp_code: totpCode || undefined,
        recovery_code: recoveryCode || undefined,
        trust_device: trustDevice,
        device_token: deviceToken || undefined,
        captcha_token: captchaToken,
      });

      if (result.ok && isCustomerMfaChallenge(result.data)) {
        const d = result.data as IdentityLoginChallenge;
        return NextResponse.json({
          success: true,
          accountKind: "customer",
          requires2fa: true,
          requires_2fa: true,
          requiresOtp: d.active_second_factor === "email_otp" || d.requires_email_otp === true,
          requires_email_otp: d.requires_email_otp === true || d.active_second_factor === "email_otp",
          message: d.message || "Enter your second-factor code.",
          data: {
            challenge_token: d.challenge_token || challengeToken,
            email: d.email,
            account_kind: "customer",
            active_second_factor: d.active_second_factor || "totp",
            otpExpiresInMinutes: d.otpExpiresInMinutes || 10,
          },
        });
      }

      if (!result.ok || !hasLoginTokens(result.data)) {
        return NextResponse.json(
          {
            success: false,
            message: friendlyAuthMessage(result.message),
          },
          { status: result.status >= 400 && result.status < 600 ? result.status : 401 }
        );
      }

      // Never issue cookies while a second-factor challenge is still pending.
      if (isLoginChallenge(result.data) || isCustomerMfaChallenge(result.data)) {
        const d = result.data as IdentityLoginChallenge;
        return NextResponse.json({
          success: true,
          accountKind: "customer",
          requires2fa: true,
          requires_2fa: true,
          requiresOtp: d.active_second_factor === "email_otp" || d.requires_email_otp === true,
          requires_email_otp: d.requires_email_otp === true || d.active_second_factor === "email_otp",
          message: d.message || "Enter your second-factor code.",
          data: {
            challenge_token: d.challenge_token || challengeToken,
            email: d.email,
            account_kind: "customer",
            active_second_factor: d.active_second_factor || "totp",
            otpExpiresInMinutes: d.otpExpiresInMinutes || 10,
          },
        });
      }

      const tokens = normalizeIdentityLoginData(result.data);
      if (!tokens || !hasLoginTokens(tokens)) {
        return NextResponse.json(
          {
            success: false,
            message: friendlyAuthMessage("Login failed. Please try again."),
          },
          { status: 401 }
        );
      }

      const res = NextResponse.json({
        success: true,
        message: "Logged in successfully.",
        data: {
          accountKind: "customer",
          redirectUrl: "/portal",
          ...(typeof (tokens as IdentityLoginSuccess).device_token === "string"
            ? { device_token: (tokens as IdentityLoginSuccess).device_token }
            : {}),
        },
      });
      return applySessionCookies(res, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        remember,
      });
    }

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username/email and password are required." },
        { status: 400 }
      );
    }

    /**
     * Password step — identity login ONLY.
     * Do NOT probe staff /auth/login: that recorded IP failures for commercial emails
     * and could surface staff Login OTP incorrectly.
     */
    const result = await identityLogin({
      username,
      email: username.includes("@") ? username : undefined,
      password,
      captcha_token: captchaToken || undefined,
      device_token: deviceToken || undefined,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          message: friendlyAuthMessage(result.message),
        },
        { status: result.status >= 400 && result.status < 600 ? result.status : 401 }
      );
    }

    const data = normalizeIdentityLoginData(result.data) ?? result.data;

    // Second factor must be completed before any session cookies are issued.
    // Never allow MFA/email OTP to be bypassed when Engine also returns tokens.
    if (isLoginChallenge(data)) {
      const mfa = isCustomerMfaChallenge(data);
      const active =
        data.active_second_factor ||
        (data.requires_email_otp ? "email_otp" : mfa ? "totp" : undefined);
      const isEmailStep =
        data.requires_email_verification === true ||
        active === "email_otp" ||
        data.requires_email_otp === true;

      return NextResponse.json({
        success: true,
        accountKind: "customer",
        requiresOtp: isEmailStep,
        requires_email_verification: data.requires_email_verification === true,
        requires_email_otp: active === "email_otp" || data.requires_email_otp === true,
        requires2fa: mfa || active === "totp" || active === "email_otp",
        requires_2fa: mfa || active === "totp" || active === "email_otp",
        message:
          data.message ||
          (active === "totp"
            ? "Enter the code from your authenticator app."
            : "Enter the verification code sent to your registered email."),
        data: {
          challenge_token: data.challenge_token,
          email: data.email,
          account_kind: "customer",
          active_second_factor: active || (isEmailStep ? "email_otp" : "totp"),
          otpExpiresInMinutes: data.otpExpiresInMinutes || 10,
        },
      });
    }

    // Platform Super Admin resolved by Engine identity tryLogin.
    if (isPlatformSuperAdminPayload(data)) {
      const d = data as Record<string, unknown>;
      if (d.requires_step_up === true && typeof d.redirect_url === "string") {
        return NextResponse.json({
          success: true,
          accountKind: "platform",
          requiresStepUp: true,
          message:
            (typeof d.message === "string" && d.message) ||
            "Complete sign-in on the License Engine Admin Portal.",
          data: {
            accountKind: "platform",
            account_kind: "platform",
            redirectUrl: d.redirect_url,
          },
        });
      }

      if (isPlatformTotpChallenge(data) || d.requires_2fa === true) {
        return NextResponse.json({
          success: true,
          accountKind: "platform",
          requires2fa: true,
          requires_2fa: true,
          message:
            (typeof d.message === "string" && d.message) ||
            "Enter your authenticator app code.",
          data: {
            challenge_token:
              typeof d.challenge_token === "string" ? d.challenge_token : "",
            account_kind: "platform",
            active_second_factor: "totp",
          },
        });
      }

      if (isPlatformEmailChallenge(data)) {
        return NextResponse.json({
          success: true,
          accountKind: "platform",
          requiresOtp: true,
          requires_email_verification: true,
          message:
            data.message ||
            "Enter the verification code sent to your registered email.",
          data: {
            challenge_token: data.challenge_token,
            email: data.email,
            account_kind: "platform",
            otpExpiresInMinutes: 10,
          },
        });
      }

      if (hasPlatformTokens(data) || hasLoginTokens(data)) {
        const user = (d.user || {}) as {
          id?: string;
          email?: string;
          role?: string;
          first_name?: string | null;
          last_name?: string | null;
        };
        if (!user.id || !user.email || !isPlatformStaffRole(user.role)) {
          return NextResponse.json(
            { success: false, message: friendlyAuthMessage("invalid") },
            { status: 401 }
          );
        }
        const tokens = hasPlatformTokens(data)
          ? data
          : (normalizeIdentityLoginData(data) as {
              accessToken: string;
              refreshToken: string;
            });
        const sso = platformSuccessPayload({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: {
            id: user.id,
            email: user.email,
            role: user.role || "super_admin",
            first_name: user.first_name ?? null,
            last_name: user.last_name ?? null,
          },
        });
        if ("ok" in sso && sso.ok === false) {
          return NextResponse.json(
            { success: false, message: sso.message },
            { status: 409 }
          );
        }
        return NextResponse.json({
          success: true,
          message: "Logged in successfully.",
          data: sso,
        });
      }
    }

    // Verified customers with tokens and no pending second factor.
    if (hasLoginTokens(data)) {
      const res = NextResponse.json({
        success: true,
        message: "Logged in successfully.",
        data: {
          accountKind: "customer",
          redirectUrl: "/portal",
          requires_email_verification: false,
        },
      });
      return applySessionCookies(res, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        remember,
      });
    }

    if (data && typeof data === "object" && isPlatformEmailChallenge(data)) {
      return NextResponse.json({
        success: true,
        accountKind: "platform",
        requiresOtp: true,
        requires_email_verification: true,
        message:
          data.message ||
          "Enter the verification code sent to your registered email.",
        data: {
          challenge_token: data.challenge_token,
          email: data.email,
          account_kind: "platform",
          otpExpiresInMinutes: 10,
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: friendlyAuthMessage("Login failed. Please try again."),
      },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Login service temporarily unavailable. Please try again.",
      },
      { status: 502 }
    );
  }
}

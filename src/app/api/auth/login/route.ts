import { NextResponse } from "next/server";
import {
  hasLoginTokens,
  identityLogin,
  isLoginChallenge,
  normalizeIdentityLoginData,
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
import { licenseConfig } from "@/lib/license/config";

/** Temporary production auth diagnostics — remove after OTP migration is verified. */
function authDebug(event: string, payload: Record<string, unknown>) {
  console.info("[auth-login-debug]", {
    event,
    ts: new Date().toISOString(),
    licenseApi: licenseConfig.apiUrl,
    ...payload,
  });
}

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
}) {
  return {
    accountKind: "platform" as const,
    redirectUrl: platformAdminPortalUrl(),
    role: data.user.role,
    user: {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role,
      first_name: data.user.first_name ?? null,
      last_name: data.user.last_name ?? null,
    },
    // Tokens are posted via browser form to License Engine /sso (not stored in Website cookies).
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  };
}

/**
 * Unified login:
 * 1) If identifier is an email, try Platform Super Admin / staff auth first (License Engine /auth).
 * 2) Otherwise (or on staff invalid-credentials) continue with commercial customer identity login.
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
    const challengeToken = sanitizeText(body?.challenge_token, 128);
    const emailCode = sanitizeText(body?.email_code || body?.otp, 12);
    const totpCode = sanitizeText(body?.totp_code, 12);
    const recoveryCode = sanitizeText(body?.recovery_code, 64);
    const remember = body?.remember === true || body?.rememberMe === true;
    const accountKindHint = sanitizeText(body?.account_kind, 32);
    const isPlatformChallenge =
      accountKindHint === "platform" ||
      body?.platform === true ||
      Boolean(totpCode || recoveryCode);

    authDebug("request", {
      path: "/api/auth/login",
      upstreamBase: licenseConfig.apiUrl,
      hasPassword: Boolean(password),
      hasChallengeToken: Boolean(challengeToken),
      hasEmailCode: Boolean(emailCode),
      hasTotp: Boolean(totpCode),
      accountKindHint: accountKindHint || null,
      identifierKind: looksLikeEmail(username) ? "email" : "username",
    });

    // ── Platform staff challenge completion (email OTP / TOTP) ──────────────
    if (challengeToken && (emailCode || totpCode || recoveryCode) && isPlatformChallenge) {
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
      });

      if (platformResult.ok && isPlatformTotpChallenge(platformResult.data)) {
        authDebug("decision", {
          account_type: "platform",
          redirect: "totp",
          success: true,
          requires_email_verification: false,
          challenge_token: Boolean(
            platformResult.data.challenge_token || challengeToken
          ),
        });
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
        authDebug("decision", {
          account_type: "platform",
          redirect: "sso",
          success: true,
          requires_email_verification: false,
          challenge_token: false,
          has_tokens: true,
        });
        return NextResponse.json({
          success: true,
          message: "Logged in successfully.",
          data: platformSuccessPayload(platformResult.data),
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

    // ── Customer identity OTP verification ──────────────────────────────────
    if (challengeToken && emailCode && !isPlatformChallenge) {
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
        email_code: emailCode,
        otp: emailCode,
        username: username || undefined,
        password: password || undefined,
      });

      if (!result.ok || !hasLoginTokens(result.data)) {
        return NextResponse.json(
          {
            success: false,
            message: friendlyAuthMessage(result.message),
          },
          { status: result.status >= 400 && result.status < 600 ? result.status : 401 }
        );
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

      authDebug("decision", {
        account_type: "customer",
        redirect: "portal",
        success: true,
        requires_email_verification: false,
        challenge_token: false,
        has_tokens: true,
        via: "otp_complete",
      });

      const res = NextResponse.json({
        success: true,
        message: "Logged in successfully.",
        data: {
          accountKind: "customer",
          redirectUrl: "/portal",
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

    // ── 1) Platform Super Admin / staff first (email identifiers only) ──────
    if (looksLikeEmail(username)) {
      const platformResult = await platformLogin({
        email: username,
        password,
      });

      if (platformResult.ok && isPlatformEmailChallenge(platformResult.data)) {
        authDebug("decision", {
          account_type: "platform",
          redirect: "otp",
          success: true,
          requires_email_verification: true,
          challenge_token: Boolean(platformResult.data.challenge_token),
        });
        return NextResponse.json({
          success: true,
          accountKind: "platform",
          requiresOtp: true,
          requires_email_verification: true,
          message:
            platformResult.data.message ||
            "Enter the verification code sent to your registered email.",
          data: {
            challenge_token: platformResult.data.challenge_token,
            email: platformResult.data.email,
            account_kind: "platform",
            otpExpiresInMinutes: 10,
          },
        });
      }

      if (platformResult.ok && isPlatformTotpChallenge(platformResult.data)) {
        authDebug("decision", {
          account_type: "platform",
          redirect: "totp",
          success: true,
          requires_email_verification: false,
          challenge_token: Boolean(platformResult.data.challenge_token),
        });
        return NextResponse.json({
          success: true,
          accountKind: "platform",
          requires2fa: true,
          requires_2fa: true,
          message:
            platformResult.data.message ||
            "Enter your authenticator app code.",
          data: {
            challenge_token: platformResult.data.challenge_token || "",
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
        authDebug("decision", {
          account_type: "platform",
          redirect: "sso",
          success: true,
          requires_email_verification: false,
          challenge_token: false,
          has_tokens: true,
        });
        return NextResponse.json({
          success: true,
          message: "Logged in successfully.",
          data: platformSuccessPayload(platformResult.data),
        });
      }

      const staffMsg = String(platformResult.message || "").toLowerCase();
      if (
        platformResult.status === 429 ||
        staffMsg.includes("lock") ||
        staffMsg.includes("too many") ||
        staffMsg.includes("blocked")
      ) {
        return NextResponse.json(
          { success: false, message: friendlyAuthMessage(platformResult.message) },
          {
            status:
              platformResult.status >= 400 && platformResult.status < 600
                ? platformResult.status
                : 401,
          }
        );
      }
      // 401 invalid credentials → continue to commercial customer identity
    }

    // ── 2) Commercial customer identity login ───────────────────────────────
    const result = await identityLogin({
      username,
      email: username.includes("@") ? username : undefined,
      password,
    });

    authDebug("upstream_identity", {
      ok: result.ok,
      status: result.status,
      message: result.message,
      success: result.ok,
      requires_email_verification:
        result.data && typeof result.data === "object"
          ? (result.data as Record<string, unknown>).requires_email_verification
          : undefined,
      challenge_token:
        result.data && typeof result.data === "object"
          ? Boolean((result.data as Record<string, unknown>).challenge_token)
          : false,
      has_access_token: hasLoginTokens(result.data),
      account_type: "customer",
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

    /**
     * Verified customers (tokens from Control Center) authenticate with password only.
     * Prefer tokens over any leftover challenge-shaped fields.
     */
    if (hasLoginTokens(data)) {
      authDebug("decision", {
        account_type: "customer",
        redirect: "portal",
        success: true,
        requires_email_verification: false,
        challenge_token: false,
        has_tokens: true,
        via: "password_only",
      });
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

    if (isLoginChallenge(data)) {
      authDebug("decision", {
        account_type: "customer",
        redirect: "otp",
        success: true,
        requires_email_verification: true,
        challenge_token: true,
        has_tokens: false,
      });
      return NextResponse.json({
        success: true,
        accountKind: "customer",
        requiresOtp: true,
        requires_email_verification: true,
        message:
          data.message ||
          "Enter the verification code sent to your registered email.",
        data: {
          challenge_token: data.challenge_token,
          email: data.email,
          account_kind: "customer",
          otpExpiresInMinutes: data.otpExpiresInMinutes || 10,
        },
      });
    }

    if (
      data &&
      typeof data === "object" &&
      typeof (data as Record<string, unknown>).challenge_token === "string" &&
      String((data as Record<string, unknown>).challenge_token).trim() &&
      ((data as Record<string, unknown>).requires_email_verification === true ||
        (data as Record<string, unknown>).requiresOtp === true ||
        (data as Record<string, unknown>).requires_otp === true)
    ) {
      const challenge = data as Record<string, unknown>;
      authDebug("decision", {
        account_type: "customer",
        redirect: "otp",
        success: true,
        requires_email_verification: true,
        challenge_token: true,
        has_tokens: false,
        via: "fallback_challenge",
      });
      return NextResponse.json({
        success: true,
        accountKind: "customer",
        requiresOtp: true,
        requires_email_verification: true,
        message:
          String(challenge.message || "") ||
          "Enter the verification code sent to your registered email.",
        data: {
          challenge_token: String(challenge.challenge_token),
          email: String(challenge.email || ""),
          account_kind: "customer",
          otpExpiresInMinutes: Number(challenge.otpExpiresInMinutes || 10),
        },
      });
    }

    authDebug("decision", {
      account_type: "customer",
      redirect: "error",
      success: false,
      requires_email_verification: false,
      challenge_token: false,
      has_tokens: false,
    });

    return NextResponse.json(
      {
        success: false,
        message: friendlyAuthMessage("Login failed. Please try again."),
      },
      { status: 401 }
    );
  } catch (error) {
    authDebug("error", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      {
        success: false,
        message: "Login service temporarily unavailable. Please try again.",
      },
      { status: 502 }
    );
  }
}

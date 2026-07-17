import { NextResponse } from "next/server";
import {
  hasLoginTokens,
  identityLogin,
  isLoginChallenge,
} from "@/lib/license/identity";
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

/**
 * Enterprise Customer Login — License Engine identity only.
 * Passwords are forwarded to the Engine and never stored or verified locally.
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
    const remember = body?.remember === true || body?.rememberMe === true;

    // OTP verification step
    if (challengeToken && emailCode) {
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

      const res = NextResponse.json({
        success: true,
        message: "Logged in successfully.",
        data: {
          redirectUrl: "/portal",
        },
      });
      return applySessionCookies(res, {
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
        remember,
      });
    }

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username/email and password are required." },
        { status: 400 }
      );
    }

    const result = await identityLogin({
      username,
      email: username.includes("@") ? username : undefined,
      password,
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

    const data = result.data;

    // Preferred path: Engine requires Login OTP before issuing tokens
    if (isLoginChallenge(data)) {
      return NextResponse.json({
        success: true,
        requiresOtp: true,
        requires_email_verification: true,
        message:
          data.message ||
          "Enter the verification code sent to your registered email.",
        data: {
          challenge_token: data.challenge_token,
          email: data.email,
          otpExpiresInMinutes: data.otpExpiresInMinutes || 10,
        },
      });
    }

    // Also detect nested challenge shapes
    if (
      data &&
      typeof data === "object" &&
      ("requires_email_verification" in data ||
        "requiresOtp" in data ||
        "challenge_token" in data) &&
      !hasLoginTokens(data)
    ) {
      const challenge = data as Record<string, unknown>;
      if (challenge.challenge_token) {
        return NextResponse.json({
          success: true,
          requiresOtp: true,
          requires_email_verification: true,
          message:
            String(challenge.message || "") ||
            "Enter the verification code sent to your registered email.",
          data: {
            challenge_token: String(challenge.challenge_token),
            email: String(challenge.email || ""),
            otpExpiresInMinutes: Number(challenge.otpExpiresInMinutes || 10),
          },
        });
      }
    }

    /**
     * Never create a Website session after password alone.
     * Even if the Engine returns tokens without a challenge, the Website refuses
     * them — Login OTP must be completed before JWT / refresh cookies are set.
     */
    return NextResponse.json(
      {
        success: false,
        requiresOtp: true,
        message:
          "Login OTP verification is required. Complete email verification before continuing.",
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

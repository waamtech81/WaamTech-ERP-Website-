import { NextResponse } from "next/server";
import { identityResendLoginOtp } from "@/lib/license/identity";
import { platformResendOtp } from "@/lib/license/platform-auth";
import { friendlyAuthMessage } from "@/lib/auth/session";
import {
  getClientIp,
  isSameOrigin,
  rateLimit,
  sanitizeText,
} from "@/lib/security/guards";

export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) {
      return NextResponse.json(
        { success: false, message: "Invalid request origin." },
        { status: 403 }
      );
    }

    const ip = getClientIp(req);
    const limited = await rateLimit(`portal-resend-otp:${ip}`, 8, 15 * 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        {
          success: false,
          message: `Too many resend requests. Try again in ${limited.retryAfter}s.`,
        },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
      );
    }

    const body = await req.json();
    // JWT challenge tokens exceed 128 chars — keep room for Engine tokens.
    const challengeToken = sanitizeText(body?.challenge_token, 4096);
    const accountKind = sanitizeText(body?.account_kind, 32);
    const captchaToken = sanitizeText(
      body?.captcha_token || body?.recaptchaToken || body?.recaptcha_token,
      8192
    );

    if (!challengeToken) {
      return NextResponse.json(
        { success: false, message: "Verification session is required." },
        { status: 400 }
      );
    }

    if (accountKind === "platform") {
      const result = await platformResendOtp({
        challenge_token: challengeToken,
        captcha_token: captchaToken || undefined,
      });
      if (!result.ok) {
        return NextResponse.json(
          { success: false, message: friendlyAuthMessage(result.message) },
          { status: result.status >= 400 && result.status < 600 ? result.status : 502 }
        );
      }
      return NextResponse.json({
        success: true,
        message: result.message || "A new verification code was sent.",
        data: { otpExpiresInMinutes: 10, account_kind: "platform" },
      });
    }

    const result = await identityResendLoginOtp({
      challenge_token: challengeToken,
      captcha_token: captchaToken || undefined,
    });
    if (!result.ok) {
      return NextResponse.json(
        { success: false, message: friendlyAuthMessage(result.message) },
        { status: result.status >= 400 && result.status < 600 ? result.status : 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message || "A new verification code was sent.",
      data: {
        otpExpiresInMinutes:
          result.data &&
          typeof result.data === "object" &&
          "otpExpiresInMinutes" in result.data
            ? Number(
                (result.data as { otpExpiresInMinutes?: number })
                  .otpExpiresInMinutes || 10
              )
            : 10,
        account_kind: "customer",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to resend code. Please try again." },
      { status: 502 }
    );
  }
}

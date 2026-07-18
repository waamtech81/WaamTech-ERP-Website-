import { NextResponse } from "next/server";
import { identityResetPassword } from "@/lib/license/identity";
import {
  getClientIp,
  isSameOrigin,
  rateLimit,
  sanitizeText,
} from "@/lib/security/guards";

/**
 * Password reset completion — forwards new password to License Engine.
 * Website never stores or hashes passwords locally.
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
    const limited = await rateLimit(`portal-reset:${ip}`, 8, 15 * 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        {
          success: false,
          message: `Too many attempts. Try again in ${limited.retryAfter}s.`,
        },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
      );
    }

    const body = await req.json();
    const token = sanitizeText(body?.token, 256);
    const password = String(body?.password || body?.new_password || "");
    const confirm = String(body?.confirm_password || body?.confirmPassword || "");

    if (!token || token.length < 20) {
      return NextResponse.json(
        { success: false, message: "This reset link is invalid or incomplete." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must include uppercase, lowercase, and a number.",
        },
        { status: 400 }
      );
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return NextResponse.json(
        { success: false, message: "Password must include a special character." },
        { status: 400 }
      );
    }

    if (password !== confirm) {
      return NextResponse.json(
        { success: false, message: "Passwords do not match." },
        { status: 400 }
      );
    }

    const result = await identityResetPassword({
      token,
      new_password: password,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            result.message ||
            "Reset link is invalid or expired. Request a new one.",
        },
        { status: result.status >= 400 && result.status < 600 ? result.status : 400 }
      );
    }

    const appLogin = (
      process.env.NEXT_PUBLIC_APP_URL || "https://app.waamto.com"
    ).replace(/\/$/, "") + "/login";

    return NextResponse.json({
      success: true,
      message: result.message || "Password updated successfully.",
      redirectUrl: appLogin,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to reset password right now. Please try again.",
      },
      { status: 502 }
    );
  }
}

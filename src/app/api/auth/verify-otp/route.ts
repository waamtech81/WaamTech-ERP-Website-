import { NextResponse } from "next/server";
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

export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) {
      return NextResponse.json(
        { success: false, message: "Invalid request origin." },
        { status: 403 }
      );
    }

    const ip = getClientIp(req);
    const limited = rateLimit(`verify-otp:${ip}`, 20, 15 * 60_000);
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
    const action = sanitizeText(body?.action, 20) || "verify";
    const registrationId = sanitizeText(
      body?.registration_id || body?.registrationId,
      64
    );
    const email = sanitizeText(body?.email, 254).toLowerCase() || undefined;
    const otp = sanitizeText(body?.otp || body?.code, 10);

    if (!registrationId) {
      return NextResponse.json(
        { success: false, message: "Registration session is required." },
        { status: 400 }
      );
    }

    if (action === "resend") {
      const result = await resendRegistrationOtp({
        registration_id: registrationId,
        email,
      });
      if (!result.ok) {
        return NextResponse.json(
          { success: false, message: result.message },
          { status: result.status >= 400 && result.status < 600 ? result.status : 502 }
        );
      }
      return NextResponse.json({
        success: true,
        message: result.message || "A new verification code was sent.",
        data: result.data,
      });
    }

    if (!otp || otp.length < 4) {
      return NextResponse.json(
        { success: false, message: "Enter the verification code from your email." },
        { status: 400 }
      );
    }

    const result = await verifyRegistrationOtp({
      registration_id: registrationId,
      otp,
      email,
    });

    if (!result.ok || !result.data) {
      return NextResponse.json(
        { success: false, message: result.message || "Verification failed." },
        { status: result.status >= 400 && result.status < 600 ? result.status : 502 }
      );
    }

    const appUrl = result.data.appUrl || result.data.loginUrl || authConfig.appUrl;

    return NextResponse.json({
      success: true,
      message:
        result.message ||
        `Email verified. Your ${result.data.trialDays || authConfig.trialDays}-day trial is ready.`,
      data: {
        ...result.data,
        appUrl,
        trialDays: result.data.trialDays || authConfig.trialDays,
        redirectUrl: appUrl,
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to verify code. Please try again.",
      },
      { status: 502 }
    );
  }
}

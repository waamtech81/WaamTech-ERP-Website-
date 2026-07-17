import { NextResponse } from "next/server";
import { identityForgotPassword } from "@/lib/license/identity";
import {
  getClientIp,
  isSameOrigin,
  isValidEmail,
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
    const limited = await rateLimit(`portal-forgot:${ip}`, 6, 15 * 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        {
          success: false,
          message: `Too many requests. Try again in ${limited.retryAfter}s.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const email = sanitizeText(body?.email, 254).toLowerCase();
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: "Enter a valid email address." },
        { status: 400 }
      );
    }

    const result = await identityForgotPassword(email);
    // Always return a generic success-style message (Engine also avoids enumeration)
    return NextResponse.json({
      success: true,
      message:
        result.message ||
        "If an account exists for that email, a reset link has been sent.",
    });
  } catch {
    return NextResponse.json({
      success: true,
      message: "If an account exists for that email, a reset link has been sent.",
    });
  }
}

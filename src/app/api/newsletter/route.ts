import { NextResponse } from "next/server";
import { sendNewsletterSubscriptionNotice } from "@/lib/auth/email";
import {
  getClientIp,
  isSameOrigin,
  isValidEmail,
  looksLikeBotPayload,
  rateLimit,
  sanitizeText,
} from "@/lib/security/guards";

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json(
        { success: false, message: "Invalid request origin." },
        { status: 403 }
      );
    }

    const ip = getClientIp(request);
    const limited = await rateLimit(`newsletter:${ip}`, 8, 15 * 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many requests. Please try again later.",
        },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    // Honeypot + minimum form fill time
    if (looksLikeBotPayload(body)) {
      return NextResponse.json({ success: true, message: "Subscribed." });
    }

    const email = sanitizeText(body?.email, 254).toLowerCase();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const emailLimited = await rateLimit(
      `newsletter-email:${email}`,
      3,
      60 * 60_000
    );
    if (!emailLimited.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many requests. Please try again later.",
        },
        {
          status: 429,
          headers: { "Retry-After": String(emailLimited.retryAfter) },
        }
      );
    }

    const result = await sendNewsletterSubscriptionNotice({
      subscriberEmail: email,
    });

    if (!result.sent) {
      return NextResponse.json(
        {
          success: false,
          message: "Could not complete subscription. Please try again.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Thanks — you are subscribed to product updates.",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

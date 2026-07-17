import { NextResponse } from "next/server";
import { sendNewsletterSubscriptionNotice } from "@/lib/auth/email";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body?.email || "")
      .trim()
      .toLowerCase();
    const honeypot = String(body?.website || "").trim();

    // Bot trap
    if (honeypot) {
      return NextResponse.json({ success: true, message: "Subscribed." });
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const result = await sendNewsletterSubscriptionNotice({ subscriberEmail: email });

    if (!result.sent) {
      return NextResponse.json(
        {
          success: false,
          message: result.error || "Could not complete subscription. Please try again.",
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

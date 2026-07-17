import { NextResponse } from "next/server";
import { sendContactFormMessage } from "@/lib/auth/email";
import { verifyContactCaptcha } from "@/lib/security/contact-captcha";
import {
  contactSubjectForIntent,
  parseContactIntent,
} from "@/lib/security/contact-intent";
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
    const limited = await rateLimit(`contact:${ip}`, 5, 15 * 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many messages. Please try again later.",
        },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    // Honeypot + minimum fill time (image captcha needs human interaction)
    if (looksLikeBotPayload(body)) {
      return NextResponse.json({
        success: true,
        message: "Thanks — your message has been sent.",
      });
    }

    const started = Number(body._t || 0);
    if (!started || Date.now() - started < 2500) {
      return NextResponse.json(
        { success: false, message: "Please complete the security check carefully." },
        { status: 400 }
      );
    }

    const name = sanitizeText(body.name, 120);
    const email = sanitizeText(body.email, 254).toLowerCase();
    const company = sanitizeText(body.company, 160);
    const phone = sanitizeText(body.phone, 40);
    const message = sanitizeText(body.message, 4000);
    const captchaToken = sanitizeText(body.captchaToken, 400);
    const captchaSelection = body.captchaSelection ?? body.captchaAnswer;

    // Intent must be allowlisted — never trust raw query/body strings
    const intent = parseContactIntent(
      typeof body.intent === "string" ? body.intent : null
    );
    const subjectFromIntent = contactSubjectForIntent(intent);
    const subject = subjectFromIntent || sanitizeText(body.subject, 160);

    if (!name || !email || !company || !phone || !subject || !message) {
      return NextResponse.json(
        { success: false, message: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid work email." },
        { status: 400 }
      );
    }

    const captchaResult = verifyContactCaptcha(captchaToken, captchaSelection);
    if (!captchaResult.ok) {
      return NextResponse.json(
        {
          success: false,
          message: captchaResult.reason,
        },
        { status: 400 }
      );
    }

    const emailLimited = await rateLimit(`contact-email:${email}`, 3, 60 * 60_000);
    if (!emailLimited.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many messages from this email. Please try again later.",
        },
        {
          status: 429,
          headers: { "Retry-After": String(emailLimited.retryAfter) },
        }
      );
    }

    const result = await sendContactFormMessage({
      name,
      email,
      company,
      phone,
      subject: intent ? `[${intent}] ${subject}` : subject,
      message,
    });

    if (!result.sent) {
      return NextResponse.json(
        {
          success: false,
          message: "Could not send your message. Please try again.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Thanks — your message has been sent. We'll get back to you soon.",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

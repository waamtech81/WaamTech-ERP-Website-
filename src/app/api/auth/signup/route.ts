import { NextResponse } from "next/server";
import { authConfig, normalizeApiBase } from "@/lib/auth/config";
import { sendVerificationEmail } from "@/lib/auth/email";
import { createPendingSignup, maskEmail } from "@/lib/auth/verification-store";
import {
  getClientIp,
  isSameOrigin,
  isValidEmail,
  looksLikeBotPayload,
  rateLimit,
  sanitizeText,
} from "@/lib/security/guards";

type ApiEnvelope = {
  success?: boolean;
  message?: string;
  data?: Record<string, unknown>;
};

async function callCore(path: string, body: unknown) {
  const base = normalizeApiBase(authConfig.apiUrl);
  const url = `${base}/v1${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  let json: ApiEnvelope = {};
  try {
    json = (await res.json()) as ApiEnvelope;
  } catch {
    json = { success: false, message: "Invalid response from signup service." };
  }

  return { status: res.status, json };
}

export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) {
      return NextResponse.json(
        { success: false, message: "Invalid request origin." },
        { status: 403 }
      );
    }

    const ip = getClientIp(req);
    const limited = rateLimit(`signup:${ip}`, 5, 15 * 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        {
          success: false,
          message: `Too many signup attempts. Try again in ${limited.retryAfter}s.`,
        },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
      );
    }

    const body = await req.json();

    if (looksLikeBotPayload(body || {})) {
      // Silent success shape for bots — no account created
      return NextResponse.json({
        success: true,
        requiresVerification: true,
        message: "Check your email to verify your account.",
        data: { email: "hidden" },
      });
    }

    const name = sanitizeText(body?.name, 120);
    const email = sanitizeText(body?.email || body?.username, 254).toLowerCase();
    const password = String(body?.password || "");
    const phone = sanitizeText(body?.phone || body?.company_phone, 40) || undefined;
    const company_name = sanitizeText(body?.company_name, 160);
    const resolvedProfileId = sanitizeText(
      body?.business_category_id || body?.profile_id,
      80
    );
    const industry_id = sanitizeText(body?.industry_id, 80) || undefined;
    const plan = sanitizeText(body?.plan, 40) || undefined;

    if (!name || !password || !email || !company_name || !resolvedProfileId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please fill name, email, password, company name, and business category.",
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid work email." },
        { status: 400 }
      );
    }

    if (password.length < 8 || password.length > 128) {
      return NextResponse.json(
        { success: false, message: "Password must be 8–128 characters." },
        { status: 400 }
      );
    }

    const emailLimited = rateLimit(`signup-email:${email}`, 3, 60 * 60_000);
    if (!emailLimited.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many verification emails requested for this address. Try later.",
        },
        { status: 429 }
      );
    }

    // Optional pre-check against Core if endpoint exists (non-blocking on failure)
    try {
      await callCore("/auth/check-email", { email });
    } catch {
      /* ignore */
    }

    const { token } = await createPendingSignup({
      email,
      name,
      password,
      phone,
      company_name,
      profile_id: resolvedProfileId,
      industry_id,
      plan,
    });

    const mail = await sendVerificationEmail({ to: email, name, token });
    if (!mail.sent) {
      return NextResponse.json(
        {
          success: false,
          message:
            mail.error ||
            "Could not send verification email. Please contact support or try again.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      message: `We sent a verification link to ${maskEmail(email)}. Verify your email to activate your account.`,
      data: {
        email: maskEmail(email),
        trialDays: authConfig.trialDays,
        delivery: mail.mode,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to process signup.";
    return NextResponse.json(
      {
        success: false,
        message:
          message.includes("fetch") || message.includes("ECONNREFUSED")
            ? "Signup service temporarily unavailable. Please try again."
            : "Unable to process signup. Please try again.",
      },
      { status: 502 }
    );
  }
}

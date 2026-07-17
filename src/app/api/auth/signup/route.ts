import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth/config";
import { startRegistrationOnLicenseServer } from "@/lib/license/client";
import {
  isValidCountryCode,
  mergePhoneWithDialCode,
  resolveDialCode,
} from "@/lib/data/countries";
import {
  getClientIp,
  isSameOrigin,
  isValidEmail,
  looksLikeBotPayload,
  rateLimit,
  sanitizeText,
} from "@/lib/security/guards";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(1, local.length - 2))}@${domain}`;
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
    const limited = await rateLimit(`signup:${ip}`, 5, 15 * 60_000);
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
      return NextResponse.json({
        success: true,
        requiresOtp: true,
        message: "Check your email for a verification code.",
        data: { email: "hidden" },
      });
    }

    const name = sanitizeText(body?.name, 120);
    const email = sanitizeText(body?.email || body?.username, 254).toLowerCase();
    const password = String(body?.password || "");
    const company_name = sanitizeText(body?.company_name, 160);
    const country = sanitizeText(body?.country || body?.country_code, 2).toUpperCase();
    const phoneCountryCode = sanitizeText(
      body?.phone_country_code || body?.phoneCountryCode,
      2
    ).toUpperCase();
    const dialCode = resolveDialCode({
      phoneDialCode: body?.phone_dial_code || body?.phoneDialCode || body?.dial_code,
      phoneCountryCode: phoneCountryCode || undefined,
      countryCode: country || undefined,
    });
    // Prefer local number + dial merge on server so license always gets country code.
    const phoneLocal = sanitizeText(body?.phone_local || body?.phoneLocal, 40);
    const phoneRaw = sanitizeText(body?.phone || body?.company_phone, 40);
    const phone =
      mergePhoneWithDialCode(dialCode, phoneLocal || phoneRaw) ||
      phoneRaw ||
      undefined;
    const resolvedProfileId = sanitizeText(body?.profile_id, 80);
    const category_id =
      sanitizeText(body?.category_id || body?.business_category_id, 80) || undefined;
    const industry_id = sanitizeText(body?.industry_id, 80) || undefined;
    const product_id = sanitizeText(body?.product_id, 80) || undefined;
    const product_slug = sanitizeText(body?.product_slug, 80) || undefined;
    const plan_id = sanitizeText(body?.plan_id, 80) || undefined;
    const plan = sanitizeText(body?.plan, 40) || undefined;
    const marketing_opt_in = Boolean(body?.marketing_opt_in);

    if (
      !name ||
      !password ||
      !email ||
      !company_name ||
      !resolvedProfileId ||
      !country
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please fill name, email, password, company name, country, and business profile.",
        },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { success: false, message: "Please enter a phone number." },
        { status: 400 }
      );
    }

    if (!isValidCountryCode(country)) {
      return NextResponse.json(
        { success: false, message: "Please select a valid country." },
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

    const emailLimited = await rateLimit(`signup-email:${email}`, 3, 60 * 60_000);
    if (!emailLimited.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many verification emails requested for this address. Try later.",
        },
        { status: 429 }
      );
    }

    const license = await startRegistrationOnLicenseServer({
      name,
      email,
      password,
      phone,
      company_name,
      country,
      profile_id: resolvedProfileId,
      industry_id,
      category_id,
      product_id,
      product_slug,
      plan_id,
      plan,
      marketing_opt_in,
    });

    if (!license.ok || !license.data?.registrationId) {
      return NextResponse.json(
        {
          success: false,
          message: license.message || "Could not start registration with license server.",
        },
        { status: license.status >= 400 && license.status < 600 ? license.status : 502 }
      );
    }

    return NextResponse.json({
      success: true,
      requiresOtp: true,
      message:
        license.message ||
        `We sent a verification code to ${maskEmail(email)}. Enter it to activate your trial.`,
      data: {
        registrationId: license.data.registrationId,
        email: license.data.email || maskEmail(email),
        trialDays: license.data.trialDays || authConfig.trialDays,
        otpExpiresInMinutes: license.data.otpExpiresInMinutes || 10,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process signup.";
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

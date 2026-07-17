import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth/config";
import {
  bumpAttempts,
  decryptPendingPassword,
  deletePending,
  readPendingByToken,
} from "@/lib/auth/verification-store";
import { provisionCoreTenant, registerTrialOnLicenseServer } from "@/lib/license/client";
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
    const limited = rateLimit(`verify:${ip}`, 20, 15 * 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        { success: false, message: "Too many verification attempts." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const token = sanitizeText(body?.token, 200);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Verification token is missing." },
        { status: 400 }
      );
    }

    const pending = await readPendingByToken(token);
    if (!pending) {
      return NextResponse.json(
        {
          success: false,
          message: "This verification link is invalid or has expired. Please sign up again.",
        },
        { status: 400 }
      );
    }

    if (pending.attempts >= 8) {
      await deletePending(pending.tokenHash);
      return NextResponse.json(
        { success: false, message: "Too many attempts. Please sign up again." },
        { status: 429 }
      );
    }

    await bumpAttempts(pending);

    const password = decryptPendingPassword(pending);
    const registrationInput = {
      name: pending.name,
      email: pending.email,
      password,
      phone: pending.phone,
      company_name: pending.company_name,
      profile_id: pending.profile_id,
      industry_id: pending.industry_id,
      plan: pending.plan,
      email_verified: true,
    };

    // 1) Register on license server — package + license key + license email
    const license = await registerTrialOnLicenseServer(registrationInput);

    if (!license.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            license.message ||
            "Could not complete trial registration on the license server. Please try again.",
        },
        { status: 502 }
      );
    }

    // 2) Optional ERP Core provisioning (backend); failures are non-blocking
    await provisionCoreTenant(registrationInput);

    await deletePending(pending.tokenHash);

    return NextResponse.json({
      success: true,
      message: `Email verified. Your ${authConfig.trialDays}-day trial license has been emailed. Open the WAAMTO app and activate it with your license key.`,
      data: {
        email: pending.email,
        trialDays: authConfig.trialDays,
        licenseEmailed: license.data?.licenseEmailed ?? true,
        appUrl: authConfig.appUrl,
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Verification failed. Please try again or sign up again.",
      },
      { status: 502 }
    );
  }
}

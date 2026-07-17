import { NextResponse } from "next/server";

/**
 * Legacy email-link verification is permanently disabled.
 * Registration must use License Engine OTP:
 *   POST /api/auth/signup → OTP email
 *   POST /api/auth/verify-otp → Engine validates OTP → customer/trial/license/provision
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message:
        "This verification method is no longer supported. Please sign up again and enter the email verification code.",
      code: "LEGACY_VERIFY_EMAIL_DISABLED",
    },
    { status: 410 }
  );
}

export async function GET() {
  return POST();
}

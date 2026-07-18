/**
 * Google reCAPTCHA v2 server-side verification.
 * https://developers.google.com/recaptcha/docs/verify
 */

export type RecaptchaVerifyResult =
  | { ok: true }
  | { ok: false; reason: string };

export async function verifyGoogleRecaptcha(
  token: string,
  remoteIp?: string | null
): Promise<RecaptchaVerifyResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY?.trim();
  if (!secret) {
    return { ok: false, reason: "Captcha is not configured." };
  }

  const response = token?.trim() || "";
  if (!response || response.length > 4000) {
    return { ok: false, reason: "Please complete the captcha." };
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", response);
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      cache: "no-store",
    });

    const data = (await res.json().catch(() => null)) as {
      success?: boolean;
      "error-codes"?: string[];
    } | null;

    if (!res.ok || !data?.success) {
      return {
        ok: false,
        reason: "Captcha verification failed. Please try again.",
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      reason: "Captcha verification unavailable. Please try again.",
    };
  }
}

export function isGoogleRecaptchaConfigured(): boolean {
  return Boolean(process.env.RECAPTCHA_SECRET_KEY?.trim());
}

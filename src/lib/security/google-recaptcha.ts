/**
 * Google reCAPTCHA verification (v2 checkbox + v3 score/action).
 * https://developers.google.com/recaptcha/docs/verify
 */

export type RecaptchaVerifyResult =
  | { ok: true; score?: number }
  | { ok: false; reason: string };

type GoogleRecaptchaResponse = {
  success?: boolean;
  score?: number;
  action?: string;
  "error-codes"?: string[];
};

async function siteVerify(
  token: string,
  remoteIp?: string | null
): Promise<GoogleRecaptchaResponse | null> {
  const secret = process.env.RECAPTCHA_SECRET_KEY?.trim();
  if (!secret) return null;

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token.trim());
  if (remoteIp) body.set("remoteip", remoteIp);

  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });

  return (await res.json().catch(() => null)) as GoogleRecaptchaResponse | null;
}

/** reCAPTCHA v2 checkbox (contact form). */
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

  try {
    const data = await siteVerify(response, remoteIp);
    if (!data?.success) {
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

/**
 * reCAPTCHA v3 — used for portal login, signup, OTP, forgot/reset password.
 * When RECAPTCHA_SECRET_KEY is unset, verification is skipped (local/dev).
 * When set, token is required and must pass score (+ optional action).
 */
export async function verifyGoogleRecaptchaV3(
  token: string | undefined | null,
  expectedAction: string,
  remoteIp?: string | null
): Promise<RecaptchaVerifyResult> {
  if (!isGoogleRecaptchaConfigured()) {
    return { ok: true };
  }

  const response = token?.trim() || "";
  if (!response || response.length > 4000) {
    return {
      ok: false,
      reason: "Captcha verification required. Please refresh and try again.",
    };
  }

  try {
    const data = await siteVerify(response, remoteIp);
    if (!data?.success) {
      return {
        ok: false,
        reason: "Captcha verification failed. Please try again.",
      };
    }

    if (data.action && data.action !== expectedAction) {
      return {
        ok: false,
        reason: "Captcha verification failed. Please try again.",
      };
    }

    const minScore = Number(process.env.RECAPTCHA_MIN_SCORE || "0.5");
    const score = typeof data.score === "number" ? data.score : undefined;
    // v2 tokens have no score — accept them only when score is absent.
    if (typeof score === "number" && score < (Number.isFinite(minScore) ? minScore : 0.5)) {
      return {
        ok: false,
        reason: "Captcha verification failed. Please try again.",
      };
    }

    return { ok: true, score };
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

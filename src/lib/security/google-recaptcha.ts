/**
 * Google reCAPTCHA verification (v2 checkbox + v3 score/action).
 * https://developers.google.com/recaptcha/docs/verify
 *
 * Auth policy (signup / OTP / password reset):
 * - Hard-block only when Google says the token is invalid (success:false) or missing.
 * - Low score / action mismatch are logged but do NOT block — email OTP / reset
 *   links already gate those flows. Hard-blocking registration kills real customers.
 */

export type RecaptchaVerifyResult =
  | { ok: true; score?: number }
  | { ok: false; reason: string };

type GoogleRecaptchaResponse = {
  success?: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

export type RecaptchaV3Options = {
  /** Soft auth mode: only require a valid Google token (default true for auth). */
  soft?: boolean;
  /** Override minimum score when soft=false. Default from RECAPTCHA_MIN_SCORE or 0.3. */
  minScore?: number;
};

function recaptchaSecret(): string {
  return (
    process.env.RECAPTCHA_SECRET_KEY?.trim() ||
    process.env.GOOGLE_CAPTCHA_SECRET_KEY?.trim() ||
    ""
  );
}

async function siteVerify(
  token: string,
  remoteIp?: string | null
): Promise<GoogleRecaptchaResponse | null> {
  const secret = recaptchaSecret();
  if (!secret) return null;

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token.trim());
  // Only forward public client IPs — private/proxy placeholders can confuse siteverify.
  const ip = remoteIp?.trim() || "";
  if (ip && !ip.startsWith("127.") && ip !== "::1" && ip !== "unknown") {
    body.set("remoteip", ip);
  }

  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });

  return (await res.json().catch(() => null)) as GoogleRecaptchaResponse | null;
}

function reasonFromErrorCodes(codes: string[] | undefined): string {
  const set = new Set(codes || []);
  if (set.has("invalid-input-secret") || set.has("missing-input-secret")) {
    return "Captcha is misconfigured. Please contact support.";
  }
  if (set.has("timeout-or-duplicate")) {
    return "Captcha expired. Please submit again.";
  }
  if (set.has("bad-request") || set.has("invalid-input-response") || set.has("missing-input-response")) {
    return "Captcha verification failed. Please refresh and try again.";
  }
  return "Captcha verification failed. Please try again.";
}

/** reCAPTCHA v2 checkbox (contact form). */
export async function verifyGoogleRecaptcha(
  token: string,
  remoteIp?: string | null
): Promise<RecaptchaVerifyResult> {
  if (!recaptchaSecret()) {
    return { ok: false, reason: "Captcha is not configured." };
  }

  const response = token?.trim() || "";
  if (!response || response.length > 8192) {
    return { ok: false, reason: "Please complete the captcha." };
  }

  try {
    const data = await siteVerify(response, remoteIp);
    if (!data?.success) {
      console.warn("[recaptcha:v2] verify failed", {
        errors: data?.["error-codes"],
        hostname: data?.hostname,
      });
      return { ok: false, reason: reasonFromErrorCodes(data?.["error-codes"]) };
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
 * reCAPTCHA v3 — portal auth flows.
 * When secret is unset, verification is skipped (local/dev).
 */
export async function verifyGoogleRecaptchaV3(
  token: string | undefined | null,
  expectedAction: string,
  remoteIp?: string | null,
  options?: RecaptchaV3Options
): Promise<RecaptchaVerifyResult> {
  if (!isGoogleRecaptchaConfigured()) {
    return { ok: true };
  }

  const soft = options?.soft !== false;
  const response = token?.trim() || "";
  if (!response || response.length > 8192) {
    if (soft) {
      console.warn("[recaptcha:v3] token missing (allowed in soft mode)", {
        action: expectedAction,
      });
      return { ok: true };
    }
    return {
      ok: false,
      reason: "Captcha verification required. Please refresh and try again.",
    };
  }

  try {
    const data = await siteVerify(response, remoteIp);
    if (!data?.success) {
      console.warn("[recaptcha:v3] token rejected by Google", {
        action: expectedAction,
        errors: data?.["error-codes"],
        hostname: data?.hostname,
      });
      return { ok: false, reason: reasonFromErrorCodes(data?.["error-codes"]) };
    }

    const score = typeof data.score === "number" ? data.score : undefined;

    if (data.action && data.action !== expectedAction) {
      console.warn("[recaptcha:v3] action mismatch (allowed in soft mode)", {
        expected: expectedAction,
        got: data.action,
        score,
        hostname: data.hostname,
      });
      if (!soft) {
        return {
          ok: false,
          reason: "Captcha verification failed. Please try again.",
        };
      }
    }

    const minScore =
      typeof options?.minScore === "number" && Number.isFinite(options.minScore)
        ? options.minScore
        : Number(process.env.RECAPTCHA_MIN_SCORE || (soft ? "0.1" : "0.3"));

    if (typeof score === "number" && score < (Number.isFinite(minScore) ? minScore : 0.1)) {
      console.warn("[recaptcha:v3] low score", {
        action: expectedAction,
        score,
        minScore,
        soft,
        hostname: data.hostname,
      });
      if (!soft) {
        return {
          ok: false,
          reason: "Captcha verification failed. Please try again.",
        };
      }
      // Soft: allow — OTP / email links still protect the account.
    }

    return { ok: true, score };
  } catch (err) {
    console.warn("[recaptcha:v3] siteverify error", err);
    return {
      ok: false,
      reason: "Captcha verification unavailable. Please try again.",
    };
  }
}

export function isGoogleRecaptchaConfigured(): boolean {
  return Boolean(recaptchaSecret());
}

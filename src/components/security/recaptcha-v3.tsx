"use client";

/**
 * Auth reCAPTCHA is disabled. Auth is protected by email OTP, same-origin
 * checks, honeypots, and rate limits. Contact Us keeps its separate v2 widget.
 */
export function RecaptchaV3() {
  return null;
}

export async function executeRecaptcha(_action: string): Promise<string | null> {
  return null;
}

export function hasRecaptchaV3SiteKey(): boolean {
  return false;
}

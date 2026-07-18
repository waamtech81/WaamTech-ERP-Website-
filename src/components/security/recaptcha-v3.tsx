"use client";

import Script from "next/script";

/**
 * Prefer a dedicated v3 site key so contact-form v2 keys stay separate.
 * Falls back to NEXT_PUBLIC_RECAPTCHA_SITE_KEY when only one key is configured.
 */
const SITE_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim() ||
  "";

/** Loads Google reCAPTCHA v3 (invisible badge + execute API). */
export function RecaptchaV3() {
  if (!SITE_KEY) return null;

  return (
    <Script
      src={`https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`}
      strategy="afterInteractive"
    />
  );
}

/** Execute v3 and return a token for the given action. */
export async function executeRecaptcha(action: string): Promise<string | null> {
  if (!SITE_KEY || typeof window === "undefined") {
    return null;
  }

  const grecaptcha = window.grecaptcha as
    | {
        ready: (cb: () => void) => void;
        execute: (siteKey: string, options: { action: string }) => Promise<string>;
      }
    | undefined;

  if (!grecaptcha?.execute) return null;

  try {
    await new Promise<void>((resolve) => {
      grecaptcha.ready(() => resolve());
    });
    return await grecaptcha.execute(SITE_KEY, { action });
  } catch {
    return null;
  }
}

export function hasRecaptchaV3SiteKey(): boolean {
  return Boolean(SITE_KEY);
}

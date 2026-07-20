"use client";

import Script from "next/script";

/**
 * Prefer a dedicated v3 site key so contact-form v2 keys stay separate.
 * Falls back to NEXT_PUBLIC_RECAPTCHA_SITE_KEY / legacy GOOGLE_CAPTCHA name.
 */
const SITE_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_GOOGLE_CAPTCHA_SITE_KEY?.trim() ||
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

async function waitForGrecaptcha(timeoutMs = 8000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const grecaptcha = window.grecaptcha as
      | {
          ready: (cb: () => void) => void;
          execute: (siteKey: string, options: { action: string }) => Promise<string>;
        }
      | undefined;
    if (grecaptcha?.execute) return grecaptcha;
    await new Promise((r) => setTimeout(r, 150));
  }
  return null;
}

/** Execute v3 and return a token for the given action. Retries once if script is still loading. */
export async function executeRecaptcha(action: string): Promise<string | null> {
  if (!SITE_KEY || typeof window === "undefined") {
    return null;
  }

  const run = async () => {
    const grecaptcha = await waitForGrecaptcha();
    if (!grecaptcha) return null;
    await new Promise<void>((resolve) => {
      grecaptcha.ready(() => resolve());
    });
    return await grecaptcha.execute(SITE_KEY, { action });
  };

  try {
    const first = await run();
    if (first) return first;
    // One retry — script/network race on slow connections.
    await new Promise((r) => setTimeout(r, 400));
    return await run();
  } catch {
    return null;
  }
}

export function hasRecaptchaV3SiteKey(): boolean {
  return Boolean(SITE_KEY);
}

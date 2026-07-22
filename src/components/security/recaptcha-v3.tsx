"use client";

import Script from "next/script";

const SITE_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_CAPTCHA_SITE_KEY?.trim() || "";

type GoogleRecaptcha = {
  ready: (callback: () => void) => void;
  execute: (
    siteKey: string,
    options: { action: string }
  ) => Promise<string>;
};

function googleRecaptcha(): GoogleRecaptcha | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as typeof window & { grecaptcha?: GoogleRecaptcha }).grecaptcha;
}

async function waitForRecaptcha(timeoutMs = 8_000): Promise<GoogleRecaptcha | null> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const recaptcha = googleRecaptcha();
    if (recaptcha?.execute) return recaptcha;
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }
  return null;
}

export function RecaptchaV3() {
  if (!SITE_KEY) return null;

  return (
    <Script
      id="google-recaptcha-v3"
      src={`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(SITE_KEY)}`}
      strategy="afterInteractive"
    />
  );
}

export async function executeRecaptcha(action: string): Promise<string | null> {
  if (!SITE_KEY || !action.trim()) return null;

  const recaptcha = await waitForRecaptcha();
  if (!recaptcha) return null;

  return new Promise((resolve) => {
    let settled = false;
    const timeout = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, 8_000);

    recaptcha.ready(() => {
      recaptcha
        .execute(SITE_KEY, { action })
        .then((token) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          resolve(token?.trim() || null);
        })
        .catch(() => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          resolve(null);
        });
    });
  });
}

export function hasRecaptchaV3SiteKey(): boolean {
  return Boolean(SITE_KEY);
}

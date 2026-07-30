"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const SITE_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_CAPTCHA_SITE_KEY?.trim() || "";

type WindowWithRecaptchaKey = Window & {
  __WAAMTO_RECAPTCHA_SITE_KEY__?: string;
};

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

export function recaptchaSiteKey(): string {
  if (typeof window === "undefined") return SITE_KEY;
  return (
    (window as WindowWithRecaptchaKey).__WAAMTO_RECAPTCHA_SITE_KEY__?.trim() ||
    SITE_KEY
  );
}

function recaptchaScriptSrc(siteKey: string): string {
  return `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
}

export function isRecaptchaScriptLoaded(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(
    document.querySelector('script[src*="recaptcha/api.js"]') ||
      googleRecaptcha()?.execute
  );
}

async function waitForRecaptcha(timeoutMs = 12_000): Promise<GoogleRecaptcha | null> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const recaptcha = googleRecaptcha();
    if (recaptcha?.execute) return recaptcha;
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }
  return null;
}

async function executeRecaptchaOnce(action: string): Promise<string | null> {
  const siteKey = recaptchaSiteKey();
  if (!siteKey || !action.trim()) return null;

  const recaptcha = await waitForRecaptcha();
  if (!recaptcha) return null;

  return new Promise((resolve) => {
    let settled = false;
    const timeout = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, 12_000);

    recaptcha.ready(() => {
      recaptcha
        .execute(siteKey, { action })
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

/** Optional per-page loader — skipped when layout bootstrap already injected api.js. */
export function RecaptchaV3() {
  const siteKey = recaptchaSiteKey();
  const [needsScript, setNeedsScript] = useState(false);

  useEffect(() => {
    if (!siteKey) {
      setNeedsScript(false);
      return;
    }
    setNeedsScript(!isRecaptchaScriptLoaded());
  }, [siteKey]);

  if (!siteKey || !needsScript) return null;

  return (
    <Script
      id="google-recaptcha-v3"
      src={recaptchaScriptSrc(siteKey)}
      strategy="afterInteractive"
    />
  );
}

export async function executeRecaptcha(action: string): Promise<string | null> {
  let token = await executeRecaptchaOnce(action);
  if (token) return token;
  await new Promise((resolve) => window.setTimeout(resolve, 350));
  token = await executeRecaptchaOnce(action);
  return token;
}

export function hasRecaptchaV3SiteKey(): boolean {
  return Boolean(recaptchaSiteKey());
}

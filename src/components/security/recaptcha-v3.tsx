"use client";

import Script from "next/script";
import { useCallback, useEffect, useState } from "react";

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

export type RecaptchaReadyStatus = "disabled" | "loading" | "ready" | "error";

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

function recaptchaScriptElement(): HTMLScriptElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector('script[src*="recaptcha/api.js"]');
}

export function isRecaptchaScriptLoaded(): boolean {
  return Boolean(recaptchaScriptElement() || googleRecaptcha()?.execute);
}

function waitForRecaptchaExecute(timeoutMs = 15_000): Promise<GoogleRecaptcha | null> {
  const startedAt = Date.now();
  return new Promise((resolve) => {
    const tick = () => {
      const recaptcha = googleRecaptcha();
      if (recaptcha?.execute) {
        resolve(recaptcha);
        return;
      }
      if (Date.now() - startedAt >= timeoutMs) {
        resolve(null);
        return;
      }
      window.setTimeout(tick, 50);
    };
    tick();
  });
}

function waitForScriptElement(
  script: HTMLScriptElement,
  timeoutMs = 15_000
): Promise<void> {
  if (googleRecaptcha()?.execute) return Promise.resolve();

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      fn();
    };

    const onLoad = () => finish(resolve);
    const onError = () => finish(() => reject(new Error("recaptcha_script_error")));

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });

    const timer = window.setTimeout(() => {
      finish(() => reject(new Error("recaptcha_script_timeout")));
    }, timeoutMs);
  });
}

function injectRecaptchaScript(siteKey: string): Promise<void> {
  const existing = recaptchaScriptElement();
  if (existing) return waitForScriptElement(existing);

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = "google-recaptcha-v3-fallback";
    script.src = recaptchaScriptSrc(siteKey);
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("recaptcha_script_error"));
    document.head.appendChild(script);
  });
}

function waitForRecaptchaReady(recaptcha: GoogleRecaptcha, timeoutMs = 15_000): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error("recaptcha_ready_timeout"));
    }, timeoutMs);

    recaptcha.ready(() => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve();
    });
  });
}

let recaptchaReadyPromise: Promise<GoogleRecaptcha | null> | null = null;

/** Clears cached readiness so the next call re-initializes (retry path). */
export function resetRecaptchaReady(): void {
  recaptchaReadyPromise = null;
}

/** Loads api.js if needed and waits until grecaptcha.ready has fired once. */
export async function ensureRecaptchaReady(): Promise<GoogleRecaptcha | null> {
  const siteKey = recaptchaSiteKey();
  if (!siteKey) return null;

  if (recaptchaReadyPromise) return recaptchaReadyPromise;

  recaptchaReadyPromise = (async () => {
    try {
      const existing = googleRecaptcha();
      if (!existing?.execute) {
        await injectRecaptchaScript(siteKey);
      }

      const recaptcha = await waitForRecaptchaExecute();
      if (!recaptcha) {
        recaptchaReadyPromise = null;
        return null;
      }

      await waitForRecaptchaReady(recaptcha);
      return recaptcha;
    } catch {
      recaptchaReadyPromise = null;
      return null;
    }
  })();

  return recaptchaReadyPromise;
}

async function executeRecaptchaOnce(action: string): Promise<string | null> {
  const siteKey = recaptchaSiteKey();
  if (!siteKey || !action.trim()) return null;

  const recaptcha = await ensureRecaptchaReady();
  if (!recaptcha) return null;

  try {
    const token = await recaptcha.execute(siteKey, { action });
    return token?.trim() || null;
  } catch {
    return null;
  }
}

/** Pre-warm reCAPTCHA on auth surfaces; loads script when layout bootstrap is absent. */
export function RecaptchaV3() {
  const siteKey = recaptchaSiteKey();

  useEffect(() => {
    if (!siteKey) return;
    void ensureRecaptchaReady();
  }, [siteKey]);

  if (!siteKey) return null;

  // Next.js Script fallback when neither layout bootstrap nor injectRecaptchaScript ran yet.
  if (isRecaptchaScriptLoaded()) return null;

  return (
    <Script
      id="google-recaptcha-v3"
      src={recaptchaScriptSrc(siteKey)}
      strategy="afterInteractive"
      onLoad={() => {
        void ensureRecaptchaReady();
      }}
      onError={() => {
        resetRecaptchaReady();
      }}
    />
  );
}

export async function executeRecaptcha(action: string): Promise<string | null> {
  let token = await executeRecaptchaOnce(action);
  if (token) return token;

  resetRecaptchaReady();
  await new Promise((resolve) => window.setTimeout(resolve, 400));
  token = await executeRecaptchaOnce(action);
  return token;
}

export function hasRecaptchaV3SiteKey(): boolean {
  return Boolean(recaptchaSiteKey());
}

const RECAPTCHA_WARM_INTERVAL_MS = 90_000;
const RECAPTCHA_BACKGROUND_RETRY_MS = 8_000;
const RECAPTCHA_INIT_MAX_ATTEMPTS = 6;

async function warmRecaptchaWithRetries(): Promise<boolean> {
  for (let attempt = 0; attempt < RECAPTCHA_INIT_MAX_ATTEMPTS; attempt += 1) {
    const ready = await ensureRecaptchaReady();
    if (ready) return true;
    resetRecaptchaReady();
    if (attempt < RECAPTCHA_INIT_MAX_ATTEMPTS - 1) {
      await new Promise((resolve) =>
        window.setTimeout(resolve, 400 * (attempt + 1))
      );
    }
  }
  return false;
}

export function useRecaptchaReady(): {
  status: RecaptchaReadyStatus;
  retry: () => void;
  isReady: boolean;
  isBlocking: boolean;
} {
  const siteKey = recaptchaSiteKey();
  const [status, setStatus] = useState<RecaptchaReadyStatus>(() =>
    siteKey ? "loading" : "disabled"
  );

  const warm = useCallback(async (opts?: { background?: boolean }) => {
    if (!siteKey) {
      setStatus("disabled");
      return;
    }
    if (!opts?.background) {
      setStatus("loading");
    }
    const ready = await warmRecaptchaWithRetries();
    setStatus(ready ? "ready" : "loading");
  }, [siteKey]);

  useEffect(() => {
    void warm();
  }, [warm]);

  useEffect(() => {
    if (!siteKey || status === "disabled") return;

    const refreshTimer = window.setInterval(() => {
      void executeRecaptcha("portal_auth_warm").catch(() => {
        resetRecaptchaReady();
        void warm({ background: true });
      });
    }, RECAPTCHA_WARM_INTERVAL_MS);

    const retryTimer = window.setInterval(() => {
      if (status === "ready") return;
      resetRecaptchaReady();
      void warm({ background: true });
    }, RECAPTCHA_BACKGROUND_RETRY_MS);

    return () => {
      window.clearInterval(refreshTimer);
      window.clearInterval(retryTimer);
    };
  }, [siteKey, status, warm]);

  const retry = useCallback(() => {
    resetRecaptchaReady();
    void warm();
  }, [warm]);

  return {
    status,
    retry,
    isReady: status === "ready" || status === "disabled",
    // Never block auth — executeRecaptcha() mints a fresh token at submit time.
    isBlocking: false,
  };
}

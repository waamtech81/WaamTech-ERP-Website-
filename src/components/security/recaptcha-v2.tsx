"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute?: (siteKey: string, options: { action: string }) => Promise<string>;
      render: (
        container: HTMLElement,
        parameters: {
          sitekey: string;
          theme?: "light" | "dark";
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => number;
      reset: (widgetId?: number) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

type Props = {
  onChange: (token: string | null) => void;
  className?: string;
};

/**
 * Google reCAPTCHA v2 checkbox widget.
 */
export function RecaptchaV2({ onChange, className }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!SITE_KEY || !scriptReady || !hostRef.current) return;
    if (widgetId.current !== null) return;

    const el = hostRef.current;
    window.grecaptcha?.ready(() => {
      if (!el || widgetId.current !== null) return;
      try {
        widgetId.current = window.grecaptcha!.render(el, {
          sitekey: SITE_KEY,
          theme: "light",
          callback: (token) => {
            setError("");
            onChange(token);
          },
          "expired-callback": () => onChange(null),
          "error-callback": () => {
            setError("Captcha failed to load. Please refresh.");
            onChange(null);
          },
        });
      } catch {
        setError("Captcha failed to load. Please refresh.");
      }
    });
  }, [scriptReady, onChange]);

  if (!SITE_KEY) {
    return (
      <p className="text-sm text-rose-600" role="alert">
        reCAPTCHA site key is missing.
      </p>
    );
  }

  return (
    <div className={className}>
      <Script
        src="https://www.google.com/recaptcha/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() => setError("Could not load Google reCAPTCHA.")}
      />
      <div ref={hostRef} />
      {error ? (
        <p className="mt-2 text-xs text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function resetRecaptcha() {
  try {
    window.grecaptcha?.reset();
  } catch {
    /* ignore */
  }
}

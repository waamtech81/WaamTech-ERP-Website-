"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, COOKIE_KEY } from "@/components/analytics/consent";

const GA_MEASUREMENT_ID = "G-E0P7P1BG5F";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function hasAnalyticsConsent(): boolean {
  try {
    return localStorage.getItem(COOKIE_KEY) === "accepted";
  } catch {
    return false;
  }
}

/**
 * Loads Google Analytics (gtag) only after cookie consent.
 */
export function GoogleAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (hasAnalyticsConsent()) {
      setEnabled(true);
      return;
    }

    const onAccept = () => setEnabled(true);
    window.addEventListener(CONSENT_EVENT, onAccept);
    return () => window.removeEventListener(CONSENT_EVENT, onAccept);
  }, []);

  if (!enabled) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}

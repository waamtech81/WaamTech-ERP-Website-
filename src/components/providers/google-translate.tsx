"use client";

import { useEffect } from "react";
import {
  ensureGoogleTranslateLoaded,
  GOOGLE_TRANSLATE_LANGUAGES,
  readGoogTransLang,
} from "@/lib/google-translate";
import type { UiLanguage } from "@/i18n";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: {
          new (
            options: {
              pageLanguage: string;
              includedLanguages?: string;
              autoDisplay: boolean;
              multilanguagePage?: boolean;
              layout?: number;
            },
            elementId: string
          ): void;
          InlineLayout?: { SIMPLE: number; HORIZONTAL: number; VERTICAL: number };
        };
      };
    };
  }
}

const ELEMENT_ID = "google_translate_element";

export function mountTranslateElement() {
  if (typeof window === "undefined") return;
  const TE = window.google?.translate?.TranslateElement;
  if (!TE) return;
  const host = document.getElementById(ELEMENT_ID);
  if (!host) return;
  if (host.querySelector(".goog-te-combo") || host.childElementCount > 0) return;

  // eslint-disable-next-line no-new
  new TE(
    {
      pageLanguage: "en",
      includedLanguages: GOOGLE_TRANSLATE_LANGUAGES,
      autoDisplay: false,
      multilanguagePage: true,
      layout: TE.InlineLayout?.SIMPLE,
    },
    ELEMENT_ID
  );
}

/**
 * Host node for Google Translate. Script loads only when needed
 * (non-English locale, existing googtrans cookie, or language switch).
 */
export function GoogleTranslateBoot({ language }: { language: UiLanguage }) {
  useEffect(() => {
    const needsNow = language !== "en" || !!readGoogTransLang();
    if (!needsNow) return;

    const run = () => {
      void ensureGoogleTranslateLoaded().then(() => mountTranslateElement());
    };

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(run, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    const t = window.setTimeout(run, 1200);
    return () => window.clearTimeout(t);
  }, [language]);

  return (
    <div
      id={ELEMENT_ID}
      className="wt-google-translate"
      aria-hidden
      suppressHydrationWarning
    />
  );
}

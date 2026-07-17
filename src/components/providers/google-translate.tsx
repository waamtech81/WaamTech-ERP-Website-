"use client";

import { useEffect } from "react";
import { GOOGLE_TRANSLATE_LANGUAGES } from "@/lib/google-translate";

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

const SCRIPT_ID = "google-translate-script";
const ELEMENT_ID = "google_translate_element";

function mountTranslateElement() {
  if (typeof window === "undefined") return;
  const TE = window.google?.translate?.TranslateElement;
  if (!TE) return;
  const host = document.getElementById(ELEMENT_ID);
  if (!host) return;
  // Avoid double-mounting the widget into the same node.
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
 * Boots the official Google Website Translator (hidden).
 * LanguageSwitcher drives it via .goog-te-combo / googtrans cookie / #googtrans hash.
 *
 * Important: React Strict Mode remounts effects in dev. We must always
 * re-register the init callback and init immediately if the script already loaded.
 */
export function GoogleTranslateBoot() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    window.googleTranslateElementInit = () => {
      mountTranslateElement();
    };

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      mountTranslateElement();
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    script.onerror = () => {
      console.warn(
        "[i18n] Google Translate failed to load. Check network / adblock / CSP."
      );
    };
    document.body.appendChild(script);
  }, []);

  return (
    <div
      id={ELEMENT_ID}
      className="wt-google-translate"
      aria-hidden
      suppressHydrationWarning
    />
  );
}

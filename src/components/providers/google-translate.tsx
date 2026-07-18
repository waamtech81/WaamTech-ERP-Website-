"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  ensureGoogleTranslateLoaded,
  forceRetranslate,
  isRetranslateLocked,
  mountTranslateElement,
  readGoogTransLang,
  syncGoogleTranslate,
  GOOGLE_TRANSLATE_ELEMENT_ID,
  ensureSourceLangForTranslate,
} from "@/lib/google-translate";
import { useLocale } from "@/components/providers/locale-provider";
import type { UiLanguage } from "@/i18n";

function shouldIgnoreMutation(node: Node): boolean {
  if (!(node instanceof Element)) {
    const parent = node.parentElement;
    return !parent || shouldIgnoreMutation(parent);
  }
  if (node.id === GOOGLE_TRANSLATE_ELEMENT_ID) return true;
  if (node.tagName === "FONT") return true;
  if (node.classList.contains("skiptranslate")) return true;
  if (node.classList.contains("notranslate")) return true;
  if (node.classList.contains("goog-te-spinner-pos")) return true;
  if (node.closest?.(".skiptranslate, .notranslate, #goog-gt-tt, .goog-te-banner-frame, .wt-google-translate")) {
    return true;
  }
  return false;
}

function mutationLooksLikeAppContent(mutations: MutationRecord[]): boolean {
  for (const m of mutations) {
    if (m.type === "characterData") {
      const el = m.target.parentElement;
      if (el && !shouldIgnoreMutation(el)) return true;
      continue;
    }
    for (const node of m.addedNodes) {
      if (shouldIgnoreMutation(node)) continue;
      if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) return true;
      if (node instanceof Element) {
        const text = node.textContent?.trim();
        if (text && text.length > 1) return true;
      }
    }
  }
  return false;
}

/**
 * Host node + keep-alive for Google Translate across the whole site:
 * - boots GT for non-English
 * - re-translates after Next.js client navigations
 * - re-translates when dynamic content is injected into <main>
 */
export function GoogleTranslateBoot({ language }: { language: UiLanguage }) {
  const { language: liveLanguage } = useLocale();
  const pathname = usePathname();
  const lang = liveLanguage || language;
  const activeLang = (readGoogTransLang() as UiLanguage | null) || lang;
  const bootRef = useRef(false);

  // Keep html[lang]=en so GT always treats the page as English source.
  useEffect(() => {
    ensureSourceLangForTranslate();
  }, [lang, pathname]);

  // Boot / sync Google Translate whenever we need a non-English page.
  useEffect(() => {
    const needsNow = lang !== "en" || !!readGoogTransLang();
    if (!needsNow) return;

    let cancelled = false;
    const run = () => {
      void ensureGoogleTranslateLoaded().then(() => {
        if (cancelled) return;
        ensureSourceLangForTranslate();
        mountTranslateElement(false);
        syncGoogleTranslate(lang, { reloadOnMiss: true });
        bootRef.current = true;
      });
    };

    const t = window.setTimeout(run, 60);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [lang]);

  // After every client-side route change, force a full DOM re-scan.
  useEffect(() => {
    if (lang === "en" && !readGoogTransLang()) return;

    const t = window.setTimeout(() => {
      ensureSourceLangForTranslate();
      void ensureGoogleTranslateLoaded().then(() => {
        mountTranslateElement(false);
        forceRetranslate(activeLang === "en" ? lang : activeLang);
      });
    }, 280);

    return () => window.clearTimeout(t);
    // pathname is the trigger; lang/activeLang used inside
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, lang]);

  // Dynamic content (pricing catalog, signup selects, etc.) → retranslate.
  useEffect(() => {
    if (lang === "en" && !readGoogTransLang()) return;
    if (typeof MutationObserver === "undefined") return;

    const root =
      document.querySelector("main") ||
      document.getElementById("__next") ||
      document.body;
    if (!root) return;

    let debounce = 0;
    const obs = new MutationObserver((mutations) => {
      if (isRetranslateLocked()) return;
      if (!mutationLooksLikeAppContent(mutations)) return;
      window.clearTimeout(debounce);
      debounce = window.setTimeout(() => {
        if (isRetranslateLocked()) return;
        forceRetranslate(lang);
      }, 450);
    });

    obs.observe(root, {
      childList: true,
      subtree: true,
      characterData: false,
    });

    return () => {
      obs.disconnect();
      window.clearTimeout(debounce);
    };
  }, [lang]);

  return (
    <div
      id={GOOGLE_TRANSLATE_ELEMENT_ID}
      className="wt-google-translate"
      aria-hidden
      suppressHydrationWarning
    />
  );
}

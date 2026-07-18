"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  ensureGoogleTranslateLoaded,
  forceRetranslate,
  mountTranslateElement,
  noteGoogleTranslateDomTouch,
  readGoogTransLang,
  syncGoogleTranslate,
  GOOGLE_TRANSLATE_ELEMENT_ID,
  ensureSourceLangForTranslate,
} from "@/lib/google-translate";
import { useLocale } from "@/components/providers/locale-provider";
import type { UiLanguage } from "@/i18n";

/**
 * Ignore mutations that come from Google Translate itself or from
 * intentionally non-translated chrome (currency, prices, brand).
 */
function shouldIgnoreMutation(node: Node): boolean {
  if (!(node instanceof Element)) {
    const parent = node.parentElement;
    return !parent || shouldIgnoreMutation(parent);
  }

  if (node.id === GOOGLE_TRANSLATE_ELEMENT_ID) return true;
  if (node.id === "goog-gt-tt") return true;
  if (node.tagName === "FONT") return true;
  if (node.tagName === "SCRIPT" || node.tagName === "STYLE" || node.tagName === "LINK") {
    return true;
  }

  const cls = node.classList;
  if (cls.contains("skiptranslate")) return true;
  if (cls.contains("notranslate")) return true;
  if (cls.contains("wt-google-translate")) return true;
  if (cls.contains("goog-te-spinner-pos")) return true;
  if (cls.contains("goog-te-banner-frame")) return true;
  if (cls.contains("goog-te-menu-frame")) return true;
  if (cls.contains("goog-te-balloon-frame")) return true;
  for (const c of cls) {
    if (c.startsWith("goog-")) return true;
  }

  if (
    node.closest?.(
      ".skiptranslate, .notranslate, #goog-gt-tt, .goog-te-banner-frame, .goog-te-menu-frame, .goog-te-balloon-frame, .wt-google-translate, #" +
        GOOGLE_TRANSLATE_ELEMENT_ID
    )
  ) {
    return true;
  }

  return false;
}

function nodeHasTranslatableText(node: Node): boolean {
  if (shouldIgnoreMutation(node)) return false;
  if (node.nodeType === Node.TEXT_NODE) {
    return Boolean(node.textContent?.trim());
  }
  if (node instanceof Element) {
    const text = node.textContent?.trim();
    return Boolean(text && text.length > 1);
  }
  return false;
}

/**
 * True when mutations look like app/React content (License Engine catalog,
 * Suspense slots, client navigations) — not Google Translate's own wraps.
 */
function mutationLooksLikeAppContent(mutations: MutationRecord[]): boolean {
  for (const m of mutations) {
    if (m.type === "characterData") {
      const el =
        m.target.nodeType === Node.TEXT_NODE
          ? m.target.parentElement
          : m.target instanceof Element
            ? m.target
            : null;
      if (el && !shouldIgnoreMutation(el) && m.target.textContent?.trim()) {
        return true;
      }
      continue;
    }

    if (m.type === "childList") {
      for (const node of m.addedNodes) {
        if (nodeHasTranslatableText(node)) return true;
      }
      // React often replaces nodes (remove + add). Removals alone don't need
      // retranslate, but paired adds are covered above.
    }
  }
  return false;
}

function mutationLooksLikeGoogleTranslate(mutations: MutationRecord[]): boolean {
  for (const m of mutations) {
    for (const node of m.addedNodes) {
      if (!(node instanceof Element)) continue;
      if (node.tagName === "FONT") return true;
      if (node.classList.contains("goog-te-spinner-pos")) return true;
      for (const c of node.classList) {
        if (c.startsWith("goog-")) return true;
      }
    }
  }
  return false;
}

/**
 * Host node + keep-alive for Google Translate across the whole site:
 * - boots GT for non-English
 * - re-translates after Next.js client navigations
 * - re-translates when dynamic content is injected (API / Suspense / streaming)
 *
 * Observes document.body (covers marketing <main>, portal shell, and streaming).
 * Uses rAF coalescing + dirty-flag replay — no arbitrary timeouts.
 */
export function GoogleTranslateBoot({ language }: { language: UiLanguage }) {
  const { language: liveLanguage } = useLocale();
  const pathname = usePathname();
  const lang = liveLanguage || language;
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
    void ensureGoogleTranslateLoaded().then(() => {
      if (cancelled) return;
      ensureSourceLangForTranslate();
      mountTranslateElement(false);
      syncGoogleTranslate(lang, { reloadOnMiss: true });
      bootRef.current = true;
    });

    return () => {
      cancelled = true;
    };
  }, [lang]);

  // After every client-side route change, force a full DOM re-scan (frame-synced).
  useEffect(() => {
    if (lang === "en" && !readGoogTransLang()) return;

    const target = (readGoogTransLang() as UiLanguage | null) || lang;
    if (target === "en") return;

    let cancelled = false;

    void ensureGoogleTranslateLoaded().then(() => {
      if (cancelled) return;
      ensureSourceLangForTranslate();
      mountTranslateElement(false);
      // Wait one paint so the new route's React tree is committed, then resync.
      window.requestAnimationFrame(() => {
        if (cancelled) return;
        window.requestAnimationFrame(() => {
          if (cancelled) return;
          forceRetranslate(target);
        });
      });
    });

    return () => {
      cancelled = true;
    };
  }, [pathname, lang]);

  // Dynamic content (pricing catalog, signup selects, Suspense, portal data)
  // → schedule a GT resync. Dirty-flag inside forceRetranslate replays if more
  // content arrives while a resync is already running.
  useEffect(() => {
    if (lang === "en" && !readGoogTransLang()) return;
    if (typeof MutationObserver === "undefined") return;

    const root = document.body;
    if (!root) return;

    const targetLang = () =>
      ((readGoogTransLang() as UiLanguage | null) || lang) as UiLanguage;

    let coalesceRaf = 0;

    const obs = new MutationObserver((mutations) => {
      // GT's own font wraps during resync — note for settle detection, don't re-enter.
      if (mutationLooksLikeGoogleTranslate(mutations)) {
        noteGoogleTranslateDomTouch();
      }

      if (!mutationLooksLikeAppContent(mutations)) return;

      // Coalesce all mutations in this frame into a single resync schedule.
      if (coalesceRaf) return;
      coalesceRaf = window.requestAnimationFrame(() => {
        coalesceRaf = 0;
        const next = targetLang();
        if (next === "en") return;
        // forceRetranslate handles lock + dirty replay; safe even mid-resync.
        forceRetranslate(next);
      });
    });

    obs.observe(root, {
      childList: true,
      subtree: true,
      // React / streaming sometimes updates text without replacing the element.
      characterData: true,
      characterDataOldValue: false,
    });

    return () => {
      obs.disconnect();
      if (coalesceRaf) window.cancelAnimationFrame(coalesceRaf);
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

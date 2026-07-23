"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  activateGoogleTranslate,
  bootGoogleTranslate,
  forceRetranslate,
  isGoogleTranslateBooted,
  isRetranslateLocked,
  noteGoogleTranslateDomTouch,
  readGoogTransLang,
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
 * - boots GT only after the page is stable (hydration + async mounts)
 * - re-translates after Next.js client navigations (after settle)
 * - re-translates when dynamic content is injected (debounced quiet window)
 */
export function GoogleTranslateBoot({ language }: { language: UiLanguage }) {
  const { language: liveLanguage } = useLocale();
  const pathname = usePathname();
  const lang = liveLanguage || language;
  const pathBootGen = useRef(0);
  const skipFirstPathEffect = useRef(true);

  // Keep html[lang]=en so GT always treats the page as English source.
  useEffect(() => {
    ensureSourceLangForTranslate();
  }, [lang, pathname]);

  // Boot GT once the page is fully rendered for the active non-English language.
  useEffect(() => {
    const needsNow = lang !== "en" || !!readGoogTransLang();
    if (!needsNow) return;

    let cancelled = false;

    void bootGoogleTranslate(lang).then(() => {
      if (cancelled) return;
    });

    return () => {
      cancelled = true;
    };
  }, [lang]);

  // After client-side route changes, wait for the new tree to settle, then re-scan.
  useEffect(() => {
    if (lang === "en" && !readGoogTransLang()) return;

    const target = (readGoogTransLang() as UiLanguage | null) || lang;
    if (target === "en") return;

    // First paint is owned by the lang boot effect — skip mount.
    if (skipFirstPathEffect.current) {
      skipFirstPathEffect.current = false;
      return;
    }

    const gen = ++pathBootGen.current;
    let cancelled = false;

    void activateGoogleTranslate(target).then(() => {
      if (cancelled || gen !== pathBootGen.current) return;
    });

    return () => {
      cancelled = true;
    };
  }, [pathname, lang]);

  // Dynamic content → schedule a GT resync after the DOM goes quiet.
  useEffect(() => {
    if (lang === "en" && !readGoogTransLang()) return;
    if (typeof MutationObserver === "undefined") return;

    const root = document.body;
    if (!root) return;

    const targetLang = () =>
      ((readGoogTransLang() as UiLanguage | null) || lang) as UiLanguage;

    let coalesceTimer = 0;

    const obs = new MutationObserver((mutations) => {
      if (mutationLooksLikeGoogleTranslate(mutations)) {
        noteGoogleTranslateDomTouch();
      }

      // Hold until the stable first boot finished — otherwise we translate too early.
      if (!isGoogleTranslateBooted()) return;
      // While GT is flipping, ignore app-looking noise to avoid loops.
      if (isRetranslateLocked()) return;
      if (!mutationLooksLikeAppContent(mutations)) return;

      if (coalesceTimer) window.clearTimeout(coalesceTimer);
      coalesceTimer = window.setTimeout(() => {
        coalesceTimer = 0;
        if (!isGoogleTranslateBooted() || isRetranslateLocked()) return;
        const next = targetLang();
        if (next === "en") return;
        forceRetranslate(next);
      }, 450);
    });

    obs.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      characterDataOldValue: false,
    });

    return () => {
      obs.disconnect();
      if (coalesceTimer) window.clearTimeout(coalesceTimer);
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

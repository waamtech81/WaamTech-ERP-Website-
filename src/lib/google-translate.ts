/**
 * Google Website Translator helpers.
 * Source page language is always English (html[lang=en]); visitor picks EN / AR / FR.
 *
 * Full-site translate strategy:
 * 1) Keep html lang="en" so GT knows the source language
 * 2) Language change → set googtrans cookie/hash + hard reload
 * 3) SPA route / dynamic DOM → force re-scan via combo flip (frame-synced, no timeouts)
 *
 * ROOT CAUSE (dynamic API content):
 * Google Website Translator walks the DOM once when activated. It does not subscribe
 * to React commits. When License Engine data arrives and React inserts new English
 * text nodes, those nodes are never translated unless we explicitly re-trigger GT.
 *
 * PERMANENT FIX:
 * Observe document.body for real app content mutations, coalesce with rAF, and
 * re-trigger GT. Mutations that arrive during a resync are marked dirty and replayed
 * after settle — so one-shot API loads cannot be skipped forever.
 */
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

export const GOOGLE_TRANSLATE_LANGUAGES = "en,ar,fr" as const;
export const GOOGLE_TRANSLATE_ELEMENT_ID = "google_translate_element";

const GOOGTRANS = "googtrans";
const SCRIPT_ID = "google-translate-script";
const RELOAD_KEY = "wt_gt_reload";
const RESYNC_CLASS = "wt-gt-resync";

/** Hosts where setting a Domain= attribute breaks cookies (browsers reject it). */
function shouldSetCookieDomain(host: string): boolean {
  if (!host || host === "localhost") return false;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return false;
  if (host.endsWith(".local") || host.endsWith(".test")) return false;
  if (host.endsWith(".localhost")) return false;
  return true;
}

function cookieDomain(): string | null {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname;
  if (!shouldSetCookieDomain(host)) return null;
  const parts = host.split(".");
  if (parts.length >= 2) return `.${parts.slice(-2).join(".")}`;
  return host;
}

function writeGoogTrans(value: string) {
  const domain = cookieDomain();
  const maxAge = 60 * 60 * 24 * 365;
  const base = `${GOOGTRANS}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = base;
  if (domain) {
    document.cookie = `${base}; domain=${domain}`;
  }
}

function clearGoogTrans() {
  const domain = cookieDomain();
  const expired = `${GOOGTRANS}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  document.cookie = expired;
  if (domain) document.cookie = `${expired}; domain=${domain}`;
  document.cookie = `${GOOGTRANS}=; path=/; max-age=0`;
}

/** Read current googtrans target (e.g. "ar") or null when English / unset. */
export function readGoogTransLang(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
  if (!match) return null;
  const raw = decodeURIComponent(match[1]);
  const parts = raw.split("/").filter(Boolean);
  const target = parts[parts.length - 1]?.toLowerCase();
  if (!target || target === "en") return null;
  return target;
}

function setGoogTransHash(lang: string) {
  if (typeof window === "undefined") return;
  if (lang === "en") {
    if (/googtrans/i.test(window.location.hash)) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    return;
  }
  const hash = `#googtrans(en|${lang})`;
  if (window.location.hash !== hash) {
    history.replaceState(null, "", window.location.pathname + window.location.search + hash);
  }
}

function canUseSessionStorage(): boolean {
  try {
    const k = "__wt_ss_test__";
    sessionStorage.setItem(k, "1");
    sessionStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

function fireComboChange(combo: HTMLSelectElement) {
  combo.dispatchEvent(new Event("change", { bubbles: true }));
  combo.dispatchEvent(new Event("input", { bubbles: true }));
  try {
    const ev = document.createEvent("HTMLEvents");
    ev.initEvent("change", true, true);
    combo.dispatchEvent(ev);
  } catch {
    /* ignore */
  }
}

function findCombo(): HTMLSelectElement | null {
  return (
    document.querySelector<HTMLSelectElement>(".goog-te-combo") ||
    document.querySelector<HTMLSelectElement>("#google_translate_element select") ||
    document.querySelector<HTMLSelectElement>(".skiptranslate select")
  );
}

function pageLooksTranslated(): boolean {
  const html = document.documentElement;
  return (
    html.classList.contains("translated-ltr") ||
    html.classList.contains("translated-rtl") ||
    !!document.querySelector("html[class*='translated']") ||
    !!readGoogTransLang()
  );
}

/** Keep source language English so Google Translate scans the full page. */
export function ensureSourceLangForTranslate(): void {
  if (typeof document === "undefined") return;
  document.documentElement.lang = "en";
  document.documentElement.setAttribute("lang", "en");
}

function setComboValue(code: string): boolean {
  const combo = findCombo();
  if (!combo) return false;
  const opts = Array.from(combo.options);
  if (opts.length === 0) return false;

  if (code === "en") {
    const enOpt =
      opts.find((o) => o.value === "" || o.value === "en") || opts[0];
    if (!enOpt) return false;
    if (combo.value !== enOpt.value) combo.value = enOpt.value;
    fireComboChange(combo);
    return true;
  }

  const hasOption = opts.some((o) => o.value === code);
  if (!hasOption) return false;
  if (combo.value !== code) combo.value = code;
  fireComboChange(combo);
  return combo.value === code;
}

function safeReloadOnce(code: string): void {
  if (!canUseSessionStorage()) {
    const guard = `wt_gt_reload_${code}`;
    if (document.cookie.includes(`${guard}=1`)) return;
    document.cookie = `${guard}=1; path=/; max-age=30; SameSite=Lax`;
    window.location.reload();
    return;
  }
  try {
    if (sessionStorage.getItem(RELOAD_KEY) === code) return;
    sessionStorage.setItem(RELOAD_KEY, code);
  } catch {
    window.location.reload();
    return;
  }
  window.location.reload();
}

function clearReloadGuard(): void {
  try {
    sessionStorage.removeItem(RELOAD_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Wait for the Google Translate combo, then apply language.
 * Reloads at most once per target language when the combo is missing.
 */
export function syncGoogleTranslate(
  lang: UiLanguage,
  opts?: { reloadOnMiss?: boolean }
): void {
  if (typeof document === "undefined") return;
  const code = lang === "en" ? "en" : lang;
  const allowReload = opts?.reloadOnMiss !== false;

  ensureSourceLangForTranslate();

  if (code === "en") {
    clearGoogTrans();
    setGoogTransHash("en");
    if (setComboValue("en")) {
      clearReloadGuard();
      return;
    }
    if (allowReload && pageLooksTranslated()) {
      safeReloadOnce("en");
    }
    return;
  }

  writeGoogTrans(`/en/${code}`);
  setGoogTransHash(code);

  if (setComboValue(code)) {
    clearReloadGuard();
    return;
  }

  // Poll via rAF (no wall-clock timeouts) until combo exists or budget exhausted.
  let frames = 0;
  const maxFrames = 120; // ~2s at 60fps — budget, not an arbitrary delay before acting
  const tick = () => {
    frames += 1;
    if (setComboValue(code)) {
      clearReloadGuard();
      return;
    }
    if (frames < maxFrames) {
      window.requestAnimationFrame(tick);
      return;
    }
    if (!allowReload) return;
    safeReloadOnce(code);
  };
  window.requestAnimationFrame(tick);
}

let loadPromise: Promise<void> | null = null;

/** Resync state — shared with MutationObserver so in-flight GT work is not lost. */
let resyncActive = false;
let resyncDirty = false;
let resyncRaf = 0;
let settleRaf = 0;
let gtTouchedThisFrame = false;
let activeTargetLang: UiLanguage | null = null;

/**
 * Lazily inject the Google Translate script once. Safe to call repeatedly.
 */
export function ensureGoogleTranslateLoaded(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.translate?.TranslateElement) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    window.googleTranslateElementInit = () => {
      resolve();
    };

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (window.google?.translate?.TranslateElement) resolve();
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
      loadPromise = null;
      resolve();
    };
    document.body.appendChild(script);
  });

  return loadPromise;
}

/** Create / refresh the hidden Google Translate widget host. */
export function mountTranslateElement(force = false): boolean {
  if (typeof window === "undefined") return false;
  const TE = window.google?.translate?.TranslateElement;
  if (!TE) return false;
  const host = document.getElementById(GOOGLE_TRANSLATE_ELEMENT_ID);
  if (!host) return false;

  ensureSourceLangForTranslate();

  if (force) {
    host.innerHTML = "";
  } else if (host.querySelector(".goog-te-combo") || host.querySelector("select")) {
    return true;
  } else if (host.childElementCount > 0) {
    host.innerHTML = "";
  }

  // multilanguagePage:false → translate the whole page from English source
  // eslint-disable-next-line no-new
  new TE(
    {
      pageLanguage: "en",
      includedLanguages: GOOGLE_TRANSLATE_LANGUAGES,
      autoDisplay: false,
      multilanguagePage: false,
      layout: TE.InlineLayout?.SIMPLE,
    },
    GOOGLE_TRANSLATE_ELEMENT_ID
  );
  return !!findCombo() || host.childElementCount > 0;
}

/** True while a forced retranslate is in flight (skip MutationObserver loops). */
export function isRetranslateLocked(): boolean {
  return resyncActive;
}

/** Mark that GT itself mutated the DOM this frame (font wraps, etc.). */
export function noteGoogleTranslateDomTouch(): void {
  if (resyncActive) gtTouchedThisFrame = true;
}

function beginResyncVisual(): void {
  document.documentElement.classList.add(RESYNC_CLASS);
}

function endResyncVisual(): void {
  document.documentElement.classList.remove(RESYNC_CLASS);
}

function finishResync(): void {
  resyncActive = false;
  endResyncVisual();
  if (resyncDirty && activeTargetLang && activeTargetLang !== "en") {
    resyncDirty = false;
    scheduleForceRetranslate(activeTargetLang);
  }
}

/**
 * Wait until GT stops mutating for two consecutive animation frames.
 * Frame-synced settle — no wall-clock timeouts.
 */
function waitForTranslateSettle(onSettled: () => void): void {
  let quietFrames = 0;
  const maxFrames = 90;

  const step = (frame: number) => {
    if (gtTouchedThisFrame) {
      quietFrames = 0;
      gtTouchedThisFrame = false;
    } else {
      quietFrames += 1;
    }

    if (quietFrames >= 2 || frame >= maxFrames) {
      settleRaf = 0;
      onSettled();
      return;
    }
    settleRaf = window.requestAnimationFrame(() => step(frame + 1));
  };

  if (settleRaf) window.cancelAnimationFrame(settleRaf);
  settleRaf = window.requestAnimationFrame(() => step(0));
}

function runComboFlip(code: string): void {
  const combo = findCombo();
  if (!combo) {
    void ensureGoogleTranslateLoaded().then(() => {
      mountTranslateElement(false);
      syncGoogleTranslate(code as UiLanguage, { reloadOnMiss: false });
      // After sync applies, watch settle then unlock.
      waitForTranslateSettle(finishResync);
    });
    return;
  }

  const opts = Array.from(combo.options);
  const enOpt = opts.find((o) => o.value === "" || o.value === "en") || opts[0];
  if (!enOpt) {
    setComboValue(code);
    waitForTranslateSettle(finishResync);
    return;
  }

  beginResyncVisual();

  // Restore English source nodes, then re-apply target on the next paint pair.
  // Double-rAF waits for style/layout after the EN flip without setTimeout.
  // Keep the previous paint on screen — do not blank the body (avoids flicker).
  combo.value = enOpt.value;
  fireComboChange(combo);

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      combo.value = code;
      fireComboChange(combo);
      waitForTranslateSettle(finishResync);
    });
  });
}

function scheduleForceRetranslate(lang: UiLanguage): void {
  activeTargetLang = lang;
  if (resyncRaf) return;
  resyncRaf = window.requestAnimationFrame(() => {
    resyncRaf = 0;
    if (resyncActive) {
      resyncDirty = true;
      return;
    }
    const code = lang === "en" ? "en" : lang;
    if (code === "en") return;

    resyncActive = true;
    gtTouchedThisFrame = false;
    ensureSourceLangForTranslate();
    writeGoogTrans(`/en/${code}`);
    setGoogTransHash(code);
    runComboFlip(code);
  });
}

/**
 * Force Google Translate to re-scan the current DOM.
 * Used after Next.js client navigations and dynamic content inserts.
 * Coalesced to one pass per frame; dirty-flag replays if more content arrives mid-pass.
 */
export function forceRetranslate(lang: UiLanguage): void {
  if (typeof document === "undefined") return;
  const code = lang === "en" ? "en" : lang;
  if (code === "en") return;

  if (resyncActive) {
    resyncDirty = true;
    activeTargetLang = lang;
    return;
  }

  scheduleForceRetranslate(lang);
}

/**
 * Apply Google Translate for a user-initiated language change.
 * Cookie + hash first, then hard reload so the entire page (all nodes) translate.
 */
export function applyGoogleTranslate(lang: UiLanguage): void {
  if (typeof document === "undefined") return;
  const code = lang === "en" ? "en" : lang;

  ensureSourceLangForTranslate();

  if (code === "en") {
    clearGoogTrans();
    setGoogTransHash("en");
  } else {
    writeGoogTrans(`/en/${code}`);
    setGoogTransHash(code);
  }

  clearReloadGuard();
  // Hard reload = full DOM translate (static + whatever SSR sent).
  window.location.reload();
}

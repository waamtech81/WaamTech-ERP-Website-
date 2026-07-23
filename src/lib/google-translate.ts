/**
 * Google Website Translator helpers.
 *
 * Source page language is always English (html[lang=en]).
 * Visitor languages: EN / AR / FR / DE / ES.
 *
 * Standard URL / cookie format (Issue 1):
 *   hash:   #googtrans(en|fr)  |  #googtrans(en|ar)  |  #googtrans(en|de)  |  #googtrans(en|es)
 *   cookie: googtrans=/en/fr
 *
 * Full-page strategy (Issues 2–4, 7):
 * 1) Keep html lang="en" so GT knows the English source
 * 2) User language change → set cookie + hash → hard reload
 * 3) After reload / SPA nav → WAIT until React hydration + async DOM settle
 * 4) Then mount the widget once and apply the target language
 * 5) Re-scan only after new app content is quiet (no translation loops)
 *
 * Partial translation root cause:
 * GT was applied before hydration / lazy sections finished. React then replaced
 * GT's <font> wraps with English source nodes. Header still looked translated
 * because chrome uses local t() catalogs under notranslate — body never got a
 * second full scan after the page was actually ready.
 */
import type { UiLanguage } from "@/i18n";
import { LANGUAGE_CODES } from "@/i18n";

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

/** Languages offered to the Google Translate widget (must match UiLanguage). */
export const GOOGLE_TRANSLATE_LANGUAGES = LANGUAGE_CODES.join(",");
export const GOOGLE_TRANSLATE_ELEMENT_ID = "google_translate_element";

const GOOGTRANS = "googtrans";
const SCRIPT_ID = "google-translate-script";
const RELOAD_KEY = "wt_gt_reload";
const RESYNC_CLASS = "wt-gt-resync";

/** Quiet window before treating the DOM as fully rendered. */
const STABLE_QUIET_MS = 500;
/** Absolute cap — correctness over speed, but never hang forever. */
const STABLE_MAX_MS = 8000;
/** Minimum wait after hydration effect so early client mounts can land. */
const STABLE_MIN_MS = 150;
/** Quiet window before a post-mutation retranslate. */
const RESYNC_QUIET_MS = 400;

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

/** Normalize a UI / cookie / hash language code (2-letter). */
export function toTranslateCode(lang: string): string {
  return String(lang || "en").toLowerCase().slice(0, 2);
}

/** Build the standard Google Translate hash fragment, e.g. #googtrans(en|fr). */
export function googTransHash(lang: string): string {
  const code = toTranslateCode(lang);
  if (!code || code === "en") return "";
  return `#googtrans(en|${code})`;
}

/** Cookie value Google expects, e.g. /en/fr. */
export function googTransCookieValue(lang: string): string {
  const code = toTranslateCode(lang);
  if (!code || code === "en") return "";
  return `/en/${code}`;
}

/** Read current googtrans target (e.g. "ar") or null when English / unset. */
export function readGoogTransLang(): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
  if (match) {
    const raw = decodeURIComponent(match[1]);
    const parts = raw.split("/").filter(Boolean);
    const target = parts[parts.length - 1]?.toLowerCase();
    if (target && target !== "en") return target;
  }

  const hash = typeof window !== "undefined" ? window.location.hash : "";
  const hashMatch = hash.match(/#googtrans\(en\|([a-z]{2})\)/i);
  if (hashMatch?.[1] && hashMatch[1].toLowerCase() !== "en") {
    return hashMatch[1].toLowerCase();
  }

  return null;
}

function setGoogTransHash(lang: string) {
  if (typeof window === "undefined") return;
  const next = googTransHash(lang);
  const pathSearch = window.location.pathname + window.location.search;
  if (!next) {
    if (/googtrans/i.test(window.location.hash)) {
      history.replaceState(null, "", pathSearch);
    }
    return;
  }
  if (window.location.hash !== next) {
    history.replaceState(null, "", pathSearch + next);
  }
}

/** Persist GT preference without applying the widget yet. */
export function persistGoogTransPreference(lang: UiLanguage | string): void {
  if (typeof document === "undefined") return;
  const code = toTranslateCode(lang);
  ensureSourceLangForTranslate();
  if (code === "en") {
    clearGoogTrans();
    setGoogTransHash("en");
    return;
  }
  writeGoogTrans(googTransCookieValue(code));
  setGoogTransHash(code);
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
    document.querySelector<HTMLSelectElement>(".skiptranslate select") ||
    document.querySelector<HTMLSelectElement>("select.goog-te-combo")
  );
}

/** Wait until the classic GT <select> exists (needed after widget mount). */
function waitForCombo(maxMs = 4000): Promise<HTMLSelectElement | null> {
  return new Promise((resolve) => {
    const existing = findCombo();
    if (existing && existing.options.length > 0) {
      resolve(existing);
      return;
    }

    const started = performance.now();
    let timer = 0;
    const tick = () => {
      const combo = findCombo();
      if (combo && combo.options.length > 0) {
        resolve(combo);
        return;
      }
      if (performance.now() - started >= maxMs) {
        resolve(findCombo());
        return;
      }
      timer = window.setTimeout(tick, 50);
    };
    timer = window.setTimeout(tick, 50);
    // Avoid unused warning in some tooling paths.
    void timer;
  });
}

function pageLooksTranslated(): boolean {
  const html = document.documentElement;
  return (
    html.classList.contains("translated-ltr") ||
    html.classList.contains("translated-rtl") ||
    !!document.querySelector("html[class*='translated']")
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
 * Wait until the page is rendered + hydrated + async content has settled.
 * Uses a MutationObserver quiet window (not a blind fixed sleep).
 */
export function waitForPageStable(opts?: {
  quietMs?: number;
  maxMs?: number;
  minMs?: number;
}): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();

  const quietMs = opts?.quietMs ?? STABLE_QUIET_MS;
  const maxMs = opts?.maxMs ?? STABLE_MAX_MS;
  const minMs = opts?.minMs ?? STABLE_MIN_MS;

  return new Promise((resolve) => {
    const started = performance.now();
    let done = false;
    let quietTimer = 0;
    let maxTimer = 0;
    let observer: MutationObserver | null = null;

    const finish = () => {
      if (done) return;
      done = true;
      if (quietTimer) window.clearTimeout(quietTimer);
      if (maxTimer) window.clearTimeout(maxTimer);
      observer?.disconnect();
      resolve();
    };

    const armQuiet = () => {
      if (quietTimer) window.clearTimeout(quietTimer);
      quietTimer = window.setTimeout(() => {
        if (document.readyState !== "complete") {
          armQuiet();
          return;
        }
        if (performance.now() - started < minMs) {
          armQuiet();
          return;
        }
        finish();
      }, quietMs);
    };

    const beginWatch = () => {
      if (done) return;
      if (typeof MutationObserver !== "undefined" && document.body) {
        observer = new MutationObserver(() => {
          if (performance.now() - started >= maxMs) {
            finish();
            return;
          }
          armQuiet();
        });
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true,
        });
      }
      armQuiet();
      maxTimer = window.setTimeout(finish, maxMs);
    };

    const afterPaint = () => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(beginWatch);
      });
    };

    let startedWatch = false;
    const startOnce = () => {
      if (startedWatch || done) return;
      startedWatch = true;
      afterPaint();
    };

    if (document.readyState === "complete") {
      startOnce();
    } else {
      window.addEventListener("load", startOnce, { once: true });
      // Fallback if "load" already fired between checks.
      window.setTimeout(() => {
        if (document.readyState === "complete") startOnce();
      }, 0);
    }
  });
}

let loadPromise: Promise<void> | null = null;
let bootPromise: Promise<void> | null = null;
let bootLang: string | null = null;
let widgetMounted = false;
/** True only after the first stable boot finished applying a language. */
let initialBootDone = false;

/** Whether the first post-hydration GT boot has completed. */
export function isGoogleTranslateBooted(): boolean {
  return initialBootDone;
}

/** Resync state — shared with MutationObserver so in-flight GT work is not lost. */
let resyncActive = false;
let resyncDirty = false;
let resyncTimer = 0;
let settleTimer = 0;
let gtTouchedRecently = false;
let activeTargetLang: UiLanguage | null = null;

/**
 * Lazily inject the Google Translate script once. Safe to call repeatedly.
 * Creates the widget inside Google's own init callback (recommended pattern)
 * so the classic `.goog-te-combo` select is populated reliably.
 */
export function ensureGoogleTranslateLoaded(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.translate?.TranslateElement) {
    const combo = findCombo();
    if (!combo || combo.options.length === 0) {
      mountTranslateElement(true);
    }
    return Promise.resolve();
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    window.googleTranslateElementInit = () => {
      try {
        mountTranslateElement(false);
      } catch (err) {
        console.warn("[i18n] Google Translate widget mount failed:", err);
      }
      resolve();
    };

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (window.google?.translate?.TranslateElement) {
        try {
          mountTranslateElement(false);
        } catch {
          /* ignore */
        }
        resolve();
      }
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

/** Create / refresh the hidden Google Translate widget host (once). */
export function mountTranslateElement(force = false): boolean {
  if (typeof window === "undefined") return false;
  const TE = window.google?.translate?.TranslateElement;
  if (!TE) return false;
  const host = document.getElementById(GOOGLE_TRANSLATE_ELEMENT_ID);
  if (!host) return false;

  ensureSourceLangForTranslate();

  if (!force && widgetMounted && (host.querySelector(".goog-te-combo") || host.querySelector("select"))) {
    return true;
  }

  if (force) {
    host.innerHTML = "";
    widgetMounted = false;
  } else if (host.querySelector(".goog-te-combo") || host.querySelector("select")) {
    widgetMounted = true;
    return true;
  } else if (host.childElementCount > 0) {
    host.innerHTML = "";
  }

  // Default layout (not InlineLayout.SIMPLE) — SIMPLE never creates
  // `.goog-te-combo`, so programmatic language apply silently fails and the
  // page stays English while cookie/hash look correct.
  // multilanguagePage:false → translate the whole page from English source
  // eslint-disable-next-line no-new
  new TE(
    {
      pageLanguage: "en",
      includedLanguages: GOOGLE_TRANSLATE_LANGUAGES,
      autoDisplay: false,
      multilanguagePage: false,
    },
    GOOGLE_TRANSLATE_ELEMENT_ID
  );
  widgetMounted = true;
  return !!findCombo() || host.childElementCount > 0;
}

/** True while a forced retranslate is in flight (skip MutationObserver loops). */
export function isRetranslateLocked(): boolean {
  return resyncActive;
}

/** Mark that GT itself mutated the DOM this frame (font wraps, etc.). */
export function noteGoogleTranslateDomTouch(): void {
  if (resyncActive) gtTouchedRecently = true;
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
 * Wait until GT stops mutating for a short quiet window.
 */
function waitForTranslateSettle(onSettled: () => void): void {
  let quietPasses = 0;
  const maxPasses = 40;

  const step = (pass: number) => {
    if (gtTouchedRecently) {
      quietPasses = 0;
      gtTouchedRecently = false;
    } else {
      quietPasses += 1;
    }

    if (quietPasses >= 2 || pass >= maxPasses) {
      settleTimer = 0;
      onSettled();
      return;
    }
    settleTimer = window.setTimeout(() => step(pass + 1), 50);
  };

  if (settleTimer) window.clearTimeout(settleTimer);
  settleTimer = window.setTimeout(() => step(0), 50);
}

function runComboFlip(code: string): void {
  const combo = findCombo();
  if (!combo) {
    void ensureGoogleTranslateLoaded().then(() => {
      mountTranslateElement(false);
      applyComboLanguage(code, { reloadOnMiss: false });
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

  // Restore English source nodes, then re-apply target after a paint pair.
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
  if (resyncTimer) return;
  resyncTimer = window.setTimeout(() => {
    resyncTimer = 0;
    if (resyncActive) {
      resyncDirty = true;
      return;
    }
    const code = toTranslateCode(lang);
    if (code === "en") return;

    resyncActive = true;
    gtTouchedRecently = false;
    ensureSourceLangForTranslate();
    persistGoogTransPreference(code);
    runComboFlip(code);
  }, RESYNC_QUIET_MS);
}

/**
 * Force Google Translate to re-scan the current DOM after dynamic inserts.
 * Coalesced + dirty-flag replay — one pass at a time.
 */
export function forceRetranslate(lang: UiLanguage): void {
  if (typeof document === "undefined") return;
  // Never retranslate before the stable first boot — that was the partial-page bug.
  if (!initialBootDone) return;
  const code = toTranslateCode(lang);
  if (code === "en") return;

  if (resyncActive) {
    resyncDirty = true;
    activeTargetLang = lang;
    return;
  }

  scheduleForceRetranslate(lang);
}

/**
 * Apply the combo value once the widget exists. Optionally reload once on miss.
 */
function applyComboLanguage(
  code: string,
  opts?: { reloadOnMiss?: boolean }
): void {
  const allowReload = opts?.reloadOnMiss !== false;

  if (setComboValue(code)) {
    clearReloadGuard();
    return;
  }

  let frames = 0;
  const maxFrames = 180; // ~3s at 60fps while combo mounts
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
    if (code === "en") {
      if (pageLooksTranslated()) safeReloadOnce("en");
      return;
    }
    safeReloadOnce(code);
  };
  window.requestAnimationFrame(tick);
}

/**
 * Sync cookie/hash + combo. Does NOT wait for page stability — callers that
 * need a full first paint must use bootGoogleTranslate / activateGoogleTranslate.
 */
export function syncGoogleTranslate(
  lang: UiLanguage,
  opts?: { reloadOnMiss?: boolean }
): void {
  if (typeof document === "undefined") return;
  const code = toTranslateCode(lang);

  ensureSourceLangForTranslate();
  persistGoogTransPreference(code);

  if (code === "en") {
    applyComboLanguage("en", opts);
    return;
  }

  applyComboLanguage(code, opts);
}

/**
 * One-shot boot: wait for a stable page, load GT once, mount once, apply lang.
 * Concurrent callers for the same language share one promise; a different
 * target language waits for the in-flight boot, then starts its own.
 */
export function bootGoogleTranslate(lang: UiLanguage): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();

  const code = toTranslateCode(lang) as UiLanguage;
  activeTargetLang = code;

  if (code === "en" && !readGoogTransLang()) {
    persistGoogTransPreference("en");
    return Promise.resolve();
  }

  if (bootPromise && bootLang === code) return bootPromise;

  const previous = bootPromise;
  const previousLang = bootLang;

  bootLang = code;
  bootPromise = (async () => {
    if (previous && previousLang && previousLang !== code) {
      try {
        await previous;
      } catch {
        /* previous boot failed — continue */
      }
    }
    // Hold translation until React hydration + async sections settle.
    // Persist BEFORE loading GT so the widget can read googtrans on init.
    ensureSourceLangForTranslate();
    persistGoogTransPreference(code === "en" ? "en" : code);
    await waitForPageStable();
    ensureSourceLangForTranslate();
    await ensureGoogleTranslateLoaded();
    // ensureGoogleTranslateLoaded mounts inside Google's callback; recover if needed.
    if (!(await waitForCombo(2500))) {
      mountTranslateElement(true);
      await waitForCombo(4000);
    }
    // One more short quiet window so late Suspense / motion mounts land.
    await waitForPageStable({ quietMs: 300, maxMs: 2500, minMs: 50 });
    syncGoogleTranslate(code, { reloadOnMiss: true });
    // If cookie/hash were set before widget init, combo may already match —
    // still fire change so the full DOM is scanned after React settled.
    if (code !== "en") {
      const combo = findCombo();
      if (combo && combo.value === code) {
        fireComboChange(combo);
      }
    }
    initialBootDone = true;
  })().finally(() => {
    if (bootLang === code) {
      bootPromise = null;
      bootLang = null;
    }
  });

  return bootPromise;
}

/**
 * After client navigation or late dynamic sections: wait for quiet DOM, then
 * force a full re-scan of the current language.
 */
export async function activateGoogleTranslate(lang: UiLanguage): Promise<void> {
  if (typeof document === "undefined") return;
  const code = toTranslateCode(lang) as UiLanguage;
  if (code === "en" && !readGoogTransLang()) return;

  const target = (readGoogTransLang() as UiLanguage | null) || code;
  if (target === "en") return;

  // Ensure the first boot completed (sets initialBootDone) before SPA resyncs.
  if (!initialBootDone) {
    await bootGoogleTranslate(target);
    return;
  }

  await waitForPageStable({ quietMs: 350, maxMs: 5000, minMs: 50 });
  ensureSourceLangForTranslate();
  await ensureGoogleTranslateLoaded();
  mountTranslateElement(false);
  forceRetranslate(target);
}

/**
 * Apply Google Translate for a user-initiated language change.
 * Cookie + standard hash first, then hard reload so the entire page translates.
 */
export function applyGoogleTranslate(lang: UiLanguage): void {
  if (typeof document === "undefined") return;
  const code = toTranslateCode(lang);

  ensureSourceLangForTranslate();
  persistGoogTransPreference(code);
  clearReloadGuard();
  // Hard reload = full DOM translate after bootGoogleTranslate waits for stable.
  window.location.reload();
}

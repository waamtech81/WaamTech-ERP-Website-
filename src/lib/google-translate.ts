/**
 * Google Website Translator helpers.
 * Source page language is always English; visitor picks EN / FR / AR / ES / DE.
 *
 * IMPORTANT: Never infinite-reload. GT often fails (adblock, CSP, privacy mode).
 * Local JSON catalogs already translate chrome; GT is best-effort for page body.
 */
import type { UiLanguage } from "@/i18n";

export const GOOGLE_TRANSLATE_LANGUAGES = "en,ar,fr,es,de" as const;

const GOOGTRANS = "googtrans";

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

function fireComboChange(combo: HTMLSelectElement) {
  combo.dispatchEvent(new Event("change", { bubbles: true }));
  combo.dispatchEvent(new Event("input", { bubbles: true }));
}

function setComboValue(code: string): boolean {
  const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (!combo) return false;
  const opts = Array.from(combo.options);
  if (opts.length === 0) return false;
  const hasOption = opts.some((o) => o.value === code);
  if (!hasOption && code !== "en") return false;
  if (combo.value === code) {
    fireComboChange(combo);
    return true;
  }
  combo.value = code;
  fireComboChange(combo);
  return combo.value === code || opts.some((o) => o.value === code);
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

/**
 * Wait for the Google Translate combo, then apply language.
 * At most ONE reload, and only when sessionStorage works (avoids incognito loops).
 */
export function syncGoogleTranslate(lang: UiLanguage, opts?: { reloadOnMiss?: boolean }): void {
  if (typeof document === "undefined") return;
  const code = lang === "en" ? "en" : lang;
  const reloadKey = "wt_gt_reload";

  if (code === "en") {
    clearGoogTrans();
    setGoogTransHash("en");
    try {
      sessionStorage.removeItem(reloadKey);
    } catch {
      /* ignore */
    }
    if (setComboValue("en")) return;
    // Already translated? One safe reload back to English source.
    if (
      opts?.reloadOnMiss !== false &&
      canUseSessionStorage() &&
      (document.documentElement.classList.contains("translated-ltr") ||
        document.documentElement.classList.contains("translated-rtl") ||
        readGoogTransLang())
    ) {
      try {
        if (sessionStorage.getItem(reloadKey) === "en") return;
        sessionStorage.setItem(reloadKey, "en");
      } catch {
        return;
      }
      window.location.reload();
    }
    return;
  }

  writeGoogTrans(`/en/${code}`);
  setGoogTransHash(code);
  if (setComboValue(code)) {
    try {
      sessionStorage.removeItem(reloadKey);
    } catch {
      /* ignore */
    }
    return;
  }

  let tries = 0;
  const maxTries = 30; // ~4.5s
  const id = window.setInterval(() => {
    tries += 1;
    if (setComboValue(code)) {
      window.clearInterval(id);
      try {
        sessionStorage.removeItem(reloadKey);
      } catch {
        /* ignore */
      }
      return;
    }
    if (tries < maxTries) return;

    window.clearInterval(id);
    // Do NOT reload when storage is unavailable (incognito / blocked) — that
    // caused infinite blank reloads. Chrome strings still work via local JSON.
    if (opts?.reloadOnMiss === false || !canUseSessionStorage()) return;
    try {
      if (sessionStorage.getItem(reloadKey) === code) return;
      sessionStorage.setItem(reloadKey, code);
    } catch {
      return;
    }
    window.location.reload();
  }, 150);
}

/** Apply Google Translate for a user-initiated language change. */
export function applyGoogleTranslate(lang: UiLanguage): void {
  syncGoogleTranslate(lang, { reloadOnMiss: true });
}

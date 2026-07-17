/**
 * WaamTech public website translation helpers.
 *
 * Chrome strings (nav, header, cookie banner, pricing labels) come from local
 * locale JSON catalogs. Full marketing page copy stays English in source and is
 * localized in the browser via Google Website Translator.
 */
import en from "./locales/en.json";
import ar from "./locales/ar.json";
import fr from "./locales/fr.json";
import es from "./locales/es.json";
import de from "./locales/de.json";

export type UiLanguage = "en" | "ar" | "fr" | "es" | "de";
export type TextDirection = "ltr" | "rtl";

export const SUPPORTED_LANGUAGES: {
  code: UiLanguage;
  /** Short code shown in the language dropdown (EN, FR, AR…) */
  short: string;
  label: string;
  nativeLabel: string;
  direction: TextDirection;
}[] = [
  { code: "en", short: "EN", label: "English", nativeLabel: "English", direction: "ltr" },
  { code: "ar", short: "العربية", label: "Arabic", nativeLabel: "العربية", direction: "rtl" },
  { code: "fr", short: "FR", label: "French", nativeLabel: "Français", direction: "ltr" },
  { code: "es", short: "ES", label: "Spanish", nativeLabel: "Español", direction: "ltr" },
  { code: "de", short: "DE", label: "German", nativeLabel: "Deutsch", direction: "ltr" },
];

export const RTL_LANGS = new Set<UiLanguage>(["ar"]);
export const LANGUAGE_CODES = SUPPORTED_LANGUAGES.map((l) => l.code);
export const DEFAULT_LANGUAGE: UiLanguage = "en";

const CORE_CATALOGS: Record<UiLanguage, Record<string, string>> = {
  en: en as Record<string, string>,
  ar: ar as Record<string, string>,
  fr: fr as Record<string, string>,
  es: es as Record<string, string>,
  de: de as Record<string, string>,
};

export function isUiLanguage(code: string): code is UiLanguage {
  return (LANGUAGE_CODES as string[]).includes(code);
}

/** Same normalization as SaaS Core: 2-letter, fall back to English. */
export function normalizeLanguage(code?: string | null): UiLanguage {
  const lang = String(code || "en").toLowerCase().slice(0, 2);
  // Legacy cookie "ur" maps to English (Urdu removed from the site).
  if (lang === "ur") return "en";
  return isUiLanguage(lang) ? lang : "en";
}

export function directionForLanguage(lang: UiLanguage | string): TextDirection {
  return RTL_LANGS.has(normalizeLanguage(lang)) ? "rtl" : "ltr";
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
    vars[name] != null ? String(vars[name]) : `{{${name}}}`
  );
}

export type TranslateOptions = {
  fallback?: string;
  vars?: Record<string, string | number>;
};

/**
 * translate(lang, key, fallback?|opts?, vars?)
 * Resolves from the selected language catalog, then English, then fallback/key.
 * Chrome strings using t() should sit under translate="no" / .notranslate so
 * Google Website Translator does not double-translate them.
 */
export function translate(
  lang: UiLanguage | string,
  key: string,
  fallbackOrOpts?: string | TranslateOptions,
  maybeVars?: Record<string, string | number>
): string {
  let fallback: string | undefined;
  let vars: Record<string, string | number> | undefined;
  if (typeof fallbackOrOpts === "string") {
    fallback = fallbackOrOpts;
    vars = maybeVars;
  } else if (fallbackOrOpts && typeof fallbackOrOpts === "object") {
    fallback = fallbackOrOpts.fallback;
    vars = fallbackOrOpts.vars;
  }
  const code = normalizeLanguage(lang);
  const raw =
    CORE_CATALOGS[code]?.[key] || CORE_CATALOGS.en?.[key] || fallback || key;
  return interpolate(raw, vars);
}

const LOCALE_DIR_STORAGE_KEY = "wt_document_locale";

/** Keep <html lang/dir> aligned (RTL for Arabic). */
export function applyDocumentLocale(lang: UiLanguage | string, direction?: TextDirection) {
  if (typeof document === "undefined") return;
  const code = normalizeLanguage(lang);
  const dir = direction || directionForLanguage(code);
  document.documentElement.lang = code;
  document.documentElement.dir = dir;
  document.documentElement.setAttribute("data-locale", code);
  document.documentElement.setAttribute("data-dir", dir);
  document.body?.setAttribute("dir", dir);
  try {
    localStorage.setItem(LOCALE_DIR_STORAGE_KEY, JSON.stringify({ lang: code, dir }));
  } catch {
    /* ignore quota / private mode */
  }
}

/** Locale BCP-47 hints for Intl. */
export const LOCALE_CODE_BY_LANG: Record<UiLanguage, string> = {
  en: "en-US",
  ar: "ar-SA",
  fr: "fr-FR",
  es: "es-ES",
  de: "de-DE",
};

/** Shared persistence keys. */
export const LOCALE_STORAGE = {
  document: LOCALE_DIR_STORAGE_KEY,
  preview: "wt_preview_language",
  langCookie: "wt_lang",
  currencyCookie: "wt_currency",
  countryCookie: "wt_country",
} as const;

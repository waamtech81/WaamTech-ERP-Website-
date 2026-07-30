/**
 * English-only UI string catalog for site chrome (nav, header, cookie banner, etc.).
 */
import en from "./locales/en.json";

export type TranslateOptions = {
  fallback?: string;
  vars?: Record<string, string | number>;
};

const CATALOG = en as Record<string, string>;

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
    vars[name] != null ? String(vars[name]) : `{{${name}}}`
  );
}

/**
 * translate(key, fallback?|opts?, vars?)
 * Resolves from the English catalog, then fallback/key.
 */
export function translate(
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
  const raw = CATALOG[key] || fallback || key;
  return interpolate(raw, vars);
}

/** Shared persistence keys (currency / country only). */
export const LOCALE_STORAGE = {
  currencyCookie: "wt_currency",
  countryCookie: "wt_country",
} as const;

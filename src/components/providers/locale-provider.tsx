"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  applyDocumentLocale,
  directionForLanguage,
  normalizeLanguage,
  translate,
  SUPPORTED_LANGUAGES,
  LOCALE_STORAGE,
  type TextDirection,
  type TranslateOptions,
  type UiLanguage,
} from "@/i18n";
import {
  CURRENCIES,
  CURRENCY_CODES,
  normalizeCurrency,
  type CurrencyCode,
} from "@/lib/currency/config";
import {
  convertUsd,
  formatUsdAs,
  type FormatMoneyOptions,
  type RateMap,
} from "@/lib/currency/format";
import { applyGoogleTranslate, syncGoogleTranslate } from "@/lib/google-translate";

/** Client refresh cadence for live USD rates (daily). */
const RATES_REFRESH_MS = 60 * 60 * 24 * 1000;

type LocaleContextValue = {
  language: UiLanguage;
  direction: TextDirection;
  currency: CurrencyCode;
  country: string | null;
  rates: RateMap;
  ratesSource: "live" | "fallback" | "initial";
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
  currencies: typeof CURRENCIES;
  currencyCodes: CurrencyCode[];
  /** translate(key, fallback?, vars?) — same shape as SaaS Core */
  t: (
    key: string,
    fallbackOrOpts?: string | TranslateOptions,
    vars?: Record<string, string | number>
  ) => string;
  setLanguage: (lang: UiLanguage) => void;
  setCurrency: (code: CurrencyCode) => void;
  /** Convert a USD amount to the active display currency (number). */
  convert: (usd: number) => number;
  /** Convert + format a USD amount for display in the active currency. */
  formatPrice: (usd: number, opts?: FormatMoneyOptions) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${
    60 * 60 * 24 * 365
  }; samesite=lax`;
}

const MANUAL_COOKIE = "wt_locale_manual";

export type LocaleProviderProps = {
  children: ReactNode;
  initialLanguage: UiLanguage;
  initialCurrency: CurrencyCode;
  initialCountry?: string | null;
  initialRates: RateMap;
};

export function LocaleProvider({
  children,
  initialLanguage,
  initialCurrency,
  initialCountry = null,
  initialRates,
}: LocaleProviderProps) {
  const [language, setLanguageState] = useState<UiLanguage>(initialLanguage);
  const [currency, setCurrencyState] = useState<CurrencyCode>(initialCurrency);
  const [rates, setRates] = useState<RateMap>(initialRates);
  const [ratesSource, setRatesSource] =
    useState<LocaleContextValue["ratesSource"]>("initial");
  const country = initialCountry;
  const manualRef = useRef(false);

  const direction = directionForLanguage(language);

  // Keep <html lang/dir> + storage aligned (SSR already set these; idempotent).
  // Arabic → RTL layout; other languages stay LTR.
  useEffect(() => {
    applyDocumentLocale(language, direction);
  }, [language, direction]);

  // On first paint, sync Google Translate if the widget is already ready.
  // Never auto-reload on mount — that caused blank infinite loops in
  // incognito / when translate.google.com is blocked.
  useEffect(() => {
    syncGoogleTranslate(language, { reloadOnMiss: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, []);

  // Refresh USD exchange rates on mount and once per day (master currency = USD).
  useEffect(() => {
    let alive = true;

    const pull = () => {
      fetch("/api/exchange-rates")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!alive || !data?.rates) return;
          setRates(data.rates as RateMap);
          setRatesSource(data.source === "live" ? "live" : "fallback");
        })
        .catch(() => {
          /* keep initial rates */
        });
    };

    pull();
    const id = window.setInterval(pull, RATES_REFRESH_MS);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  // SaaS sync: adopt the logged-in user's saved language/currency unless the
  // visitor has manually overridden it in this browser (priority 1 wins).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.cookie.includes(`${MANUAL_COOKIE}=1`)) {
      manualRef.current = true;
      return;
    }
    let alive = true;
    fetch("/api/locale", { headers: { Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive || manualRef.current || !data?.localization) return;
        const loc = data.localization as Record<string, unknown>;
        const savedLang = loc.user_preferred_language ?? loc.ui_language;
        if (savedLang) {
          const lang = normalizeLanguage(String(savedLang));
          setLanguageState(lang);
          applyDocumentLocale(lang);
          writeCookie(LOCALE_STORAGE.langCookie, lang);
          syncGoogleTranslate(lang, { reloadOnMiss: false });
        }
        if (loc.currency) {
          const cur = String(loc.currency).toUpperCase();
          if ((CURRENCY_CODES as string[]).includes(cur)) {
            setCurrencyState(cur as CurrencyCode);
            writeCookie(LOCALE_STORAGE.currencyCookie, cur);
          }
        }
      })
      .catch(() => {
        /* stay with detected values */
      });
    return () => {
      alive = false;
    };
  }, []);

  const persistManual = useCallback(() => {
    manualRef.current = true;
    writeCookie(MANUAL_COOKIE, "1");
  }, []);

  const setLanguage = useCallback(
    (lang: UiLanguage) => {
      const code = normalizeLanguage(lang);
      setLanguageState(code);
      applyDocumentLocale(code);
      writeCookie(LOCALE_STORAGE.langCookie, code);
      persistManual();
      try {
        sessionStorage.setItem(LOCALE_STORAGE.preview, code); // SaaS Core preview key
      } catch {
        /* ignore */
      }
      // Page content: Google Website Translator (EN source → selected language).
      applyGoogleTranslate(code);
      // Best-effort two-way sync (only persists for authenticated Core users).
      fetch("/api/locale", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferred_language: code }),
      }).catch(() => {
        /* anonymous visitor: cookie/localStorage already remembers it */
      });
    },
    [persistManual]
  );

  const setCurrency = useCallback(
    (code: CurrencyCode) => {
      const cur = normalizeCurrency(code);
      setCurrencyState(cur);
      writeCookie(LOCALE_STORAGE.currencyCookie, cur);
      persistManual();
    },
    [persistManual]
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      language,
      direction,
      currency,
      country,
      rates,
      ratesSource,
      supportedLanguages: SUPPORTED_LANGUAGES,
      currencies: CURRENCIES,
      currencyCodes: CURRENCY_CODES,
      t: (key, fallbackOrOpts, vars) =>
        translate(language, key, fallbackOrOpts as never, vars),
      setLanguage,
      setCurrency,
      convert: (usd) => convertUsd(usd, currency, rates),
      formatPrice: (usd, opts) => formatUsdAs(usd, currency, rates, opts),
    }),
    [language, direction, currency, country, rates, ratesSource, setLanguage, setCurrency]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** Access locale + currency. Falls back to English/USD outside a provider. */
export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (ctx) return ctx;
  // Safe default (e.g. isolated tests) — mirrors SaaS Core's fallback behavior.
  return {
    language: "en",
    direction: "ltr",
    currency: "USD",
    country: null,
    rates: {},
    ratesSource: "fallback",
    supportedLanguages: SUPPORTED_LANGUAGES,
    currencies: CURRENCIES,
    currencyCodes: CURRENCY_CODES,
    t: (key, fallbackOrOpts, vars) =>
      translate("en", key, fallbackOrOpts as never, vars),
    setLanguage: () => {},
    setCurrency: () => {},
    convert: (usd) => usd,
    formatPrice: (usd, opts) => formatUsdAs(usd, "USD", {}, opts),
  };
}

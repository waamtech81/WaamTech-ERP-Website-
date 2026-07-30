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
import { translate, LOCALE_STORAGE, type TranslateOptions } from "@/i18n";
import {
  CURRENCIES,
  CURRENCY_CODES,
  DEFAULT_CURRENCY,
  isCurrencyCode,
  normalizeCurrency,
  type CurrencyCode,
} from "@/lib/currency/config";
import {
  convertUsd,
  formatUsdAs,
  type FormatMoneyOptions,
  type RateMap,
} from "@/lib/currency/format";

/** Client refresh cadence for live USD rates (daily). */
const RATES_REFRESH_MS = 60 * 60 * 24 * 1000;

type LocaleContextValue = {
  currency: CurrencyCode;
  country: string | null;
  rates: RateMap;
  ratesSource: "live" | "fallback" | "initial";
  currencies: typeof CURRENCIES;
  currencyCodes: CurrencyCode[];
  /** translate(key, fallback?, vars?) — English catalog only */
  t: (
    key: string,
    fallbackOrOpts?: string | TranslateOptions,
    vars?: Record<string, string | number>
  ) => string;
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
  initialCurrency: CurrencyCode;
  initialCountry?: string | null;
  initialRates: RateMap;
};

export function LocaleProvider({
  children,
  initialCurrency,
  initialCountry = null,
  initialRates,
}: LocaleProviderProps) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(initialCurrency);
  const [country, setCountryState] = useState<string | null>(initialCountry);
  const [rates, setRates] = useState<RateMap>(initialRates);
  const [ratesSource, setRatesSource] =
    useState<LocaleContextValue["ratesSource"]>("initial");
  const [enabledCurrencyCodes, setEnabledCurrencyCodes] =
    useState<CurrencyCode[]>(CURRENCY_CODES);
  const manualRef = useRef(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/commercial/currencies", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive || !data?.currencies?.length) return;
        const codes = (data.currencies as unknown[])
          .map((c) => {
            if (typeof c === "string") return c;
            if (c && typeof c === "object" && "code" in c) {
              return String((c as { code: unknown }).code);
            }
            return "";
          })
          .filter(isCurrencyCode);
        if (!codes.length) return;
        const unique: CurrencyCode[] = Array.from(new Set(codes));
        setEnabledCurrencyCodes(unique);
        setCurrencyState((prev) =>
          unique.includes(prev) ? prev : normalizeCurrency(unique[0] || DEFAULT_CURRENCY)
        );
      })
      .catch(() => {
        /* keep local fallback list */
      });
    return () => {
      alive = false;
    };
  }, []);

  // Auto currency from visitor geo (IP) when the user has not manually chosen.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.cookie.includes(`${MANUAL_COOKIE}=1`)) {
      manualRef.current = true;
      return;
    }

    let alive = true;
    fetch("/api/geo", { cache: "no-store", credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive || manualRef.current || !data) return;

        const nextCountry = data.country
          ? String(data.country).trim().toUpperCase()
          : "";
        const savedCountry = document.cookie
          .split("; ")
          .find((row) => row.startsWith(`${LOCALE_STORAGE.countryCookie}=`))
          ?.split("=")[1];
        const savedCountryNorm = savedCountry
          ? decodeURIComponent(savedCountry).trim().toUpperCase()
          : "";
        const countryChanged =
          nextCountry.length === 2 &&
          savedCountryNorm.length === 2 &&
          nextCountry !== savedCountryNorm;

        if (nextCountry.length === 2) {
          setCountryState(nextCountry);
          writeCookie(LOCALE_STORAGE.countryCookie, nextCountry);
        }

        const cur = data.currency
          ? normalizeCurrency(String(data.currency))
          : DEFAULT_CURRENCY;

        if (data.currency || countryChanged || !savedCountryNorm) {
          setCurrencyState(cur);
          writeCookie(LOCALE_STORAGE.currencyCookie, cur);
        }
      })
      .catch(() => {
        /* keep SSR / cookie currency */
      });

    return () => {
      alive = false;
    };
  }, []);

  // Refresh USD exchange rates after idle (layout already provides fallback rates).
  useEffect(() => {
    let alive = true;
    let intervalId = 0;

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

    const start = () => {
      pull();
      intervalId = window.setInterval(pull, RATES_REFRESH_MS);
    };

    let idleId: number | undefined;
    let timeoutId: number | undefined;
    const eagerMs = currency === "USD" ? 2000 : 200;
    if (typeof window.requestIdleCallback === "function" && currency === "USD") {
      idleId = window.requestIdleCallback(start, { timeout: 4000 });
    } else {
      timeoutId = window.setTimeout(start, eagerMs);
    }

    return () => {
      alive = false;
      if (idleId !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [currency]);

  // SaaS sync only when an auth bearer might exist (currency preference only).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.cookie.includes(`${MANUAL_COOKIE}=1`)) {
      manualRef.current = true;
      return;
    }
    const hasAuthHint =
      document.cookie.includes("wt_session") ||
      document.cookie.includes("access_token") ||
      !!localStorage.getItem("access_token");
    if (!hasAuthHint) return;

    let alive = true;
    fetch("/api/locale", { headers: { Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive || manualRef.current || !data?.localization) return;
        const loc = data.localization as Record<string, unknown>;
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

  const setCurrency = useCallback(
    (code: CurrencyCode) => {
      const cur = normalizeCurrency(code);
      if (!enabledCurrencyCodes.includes(cur)) return;
      setCurrencyState(cur);
      writeCookie(LOCALE_STORAGE.currencyCookie, cur);
      persistManual();
    },
    [persistManual, enabledCurrencyCodes]
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      currency,
      country,
      rates,
      ratesSource,
      currencies: CURRENCIES,
      currencyCodes: enabledCurrencyCodes,
      t: (key, fallbackOrOpts, vars) => translate(key, fallbackOrOpts as never, vars),
      setCurrency,
      convert: (usd) => convertUsd(usd, currency, rates),
      formatPrice: (usd, opts) => formatUsdAs(usd, currency, rates, opts),
    }),
    [currency, country, rates, ratesSource, enabledCurrencyCodes, setCurrency]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** Access currency + English chrome strings. Falls back to USD outside a provider. */
export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (ctx) return ctx;
  return {
    currency: "USD",
    country: null,
    rates: {},
    ratesSource: "fallback",
    currencies: CURRENCIES,
    currencyCodes: CURRENCY_CODES,
    t: (key, fallbackOrOpts, vars) => translate(key, fallbackOrOpts as never, vars),
    setCurrency: () => {},
    convert: (usd) => usd,
    formatPrice: (usd, opts) => formatUsdAs(usd, "USD", {}, opts),
  };
}

/**
 * Currency display helpers (client + server safe).
 *
 * USD is the master value everywhere. These helpers convert a USD amount to a
 * display currency and format it with the correct symbol + grouping. Formatting
 * follows the same intent as SaaS Core's formatCurrencyLocale (symbol + locale
 * aware grouping) while using Intl for correctness.
 */
import {
  CURRENCIES,
  FALLBACK_RATES,
  normalizeCurrency,
  type CurrencyCode,
} from "@/lib/currency/config";

export type RateMap = Partial<Record<CurrencyCode, number>>;

export function convertUsd(usd: number, currency: CurrencyCode, rates?: RateMap): number {
  const code = normalizeCurrency(currency);
  const rate = (rates?.[code] ?? FALLBACK_RATES[code]) || 1;
  return usd * rate;
}

/** Sensible marketing rounding: whole units for large/round values. */
function displayDecimals(converted: number, meta: (typeof CURRENCIES)[CurrencyCode]): number {
  if (meta.decimals === 0) return 0;
  // Keep cents only for small fractional amounts (e.g. $5.99 hosting).
  if (converted < 100 && Math.round(converted) !== converted) return 2;
  return 0;
}

export type FormatMoneyOptions = {
  /** Append the ISO code, e.g. "$49 USD" */
  showCode?: boolean;
  /** Force a specific number of fraction digits */
  decimals?: number;
};

/** Format an already-converted amount in the given currency. */
export function formatMoney(
  amount: number,
  currency: CurrencyCode,
  opts: FormatMoneyOptions = {}
): string {
  const meta = CURRENCIES[normalizeCurrency(currency)];
  const decimals = opts.decimals ?? displayDecimals(amount, meta);

  let formatted: string;
  try {
    formatted = new Intl.NumberFormat(meta.locale, {
      style: "currency",
      currency: meta.code,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      currencyDisplay: "narrowSymbol",
    }).format(amount);
  } catch {
    // Fallback: manual symbol + grouped number
    const number = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
    formatted = `${meta.symbol} ${number}`;
  }

  return opts.showCode ? `${formatted} ${meta.code}` : formatted;
}

/** Convert a USD amount and format it for display in one call. */
export function formatUsdAs(
  usd: number,
  currency: CurrencyCode,
  rates?: RateMap,
  opts: FormatMoneyOptions = {}
): string {
  return formatMoney(convertUsd(usd, currency, rates), currency, opts);
}

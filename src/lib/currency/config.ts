/**
 * Global currency configuration for the WaamTech public website.
 *
 * MASTER CURRENCY = USD. Every price in the codebase is stored in USD and
 * converted for display only. No localized amount is ever hardcoded.
 */

export type CurrencyCode =
  | "USD"
  | "EUR"
  | "GBP"
  | "AED"
  | "SAR"
  | "PKR"
  | "CAD"
  | "AUD"
  | "JPY"
  | "CNY"
  | "INR"
  | "SGD"
  | "ZAR"
  | "TRY"
  | "BRL";

export type CurrencyMeta = {
  code: CurrencyCode;
  /** Display symbol used in the switcher */
  symbol: string;
  name: string;
  /** BCP-47 locale used for Intl grouping/symbol placement */
  locale: string;
  /** Fraction digits for the smallest sensible marketing display */
  decimals: number;
};

export const MASTER_CURRENCY: CurrencyCode = "USD";

export const CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  USD: { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US", decimals: 2 },
  EUR: { code: "EUR", symbol: "€", name: "Euro", locale: "de-DE", decimals: 2 },
  GBP: { code: "GBP", symbol: "£", name: "British Pound", locale: "en-GB", decimals: 2 },
  AED: { code: "AED", symbol: "AED", name: "UAE Dirham", locale: "ar-AE", decimals: 2 },
  SAR: { code: "SAR", symbol: "SAR", name: "Saudi Riyal", locale: "ar-SA", decimals: 2 },
  PKR: { code: "PKR", symbol: "Rs", name: "Pakistani Rupee", locale: "en-PK", decimals: 0 },
  CAD: { code: "CAD", symbol: "CA$", name: "Canadian Dollar", locale: "en-CA", decimals: 2 },
  AUD: { code: "AUD", symbol: "A$", name: "Australian Dollar", locale: "en-AU", decimals: 2 },
  JPY: { code: "JPY", symbol: "¥", name: "Japanese Yen", locale: "ja-JP", decimals: 0 },
  CNY: { code: "CNY", symbol: "¥", name: "Chinese Yuan", locale: "zh-CN", decimals: 2 },
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee", locale: "en-IN", decimals: 0 },
  SGD: { code: "SGD", symbol: "S$", name: "Singapore Dollar", locale: "en-SG", decimals: 2 },
  ZAR: { code: "ZAR", symbol: "R", name: "South African Rand", locale: "en-ZA", decimals: 2 },
  TRY: { code: "TRY", symbol: "₺", name: "Turkish Lira", locale: "tr-TR", decimals: 2 },
  BRL: { code: "BRL", symbol: "R$", name: "Brazilian Real", locale: "pt-BR", decimals: 2 },
};

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];
export const DEFAULT_CURRENCY: CurrencyCode = "USD";

export function isCurrencyCode(code?: string | null): code is CurrencyCode {
  return !!code && (CURRENCY_CODES as string[]).includes(code.toUpperCase());
}

export function normalizeCurrency(code?: string | null): CurrencyCode {
  const upper = String(code || "").toUpperCase();
  return isCurrencyCode(upper) ? (upper as CurrencyCode) : DEFAULT_CURRENCY;
}

/**
 * Static fallback rates (base = USD). Used when the live exchange service is
 * unavailable so the site never breaks and never shows a hardcoded local price.
 * Calibrated so example USD $49 ≈ the amounts in the product spec.
 */
export const FALLBACK_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
  SAR: 3.75,
  PKR: 283.6,
  CAD: 1.34,
  AUD: 1.48,
  JPY: 157,
  CNY: 7.24,
  INR: 83.2,
  SGD: 1.35,
  ZAR: 18.4,
  TRY: 32.5,
  BRL: 5.4,
};

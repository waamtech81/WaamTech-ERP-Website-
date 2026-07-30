/**
 * Country / currency detection helpers.
 *
 * Country detection uses CDN geo headers when present (Vercel, Cloudflare),
 * and falls back to IP lookup via `geo-ip.ts` on hosts like Webdock/cPanel.
 * Everything degrades gracefully to USD.
 */
import { normalizeCurrency, type CurrencyCode } from "@/lib/currency/config";

/** ISO 3166-1 alpha-2 country → preferred display currency. */
export const COUNTRY_TO_CURRENCY: Record<string, CurrencyCode> = {
  US: "USD", EC: "USD",
  PK: "PKR",
  CA: "CAD",
  AU: "AUD", NZ: "AUD",
  AE: "AED",
  SA: "SAR", BH: "SAR",
  QA: "SAR", KW: "SAR", OM: "SAR",
  // Eurozone
  DE: "EUR", AT: "EUR", FR: "EUR", BE: "EUR", LU: "EUR", ES: "EUR",
  IT: "EUR", NL: "EUR", IE: "EUR", PT: "EUR", FI: "EUR", GR: "EUR",
  MC: "EUR",
};

/** Read country code from common CDN/edge geo headers. */
export function countryFromHeaders(headers: Headers): string | null {
  const raw =
    headers.get("x-vercel-ip-country") ||
    headers.get("cf-ipcountry") ||
    headers.get("x-country-code") ||
    headers.get("x-geo-country") ||
    "";
  const code = raw.trim().toUpperCase();
  if (!code || code === "XX" || code.length !== 2) return null;
  return code;
}

export function currencyForCountry(country?: string | null): CurrencyCode | null {
  if (!country) return null;
  return COUNTRY_TO_CURRENCY[country.toUpperCase()] ?? null;
}

/** Resolve display currency: GeoIP country → default USD. */
export function detectCurrency(headers: Headers): CurrencyCode {
  const byCountry = currencyForCountry(countryFromHeaders(headers));
  return byCountry ? normalizeCurrency(byCountry) : "USD";
}

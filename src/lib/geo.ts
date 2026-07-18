/**
 * Country / language / currency detection helpers.
 *
 * Country detection uses CDN geo headers when present (Vercel, Cloudflare),
 * and falls back to IP lookup via `geo-ip.ts` on hosts like Webdock/cPanel.
 * Everything degrades gracefully to English + USD.
 */
import { normalizeLanguage, type UiLanguage } from "@/i18n";
import { normalizeCurrency, type CurrencyCode } from "@/lib/currency/config";

/** ISO 3166-1 alpha-2 country → preferred SaaS-supported language (EN / AR / FR). */
export const COUNTRY_TO_LANGUAGE: Record<string, UiLanguage> = {
  // Arabic
  SA: "ar", AE: "ar", QA: "ar", KW: "ar", BH: "ar", OM: "ar", JO: "ar",
  LB: "ar", IQ: "ar", EG: "ar", DZ: "ar", MA: "ar", TN: "ar", LY: "ar",
  SD: "ar", YE: "ar", SY: "ar", PS: "ar",
  // French
  FR: "fr", BE: "fr", LU: "fr", MC: "fr", SN: "fr", CI: "fr", CM: "fr",
  // English (explicit) — PK uses English UI; currency still maps to PKR
  // DE / ES / AT / etc. fall through to English (only EN / AR / FR are offered)
  US: "en", GB: "en", CA: "en", AU: "en", NZ: "en", IE: "en", IN: "en",
  ZA: "en", NG: "en", KE: "en", SG: "en", PH: "en", PK: "en",
  DE: "en", AT: "en", CH: "en", LI: "en",
  ES: "en", MX: "en", AR: "en", CO: "en", CL: "en", PE: "en", VE: "en",
  EC: "en", GT: "en", CU: "en", BO: "en", DO: "en", HN: "en", PY: "en",
  SV: "en", NI: "en", CR: "en", UY: "en", PA: "en",
};

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

/** Parse an Accept-Language header into an ordered list of supported languages. */
export function languagesFromAcceptLanguage(accept?: string | null): UiLanguage[] {
  if (!accept) return [];
  const parsed = accept
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.trim().toLowerCase(), q: q ? parseFloat(q) : 1 };
    })
    .filter((x) => x.tag)
    .sort((a, b) => b.q - a.q);

  const out: UiLanguage[] = [];
  for (const { tag } of parsed) {
    const lang = normalizeLanguage(tag);
    // normalizeLanguage returns 'en' for unknown tags; only keep genuine matches
    if (tag.slice(0, 2) === lang && !out.includes(lang)) out.push(lang);
  }
  return out;
}

export function languageForCountry(country?: string | null): UiLanguage | null {
  if (!country) return null;
  return COUNTRY_TO_LANGUAGE[country.toUpperCase()] ?? null;
}

export function currencyForCountry(country?: string | null): CurrencyCode | null {
  if (!country) return null;
  return COUNTRY_TO_CURRENCY[country.toUpperCase()] ?? null;
}

/**
 * Resolve language using the documented priority order (steps 4–6 happen at the
 * edge; the client provider layers 1–3 on top):
 *   Accept-Language → GeoIP country → default English.
 */
export function detectLanguage(headers: Headers): UiLanguage {
  const accepted = languagesFromAcceptLanguage(headers.get("accept-language"));
  if (accepted.length) return accepted[0];
  const byCountry = languageForCountry(countryFromHeaders(headers));
  if (byCountry) return byCountry;
  return "en";
}

/** Resolve display currency: GeoIP country → default USD. */
export function detectCurrency(headers: Headers): CurrencyCode {
  const byCountry = currencyForCountry(countryFromHeaders(headers));
  return byCountry ? normalizeCurrency(byCountry) : "USD";
}

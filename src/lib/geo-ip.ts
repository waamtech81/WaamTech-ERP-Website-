/**
 * IP → country lookup for hosts without CDN geo headers (e.g. Webdock/cPanel).
 * Edge/middleware safe — uses fetch only, short timeout, in-memory cache.
 */
import { currencyForCountry, countryFromHeaders } from "@/lib/geo";
import { normalizeCurrency, type CurrencyCode } from "@/lib/currency/config";

type CacheEntry = { country: string | null; at: number };

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h
const LOOKUP_TIMEOUT_MS = 900;
const ipCache = new Map<string, CacheEntry>();

function isPrivateOrLocalIp(ip: string): boolean {
  const v = ip.trim().toLowerCase();
  if (!v || v === "unknown" || v === "::1" || v === "localhost") return true;
  if (v.startsWith("127.") || v.startsWith("10.") || v.startsWith("192.168.")) {
    return true;
  }
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(v)) return true;
  if (v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80:")) return true;
  return false;
}

function normalizeCountryCode(raw: unknown): string | null {
  const code = String(raw || "")
    .trim()
    .toUpperCase();
  if (!code || code === "XX" || code.length !== 2) return null;
  return code;
}

async function fetchCountryFromProvider(ip: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);
  try {
    // Primary: ipwho.is (HTTPS, no key for light use)
    const res = await fetch(
      `https://ipwho.is/${encodeURIComponent(ip)}?fields=success,country_code`,
      {
        signal: controller.signal,
        headers: { Accept: "application/json" },
        cache: "no-store",
      }
    );
    if (res.ok) {
      const json = (await res.json()) as {
        success?: boolean;
        country_code?: string;
      };
      if (json.success !== false) {
        const code = normalizeCountryCode(json.country_code);
        if (code) return code;
      }
    }
  } catch {
    /* try fallback */
  } finally {
    clearTimeout(timer);
  }

  // Fallback: ipapi.co country endpoint (plain text)
  const controller2 = new AbortController();
  const timer2 = setTimeout(() => controller2.abort(), LOOKUP_TIMEOUT_MS);
  try {
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/country/`, {
      signal: controller2.signal,
      headers: { Accept: "text/plain" },
      cache: "no-store",
    });
    if (res.ok) {
      const text = await res.text();
      return normalizeCountryCode(text);
    }
  } catch {
    /* ignore */
  } finally {
    clearTimeout(timer2);
  }

  return null;
}

/** Resolve ISO country from a client IP. Cached; never throws. */
export async function countryFromIp(ip: string | null | undefined): Promise<string | null> {
  const key = String(ip || "").trim();
  if (!key || isPrivateOrLocalIp(key)) return null;

  const hit = ipCache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.country;

  const country = await fetchCountryFromProvider(key);
  ipCache.set(key, { country, at: Date.now() });
  return country;
}

/**
 * Best-effort country: CDN headers first, then IP lookup.
 */
export async function resolveRequestCountry(
  headers: Headers,
  ip?: string | null
): Promise<string | null> {
  return countryFromHeaders(headers) || (await countryFromIp(ip));
}

export function currencyFromCountryCode(country?: string | null): CurrencyCode | null {
  const mapped = currencyForCountry(country);
  return mapped ? normalizeCurrency(mapped) : null;
}

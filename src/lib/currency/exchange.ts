/**
 * Reusable platform exchange-rate service (base = USD).
 *
 * There is no exchange-rate service in the SaaS Core repo, so per the spec this
 * is a new reusable service. It:
 *   - fetches live USD-based rates from a configurable provider,
 *   - caches them (Next.js data cache + in-memory) with periodic refresh,
 *   - falls back to bundled static rates so pricing never breaks.
 *
 * Server-only. The client consumes rates via /api/exchange-rates.
 */
import "server-only";
import {
  CURRENCY_CODES,
  FALLBACK_RATES,
  type CurrencyCode,
} from "@/lib/currency/config";

export type RateTable = {
  base: "USD";
  rates: Record<CurrencyCode, number>;
  /** epoch ms when fetched */
  fetchedAt: number;
  source: "live" | "fallback";
};

/** How long rates stay fresh before a background refresh (seconds). Default: daily. */
export const RATE_TTL_SECONDS = Number(process.env.EXCHANGE_RATES_TTL || 60 * 60 * 24);

const PROVIDER_URL =
  process.env.EXCHANGE_RATES_API_URL || "https://open.er-api.com/v6/latest/USD";
const PROVIDER_KEY = process.env.EXCHANGE_RATES_API_KEY || "";

let memoryCache: RateTable | null = null;

function buildTable(
  partial: Partial<Record<CurrencyCode, number>>,
  source: RateTable["source"]
): RateTable {
  const rates = {} as Record<CurrencyCode, number>;
  for (const code of CURRENCY_CODES) {
    const val = partial[code];
    rates[code] = typeof val === "number" && val > 0 ? val : FALLBACK_RATES[code];
  }
  rates.USD = 1;
  return { base: "USD", rates, fetchedAt: Date.now(), source };
}

export function fallbackTable(): RateTable {
  return buildTable(FALLBACK_RATES, "fallback");
}

async function fetchLiveRates(): Promise<RateTable> {
  const url = PROVIDER_KEY
    ? `${PROVIDER_URL}${PROVIDER_URL.includes("?") ? "&" : "?"}apikey=${PROVIDER_KEY}`
    : PROVIDER_URL;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    // Leverage Next.js data cache; revalidates in the background.
    next: { revalidate: RATE_TTL_SECONDS, tags: ["exchange-rates"] },
  });
  if (!res.ok) throw new Error(`Exchange provider responded ${res.status}`);

  const json = (await res.json()) as {
    result?: string;
    rates?: Record<string, number>;
    conversion_rates?: Record<string, number>;
  };
  const provided = json.rates || json.conversion_rates;
  if (!provided || typeof provided !== "object") {
    throw new Error("Exchange provider returned no rates");
  }

  const partial: Partial<Record<CurrencyCode, number>> = {};
  for (const code of CURRENCY_CODES) {
    if (typeof provided[code] === "number") partial[code] = provided[code];
  }
  return buildTable(partial, "live");
}

/**
 * Get the current USD-based rate table. Uses in-memory cache first, then the
 * cached provider fetch, then static fallback — never throws.
 */
export async function getRates(): Promise<RateTable> {
  const fresh =
    memoryCache && Date.now() - memoryCache.fetchedAt < RATE_TTL_SECONDS * 1000;
  if (memoryCache && fresh) return memoryCache;

  try {
    memoryCache = await fetchLiveRates();
  } catch {
    // Keep a stale-but-usable table if we have one, else fall back.
    memoryCache = memoryCache ?? fallbackTable();
  }
  return memoryCache;
}

/** Convert an amount in USD to the target currency using a rate table. */
export function convertFromUsd(
  usd: number,
  currency: CurrencyCode,
  table: RateTable
): number {
  const rate = table.rates[currency] ?? FALLBACK_RATES[currency] ?? 1;
  return usd * rate;
}

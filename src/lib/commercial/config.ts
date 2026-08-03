import { licenseConfig, normalizeLicenseBase } from "@/lib/license/config";

/** Public catalog cache TTL (seconds) — stale-while-revalidate window. */
export const CATALOG_REVALIDATE_SECONDS = Number(
  process.env.COMMERCIAL_CATALOG_REVALIDATE || 300
);

/** Client soft-stale window before background refresh (ms). */
export const CATALOG_STALE_MS = Number(process.env.NEXT_PUBLIC_CATALOG_STALE_MS || 180_000);

/** Client hard-expiry — force network after this (ms). */
export const CATALOG_MAX_AGE_MS = Number(
  process.env.NEXT_PUBLIC_CATALOG_MAX_AGE_MS || 15 * 60_000
);

/**
 * Browser poll interval for catalog revision fingerprint (ms).
 * Detects Engine plan/price/limit/comparison updates before hard SWR expiry.
 */
export const CATALOG_VERSION_POLL_MS = Number(
  process.env.NEXT_PUBLIC_CATALOG_VERSION_POLL_MS || 60_000
);

/** Optional shared secret for ops-triggered catalog revalidate (header x-catalog-revalidate-key). */
export const CATALOG_REVALIDATE_SECRET =
  process.env.COMMERCIAL_CATALOG_REVALIDATE_SECRET || "";

export function commercialApiBase() {
  return normalizeLicenseBase(licenseConfig.apiUrl);
}

export function commercialHeaders(accessToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  } else if (licenseConfig.apiKey) {
    headers.Authorization = `Bearer ${licenseConfig.apiKey}`;
  }
  return headers;
}

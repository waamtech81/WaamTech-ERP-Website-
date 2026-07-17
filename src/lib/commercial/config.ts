import { licenseConfig, normalizeLicenseBase } from "@/lib/license/config";

/** Public catalog cache TTL (seconds) — stale-while-revalidate window. */
export const CATALOG_REVALIDATE_SECONDS = Number(
  process.env.COMMERCIAL_CATALOG_REVALIDATE || 60
);

/** Client soft-stale window before background refresh (ms). */
export const CATALOG_STALE_MS = Number(process.env.NEXT_PUBLIC_CATALOG_STALE_MS || 60_000);

/** Client hard-expiry — force network after this (ms). */
export const CATALOG_MAX_AGE_MS = Number(
  process.env.NEXT_PUBLIC_CATALOG_MAX_AGE_MS || 5 * 60_000
);

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

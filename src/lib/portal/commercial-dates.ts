/**
 * Portal commercial date normalization — single SSOT for billing/payment/renewal display.
 * Formatting delegates to `@/lib/format-display-datetime` (WAAMTO canonical format).
 */

import {
  formatDisplayDate,
  formatDisplayDateTime,
} from "@/lib/format-display-datetime";

/** Normalize Engine/commercial values to stable YYYY-MM-DD for portal DTOs. */
export function normalizePortalCommercialDate(value: unknown): string | null {
  if (value == null || value === "") return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    const prefix = /^(\d{4}-\d{2}-\d{2})/.exec(raw);
    return prefix ? prefix[1] : null;
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const MIN_PORTAL_COMMERCIAL_YEAR = 2010;
const MAX_PORTAL_COMMERCIAL_YEAR = 2100;

/** Reject epoch/garbage dates from renewal history display. */
export function isPlausiblePortalCommercialDate(value?: string | null): boolean {
  if (!value) return false;
  const m = /^(\d{4})-\d{2}-\d{2}$/.exec(value);
  if (!m) return false;
  const year = Number(m[1]);
  return year >= MIN_PORTAL_COMMERCIAL_YEAR && year <= MAX_PORTAL_COMMERCIAL_YEAR;
}

/** Format for portal UI — date-only stays date-only; timestamps include time + PKT. */
export function formatPortalCommercialDate(value?: string | null): string | null {
  if (!value) return null;
  const formatted = formatDisplayDate(value);
  return formatted === "—" ? null : formatted;
}

export function formatPortalCommercialDateTime(value?: string | null): string | null {
  if (!value) return null;
  const formatted = formatDisplayDateTime(value);
  return formatted === "—" ? null : formatted;
}

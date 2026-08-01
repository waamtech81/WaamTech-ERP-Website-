/**
 * WAAMTO ecosystem display datetime — single canonical format.
 *
 * Date-only:  02 Aug 2026
 * Timestamp:  02 Aug 2026, 11:43 PM PKT
 */

export const WAAMTO_DISPLAY_TIMEZONE = "Asia/Karachi";
export const WAAMTO_DISPLAY_TZ_LABEL = "PKT";

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function hasStoredTimeComponent(value: unknown): boolean {
  if (value == null || value === "") return false;
  if (value instanceof Date) return true;
  const raw = String(value).trim();
  if (!raw) return false;
  if (DATE_ONLY_RE.test(raw)) return false;
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{1,2}:\d{2}/.test(raw)) return true;
  if (/T\d{2}:\d{2}/.test(raw)) return true;
  return false;
}

function parseDisplayDate(value: string | Date): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const raw = String(value).trim();
  if (!raw) return null;
  if (DATE_ONLY_RE.test(raw)) {
    const [y, m, d] = raw.split("-").map(Number);
    const local = new Date(y, m - 1, d);
    return Number.isNaN(local.getTime()) ? null : local;
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function partsRecord(parts: Intl.DateTimeFormatPart[]): Record<string, string> {
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function formatDateOnlyFromDate(
  d: Date,
  timeZone = WAAMTO_DISPLAY_TIMEZONE
): string {
  const p = partsRecord(
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone,
    }).formatToParts(d)
  );
  return `${p.day} ${p.month} ${p.year}`;
}

function formatDateTimeFromDate(
  d: Date,
  timeZone = WAAMTO_DISPLAY_TIMEZONE,
  tzLabel = WAAMTO_DISPLAY_TZ_LABEL
): string {
  const p = partsRecord(
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone,
    }).formatToParts(d)
  );
  const dayPeriod = (p.dayPeriod ?? "").toUpperCase();
  return `${p.day} ${p.month} ${p.year}, ${p.hour}:${p.minute} ${dayPeriod} ${tzLabel}`;
}

export function formatDisplayDate(value: string | Date | null | undefined): string {
  if (value == null || value === "") return "—";
  const d = parseDisplayDate(value);
  if (!d) return String(value);
  if (hasStoredTimeComponent(value)) return formatDateTimeFromDate(d);
  return formatDateOnlyFromDate(d);
}

export function formatDisplayDateTime(value: string | Date | null | undefined): string {
  if (value == null || value === "") return "—";
  const d = parseDisplayDate(value);
  if (!d) return String(value);
  if (!hasStoredTimeComponent(value)) return formatDateOnlyFromDate(d);
  return formatDateTimeFromDate(d);
}

/**
 * WAAMTO ecosystem display datetime — single canonical format.
 *
 * Date-only:  02 Aug 2026
 * Timestamp:  02 Aug 2026, 11:43 PM (user's local timezone label)
 *
 * Never invent fake times (e.g. 05:00 AM from UTC midnight → PKT).
 * Never hardcode a timezone offset — uses the runtime/local timezone.
 */

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Midnight clock times are typically date-only values stored as datetimes. */
const MIDNIGHT_TIME_RE =
  /(?:[T ]|^\d{4}-\d{2}-\d{2}T)0{1,2}:0{2}(?::0{2}(?:\.\d+)?)?(?:Z|[+-]0{2}:?0{2})?$/i;

function isMidnightStoredTime(raw: string): boolean {
  const s = raw.trim();
  if (DATE_ONLY_RE.test(s)) return false;
  if (MIDNIGHT_TIME_RE.test(s)) return true;
  // MySQL / Engine: "2026-08-02 00:00:00" or "2026-08-02T00:00:00.000Z"
  if (/^\d{4}-\d{2}-\d{2}[ T]0{1,2}:0{2}(:0{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/.test(s)) {
    return true;
  }
  return false;
}

export function hasStoredTimeComponent(value: unknown): boolean {
  if (value == null || value === "") return false;
  if (value instanceof Date) {
    // Date objects alone cannot distinguish date-only — treat as timestamp
    // only when caller already decided it has meaningful time.
    return true;
  }
  const raw = String(value).trim();
  if (!raw) return false;
  if (DATE_ONLY_RE.test(raw)) return false;
  if (isMidnightStoredTime(raw)) return false;
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
  if (DATE_ONLY_RE.test(raw) || isMidnightStoredTime(raw)) {
    const prefix = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
    if (!prefix) return null;
    const local = new Date(
      Number(prefix[1]),
      Number(prefix[2]) - 1,
      Number(prefix[3])
    );
    return Number.isNaN(local.getTime()) ? null : local;
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function partsRecord(parts: Intl.DateTimeFormatPart[]): Record<string, string> {
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function shortTzLabel(d: Date): string {
  try {
    const parts = new Intl.DateTimeFormat(undefined, {
      timeZoneName: "short",
    }).formatToParts(d);
    const name = parts.find((p) => p.type === "timeZoneName")?.value;
    return name ? ` ${name}` : "";
  } catch {
    return "";
  }
}

function formatDateOnlyFromDate(d: Date): string {
  // No timeZone option → respect user's / runtime local timezone calendar day
  // for true timestamps; date-only values are constructed as local calendar dates.
  const p = partsRecord(
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).formatToParts(d)
  );
  return `${p.day} ${p.month} ${p.year}`;
}

function formatDateTimeFromDate(d: Date): string {
  const p = partsRecord(
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).formatToParts(d)
  );
  const dayPeriod = (p.dayPeriod ?? "").toUpperCase();
  return `${p.day} ${p.month} ${p.year}, ${p.hour}:${p.minute} ${dayPeriod}${shortTzLabel(d)}`;
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

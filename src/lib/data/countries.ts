import countriesJson from "./countries.json";

export type Country = {
  code: string;
  name: string;
  /** E.164 calling code, e.g. "+92" */
  dialCode: string;
};

/** ISO 3166-1 alpha-2 countries & territories, sorted A→Z by name. */
export const COUNTRIES: Country[] = countriesJson as Country[];

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

/** Flag emoji from ISO alpha-2 (regional indicator symbols). */
export function countryFlag(code?: string | null): string {
  if (!code || code.length !== 2) return "";
  const upper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return "";
  return String.fromCodePoint(
    ...[...upper].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0))
  );
}

export function formatCountryLabel(country: Country): string {
  const flag = countryFlag(country.code);
  const dial = country.dialCode ? ` ${country.dialCode}` : "";
  return `${flag ? `${flag} ` : ""}${country.name}${dial}`.trim();
}

export function getCountryByCode(code?: string | null): Country | undefined {
  if (!code) return undefined;
  return BY_CODE.get(code.toUpperCase());
}

export function getCountryName(code?: string | null): string | undefined {
  return getCountryByCode(code)?.name;
}

export function isValidCountryCode(code?: string | null): boolean {
  if (!code) return false;
  return BY_CODE.has(code.toUpperCase());
}

/**
 * Merge dial code + local number into one phone string for license/API.
 * Example: ("+92", "0300 1234567") → "+92 3001234567"
 * If local already starts with the dial code, it is not duplicated.
 */
export function mergePhoneWithDialCode(
  dialCode?: string | null,
  localNumber?: string | null
): string {
  const dial = String(dialCode || "")
    .trim()
    .replace(/\s+/g, "");
  let local = String(localNumber || "")
    .trim()
    .replace(/[\s()-]/g, "");

  if (!local) return "";

  // Already an international number
  if (local.startsWith("+")) {
    return local.replace(/\s+/g, " ").trim();
  }

  if (!dial) return local;

  const dialDigits = dial.replace(/^\+/, "");
  // Strip leading zeros from national number
  local = local.replace(/^0+/, "");

  if (local.startsWith(dialDigits)) {
    return `+${local}`;
  }

  return `${dial.startsWith("+") ? dial : `+${dial}`} ${local}`.trim();
}

/** Resolve dial code from ISO country or raw dial string. */
export function resolveDialCode(opts: {
  phoneDialCode?: string | null;
  phoneCountryCode?: string | null;
  countryCode?: string | null;
}): string {
  const raw = String(opts.phoneDialCode || "").trim();
  if (raw.startsWith("+") || /^\d+$/.test(raw.replace(/^\+/, ""))) {
    return raw.startsWith("+") ? raw : `+${raw}`;
  }
  const fromPhoneCountry = getCountryByCode(opts.phoneCountryCode)?.dialCode;
  if (fromPhoneCountry) return fromPhoneCountry;
  const fromCountry = getCountryByCode(opts.countryCode)?.dialCode;
  return fromCountry || "";
}

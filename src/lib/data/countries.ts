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

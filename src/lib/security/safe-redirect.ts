/**
 * Open-redirect protection for post-login / middleware redirects.
 * Only same-app relative paths on an allowlist are accepted.
 */

const DEFAULT_FALLBACK = "/portal";

/** Paths a logged-in user may be sent to after auth. */
const INTERNAL_PATH_ALLOWLIST: RegExp[] = [
  /^\/portal(?:\/[\w.-]+)*\/?$/,
  /^\/login\/?$/,
  /^\/signup(?:\/[\w.-]+)*\/?$/,
  /^\/forgot-password\/?$/,
  /^\/reset-password\/?$/,
  /^\/billing\/?$/,
  /^\/create-business\/?$/,
  /^\/new-business\/?$/,
];

/**
 * Map legacy public aliases to the real portal destination before auth bounce.
 */
export function resolvePortalAliasPath(pathname: string): string {
  const path = String(pathname || "").split("?")[0].replace(/\/+$/, "") || "/";
  if (path === "/billing") return "/portal/billing";
  if (path === "/create-business" || path === "/new-business") {
    return "/portal/plans?intent=new_place";
  }
  if (path === "/portal/create-business" || path === "/portal/new-business") {
    return "/portal/plans?intent=new_place";
  }
  return pathname;
}

function isDangerousScheme(value: string): boolean {
  const lower = value.toLowerCase();
  return (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("blob:")
  );
}

/**
 * Returns a safe internal path, or `fallback` when the candidate is external,
 * protocol-relative, absolute, encoded, or outside the allowlist.
 */
export function safeInternalPath(
  candidate: string | null | undefined,
  fallback: string = DEFAULT_FALLBACK
): string {
  if (candidate == null) return fallback;

  let raw = String(candidate).trim();
  if (!raw) return fallback;

  // Decode once to catch %2F%2Fevil.com and similar
  try {
    raw = decodeURIComponent(raw);
  } catch {
    return fallback;
  }
  raw = raw.trim();

  if (
    !raw.startsWith("/") ||
    raw.startsWith("//") ||
    raw.includes("://") ||
    raw.includes("\\") ||
    isDangerousScheme(raw) ||
    /[\u0000-\u001F\u007F]/.test(raw)
  ) {
    return fallback;
  }

  // Normalize via URL parser (rejects host injection on relative paths)
  let pathname: string;
  try {
    const url = new URL(raw, "https://wt.internal");
    if (url.origin !== "https://wt.internal") return fallback;
    if (url.username || url.password || url.host !== "wt.internal") {
      return fallback;
    }
    pathname = url.pathname;
  } catch {
    return fallback;
  }

  if (!pathname.startsWith("/") || pathname.startsWith("//") || pathname.includes("//")) {
    return fallback;
  }

  if (!INTERNAL_PATH_ALLOWLIST.some((re) => re.test(pathname))) {
    return fallback;
  }

  // Keep query string from the original candidate when present (e.g. intent=).
  let search = "";
  try {
    const url = new URL(raw, "https://wt.internal");
    search = url.search || "";
  } catch {
    search = "";
  }

  const resolved = resolvePortalAliasPath(`${pathname}${search}`);
  return resolved || fallback;
}

/** Query keys that must never be used as external redirects. */
export const REDIRECT_QUERY_KEYS = [
  "next",
  "redirect",
  "returnUrl",
  "return_url",
  "callback",
  "callbackUrl",
  "url",
  "continue",
] as const;

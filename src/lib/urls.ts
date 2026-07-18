import { siteConfig } from "@/lib/data/site";

/**
 * Production-grade site URL helpers.
 * Prevents malformed absolute URLs such as https://waamto.com./signup
 */

/** Normalize an origin/base URL: strip trailing dots, trailing slash, collapse path noise. */
export function normalizeSiteOrigin(raw?: string | null): string {
  const fallback = siteConfig.url || "https://waamto.com";
  let value = String(raw || fallback).trim();
  if (!value) value = fallback;

  // Allow missing protocol in env mistakes
  if (!/^https?:\/\//i.test(value)) {
    value = `https://${value}`;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    url = new URL(fallback);
  }

  // FQDN trailing dots (DNS-style) → strip from hostname
  url.hostname = url.hostname.replace(/\.+$/, "");
  // Never keep a trailing slash on origin
  url.pathname = "/";
  url.search = "";
  url.hash = "";

  return url.origin;
}

/** Site public origin from env / siteConfig. */
export function getSiteOrigin(): string {
  return normalizeSiteOrigin(
    process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || siteConfig.url
  );
}

/** Join origin + path safely (no duplicate slashes, no trailing-dot host). */
export function buildAbsoluteSiteUrl(
  path = "/",
  query?: Record<string, string | number | boolean | null | undefined>
): string {
  const origin = getSiteOrigin();
  const normalizedPath = path
    ? path.startsWith("/")
      ? path
      : `/${path}`
    : "/";
  // Collapse accidental duplicate slashes in the path (keep leading single /)
  const cleanPath = normalizedPath.replace(/\/{2,}/g, "/");
  const url = new URL(cleanPath, `${origin}/`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value == null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/**
 * Build a relative app path with query (pathname only).
 * Prefer this for Next.js <Link href>.
 */
export function buildAppPath(
  path: string,
  query?: Record<string, string | number | boolean | null | undefined>
): string {
  const normalizedPath = (path.startsWith("/") ? path : `/${path}`).replace(
    /\/{2,}/g,
    "/"
  );
  const url = new URL(normalizedPath, "https://waamto.invalid");
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value == null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return `${url.pathname}${url.search}`;
}

/** Safe identifiers only — never price / discount / savings / UUIDs. */
export function buildSignupPath(opts: {
  product?: string | null;
  planId?: string | null;
  billingCycle?: string | null;
  planSlug?: string | null;
  industrySlug?: string | null;
  categorySlug?: string | null;
  profileSlug?: string | null;
}): string {
  const industry = String(opts.industrySlug || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const category = String(opts.categorySlug || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const profile = String(opts.profileSlug || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  let path = "/signup";
  if (industry) {
    path += `/${encodeURIComponent(industry)}`;
    if (category) path += `/${encodeURIComponent(category)}`;
  }

  return buildAppPath(path, {
    product: opts.product || undefined,
    plan_id: opts.planId || undefined,
    billing_cycle: opts.billingCycle || undefined,
    // Optional slug for display fallback only — Engine remains SSOT via plan_id
    plan: opts.planSlug || undefined,
    profile: profile || undefined,
  });
}

export function buildAbsoluteSignupUrl(opts: {
  product?: string | null;
  planId?: string | null;
  billingCycle?: string | null;
  planSlug?: string | null;
  industrySlug?: string | null;
  categorySlug?: string | null;
  profileSlug?: string | null;
}): string {
  const path = buildSignupPath(opts);
  const [pathname, search = ""] = path.split("?");
  const query: Record<string, string> = {};
  if (search) {
    new URLSearchParams(search).forEach((v, k) => {
      query[k] = v;
    });
  }
  return buildAbsoluteSiteUrl(pathname, query);
}

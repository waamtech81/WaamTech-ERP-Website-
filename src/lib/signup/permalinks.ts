import { buildAppPath, buildAbsoluteSiteUrl } from "@/lib/urls";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when value looks like an internal Engine UUID. */
export function isUuid(value: string | null | undefined): boolean {
  if (!value) return false;
  return UUID_RE.test(value.trim());
}

/**
 * Normalize industry/category identifiers for public permalinks.
 * Accepts Engine slugs, codes, or legacy underscore IDs (`retail_commerce` → `retail-commerce`).
 */
export function normalizePermalinkSlug(raw: string | null | undefined): string {
  if (!raw) return "";
  return String(raw)
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Match catalog row by public slug, code, or legacy id (never expose UUID in URLs). */
export function catalogSlugMatches(
  item: { slug?: string | null; code?: string | null; id?: string | null },
  needle: string
): boolean {
  const n = normalizePermalinkSlug(needle);
  if (!n) return false;
  if (isUuid(needle) && item.id && item.id.toLowerCase() === needle.trim().toLowerCase()) {
    return true;
  }
  return [item.slug, item.code, item.id]
    .filter(Boolean)
    .some((v) => normalizePermalinkSlug(String(v)) === n);
}

export type SignupPermalinkOpts = {
  industrySlug?: string | null;
  categorySlug?: string | null;
  profileSlug?: string | null;
  product?: string | null;
  planId?: string | null;
  billingCycle?: string | null;
  planSlug?: string | null;
};

/**
 * SEO-friendly signup path.
 * Prefer: /signup/retail-commerce/retail-store
 * Industry only: /signup/retail-commerce
 * Extra commercial params stay as query (product, plan_id, profile slug).
 */
export function buildSignupPermalink(opts: SignupPermalinkOpts): string {
  const industry = normalizePermalinkSlug(opts.industrySlug);
  const category = normalizePermalinkSlug(opts.categorySlug);
  const profile = normalizePermalinkSlug(opts.profileSlug);

  let path = "/signup";
  if (industry) {
    path += `/${encodeURIComponent(industry)}`;
    if (category) path += `/${encodeURIComponent(category)}`;
  }

  return buildAppPath(path, {
    product: opts.product || undefined,
    plan_id: opts.planId || undefined,
    billing_cycle: opts.billingCycle || undefined,
    plan: opts.planSlug || undefined,
    // Profile stays query — slug only, never UUID
    profile: profile && !isUuid(opts.profileSlug) ? profile : undefined,
  });
}

export function buildAbsoluteSignupPermalink(opts: SignupPermalinkOpts): string {
  const relative = buildSignupPermalink(opts);
  const [pathname, search = ""] = relative.split("?");
  const query: Record<string, string> = {};
  if (search) {
    new URLSearchParams(search).forEach((v, k) => {
      query[k] = v;
    });
  }
  return buildAbsoluteSiteUrl(pathname, query);
}

/** Commercial query keys to preserve when rewriting UUID → slug URLs. */
export const SIGNUP_PRESERVE_QUERY_KEYS = [
  "product",
  "plan",
  "plan_id",
  "billing_cycle",
  "intent",
] as const;

export function pickSignupPreserveQuery(
  source: Record<string, string | string[] | undefined> | URLSearchParams
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of SIGNUP_PRESERVE_QUERY_KEYS) {
    let value: string | undefined;
    if (source instanceof URLSearchParams) {
      value = source.get(key) || undefined;
    } else {
      const raw = source[key];
      value = Array.isArray(raw) ? raw[0] : raw;
    }
    if (value) out[key] = value;
  }
  return out;
}

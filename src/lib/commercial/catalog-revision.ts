import type {
  CatalogComparisonBundle,
  CatalogPlan,
  CatalogPricing,
} from "@/lib/commercial/types";

/** Next.js data-cache tag for public commercial GETs. */
export const COMMERCIAL_CATALOG_CACHE_TAG = "commercial-catalog";

/**
 * True when License Engine returned a usable official comparison payload
 * (plan rows plus dimension and/or feature-matrix data).
 */
export function isEngineComparisonUsable(
  comparison?: CatalogComparisonBundle | null
): boolean {
  if (!comparison?.comparison?.length) return false;
  const hasDimensions = (comparison.dimensions || []).length > 0;
  const hasMatrix = (comparison.feature_matrix?.groups || []).length > 0;
  return hasDimensions || hasMatrix;
}

/** FNV-1a 32-bit — stable, dependency-free fingerprint for catalog revisions. */
function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * Derive a revision stamp from Engine commercial catalog fields.
 * Changes when plans, prices, limits, packs, modules, or comparison rows change.
 */
export function computeCatalogRevision(input: {
  plans: CatalogPlan[];
  pricing: CatalogPricing[];
  comparison?: CatalogComparisonBundle | null;
}): string {
  const plans = [...(input.plans || [])]
    .map((p) =>
      [
        p.id,
        p.slug,
        p.monthly_price,
        p.yearly_price,
        p.lifetime_price,
        p.display_price,
        p.original_price,
        p.discount_percentage,
        p.is_popular ? 1 : 0,
        p.is_recommended ? 1 : 0,
        p.has_free_trial ? 1 : 0,
        p.trial_days,
        p.sort_order,
      ].join(":")
    )
    .sort();

  const pricing = [...(input.pricing || [])]
    .map((r) =>
      [
        r.plan_id,
        r.monthly_price,
        r.yearly_price,
        r.lifetime_price,
        r.display_price,
        r.original_price,
        r.discount_percentage,
        r.launch_price,
        (r.feature_groups || []).length,
      ].join(":")
    )
    .sort();

  const comparisonRows = [...(input.comparison?.comparison || [])]
    .map((row) => {
      const limits = row.limits || {};
      return [
        row.plan?.id,
        row.plan?.slug,
        JSON.stringify(row.comparison_values || {}),
        JSON.stringify(limits),
        (row.modules || []).map((m) => m.code || m.id || m.name).join(","),
        (row.feature_packs || []).map((p) => p.code || p.id || p.name).join(","),
        (row.feature_groups || []).length,
      ].join(":");
    })
    .sort();

  const matrixGroups = (input.comparison?.feature_matrix?.groups || []).map(
    (g) => `${g.name}:${(g.rows || []).length}`
  );
  const dimensions = (input.comparison?.dimensions || []).map(
    (d) => `${d.key}:${d.label}`
  );

  return fnv1a(
    [
      plans.join("|"),
      pricing.join("|"),
      comparisonRows.join("|"),
      dimensions.join("|"),
      matrixGroups.join("|"),
      (input.comparison?.limit_keys || []).join(","),
    ].join("||")
  );
}

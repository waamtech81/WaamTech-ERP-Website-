/** Normalize License Engine commercial snapshot for portal Custom ERP surfaces. */

export type PortalCommercialSnapshot = {
  snapshot_id?: string | null;
  snapshot_version?: string | null;
  package_type?: string | null;
  package_mode?: string | null;
  industry?: unknown;
  category?: unknown;
  business_profile?: unknown;
  modules?: string[];
  feature_packs?: string[];
  effective_modules?: string[];
  selected_modules?: string[];
  dependency_modules?: string[];
  limits?: PortalSnapshotLimits;
  purchased_limits?: PortalSnapshotLimits;
  included_limits?: PortalSnapshotLimits;
  billing_cycle?: string | null;
  currency?: string | null;
  pricing?: Record<string, unknown> | null;
  /** When License Engine includes it — used for “Last license sync” display only. */
  generated_at?: string | null;
};

export type PortalSnapshotLimits = {
  users?: number | null;
  companies?: number | null;
  branches?: number | null;
  warehouses?: number | null;
  storage?: number | null;
  api?: number | null;
};

function num(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function moduleCodesFromValue(value: unknown): string[] {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  return list
    .map((item) => {
      if (typeof item === "string" || typeof item === "number") return String(item).trim();
      if (item && typeof item === "object") {
        const row = item as Record<string, unknown>;
        return String(row.code || row.id || row.module_id || row.slug || "").trim();
      }
      return "";
    })
    .filter(Boolean);
}

export function normalizeSnapshotLimits(raw?: Record<string, unknown> | null): PortalSnapshotLimits {
  if (!raw || typeof raw !== "object") return {};
  return {
    users: num(raw.users ?? raw.user_limit ?? raw.max_users),
    companies: num(raw.companies ?? raw.company_limit ?? raw.max_companies),
    branches: num(raw.branches ?? raw.branch_limit ?? raw.max_branches),
    warehouses: num(raw.warehouses ?? raw.warehouse_limit ?? raw.max_warehouses),
    storage: num(raw.storage ?? raw.storage_limit ?? raw.max_storage_gb),
    api: num(raw.api ?? raw.api_limit ?? raw.max_api_calls),
  };
}

export function normalizePortalCommercialSnapshot(
  company: Record<string, unknown> | null | undefined
): PortalCommercialSnapshot | null {
  const commercial = company?.commercial;
  if (!commercial || typeof commercial !== "object") return null;
  const c = commercial as Record<string, unknown>;

  const modules = moduleCodesFromValue(c.modules);
  const effective = moduleCodesFromValue(c.effective_modules);
  const selected = moduleCodesFromValue(c.selected_modules);
  const dependency = moduleCodesFromValue(c.dependency_modules);
  const featurePacks = moduleCodesFromValue(c.feature_packs);

  const limits = normalizeSnapshotLimits(c.limits as Record<string, unknown> | undefined);
  const purchased = normalizeSnapshotLimits(
    (c.purchased_limits as Record<string, unknown> | undefined) ||
      (c.pricing as Record<string, unknown> | undefined)?.purchased_limits as
        | Record<string, unknown>
        | undefined
  );
  const included = normalizeSnapshotLimits(
    (c.included_limits as Record<string, unknown> | undefined) ||
      (c.pricing as Record<string, unknown> | undefined)?.included_limits as
        | Record<string, unknown>
        | undefined
  );
  const topLevelPurchased = normalizeSnapshotLimits({
    users: c.user_limit,
    companies: c.company_limit,
    branches: c.branch_limit,
    warehouses: c.warehouse_limit,
  });

  const billing = (c.billing || {}) as Record<string, unknown>;
  const subscription = (c.subscription || {}) as Record<string, unknown>;

  return {
    snapshot_id: (c.snapshot_id as string | undefined) ?? null,
    snapshot_version: (c.snapshot_version as string | undefined) ?? null,
    package_type: (c.package_type as string | undefined) ?? null,
    package_mode: (c.package_mode as string | undefined) ?? null,
    industry: c.industry ?? null,
    category: c.category ?? null,
    business_profile: c.business_profile ?? null,
    modules: modules.length ? modules : effective.length ? effective : selected,
    feature_packs: featurePacks,
    effective_modules: effective.length ? effective : undefined,
    selected_modules: selected.length ? selected : undefined,
    dependency_modules: dependency.length ? dependency : undefined,
    limits: Object.keys(limits).length ? limits : undefined,
    purchased_limits: Object.keys(purchased).length
      ? purchased
      : Object.keys(topLevelPurchased).length
        ? topLevelPurchased
        : undefined,
    included_limits: Object.keys(included).length ? included : undefined,
    billing_cycle:
      (billing.billing_cycle as string | undefined) ||
      (subscription.billing_cycle as string | undefined) ||
      null,
    currency: (billing.currency as string | undefined) ?? null,
    pricing: (c.pricing as Record<string, unknown> | undefined) ?? null,
    generated_at: (() => {
      for (const key of ["created_at", "updated_at", "generated_at"] as const) {
        const v = c[key];
        if (typeof v === "string" && v.trim()) return v;
      }
      return null;
    })(),
  };
}

/** Purchased / merged tenant limits from snapshot SSOT — never plan baseline alone. */
export function resolvePurchasedLimits(
  snapshot: PortalCommercialSnapshot | null | undefined,
  licenseLimits?: PortalSnapshotLimits | null
): PortalSnapshotLimits {
  return resolvePortalTenantLimits(snapshot, licenseLimits);
}

/**
 * Merged tenant caps for portal display.
 * Priority: purchased_limits → merged limits → included → license.
 */
export function resolvePortalTenantLimits(
  snapshot: PortalCommercialSnapshot | null | undefined,
  licenseLimits?: PortalSnapshotLimits | null
): PortalSnapshotLimits {
  const merged = normalizeSnapshotLimits(snapshot?.limits as Record<string, unknown> | undefined);
  const purchased = normalizeSnapshotLimits(
    snapshot?.purchased_limits as Record<string, unknown> | undefined
  );
  const included = normalizeSnapshotLimits(
    snapshot?.included_limits as Record<string, unknown> | undefined
  );
  const fromLicense = normalizeSnapshotLimits(licenseLimits as Record<string, unknown> | undefined);

  const pick = (...values: Array<number | null | undefined>): number | null => {
    for (const v of values) {
      if (v != null && Number.isFinite(v) && v > 0) return v;
    }
    for (const v of values) {
      if (v != null && Number.isFinite(v)) return v;
    }
    return null;
  };

  return {
    users: pick(purchased.users, merged.users, included.users, fromLicense.users),
    companies: pick(purchased.companies, merged.companies, included.companies, fromLicense.companies),
    branches: pick(purchased.branches, merged.branches, included.branches, fromLicense.branches),
    warehouses: pick(
      purchased.warehouses,
      merged.warehouses,
      included.warehouses,
      fromLicense.warehouses
    ),
    storage: pick(purchased.storage, merged.storage, included.storage, fromLicense.storage),
    api: pick(purchased.api, merged.api, included.api, fromLicense.api),
  };
}

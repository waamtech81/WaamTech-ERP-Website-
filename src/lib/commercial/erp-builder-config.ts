/**
 * Custom ERP Builder helpers — presentation + catalog matching only.
 * Industry/Category SSOT remains License Engine public registries.
 * Recommended modules prefer License Engine category defaults
 * (`category-recommended-modules.json`); marketing profiles are fallback only.
 */
import { industriesServing, type IndustryProfile } from "@/lib/data/industries";
import { legacyProfileMap } from "@/lib/data/business-hierarchy";
import {
  moduleByCodeMap,
  resolveRequiredDependencies,
  slugifyLabel,
} from "@/lib/commercial/module-builder";
import type {
  BillingCycle,
  CatalogBusinessCategory,
  CatalogComparisonBundle,
  CatalogModule,
  CatalogPlanLimits,
  PublicCommercialOverview,
} from "@/lib/commercial/types";
import type { PricingPlan } from "@/types";
import categoryRecommendedModules from "@/lib/commercial/category-recommended-modules.json";

export type BuilderStepId =
  | "industry"
  | "category"
  | "recommended"
  | "modules"
  | "feature-packs"
  | "tenant"
  | "billing"
  | "review";

export const BUILDER_STEPS: { id: BuilderStepId; label: string }[] = [
  { id: "industry", label: "Industry" },
  { id: "category", label: "Category" },
  { id: "recommended", label: "Recommended" },
  { id: "modules", label: "Modules" },
  { id: "feature-packs", label: "Feature packs" },
  { id: "tenant", label: "Tenant limits" },
  { id: "billing", label: "Billing" },
  { id: "review", label: "Summary" },
];

export type BuilderFeaturePack = {
  code: string;
  name: string;
  description: string;
  required: boolean;
  monthly_price: number;
  yearly_price: number;
  lifetime_price: number;
};

export type BuilderTenantLimits = {
  users: number;
  companies: number;
  branches: number;
  warehouses: number;
};

export type BuilderTenantUnitPrices = {
  users: { monthly: number; yearly: number; lifetime: number; included: number };
  companies: { monthly: number; yearly: number; lifetime: number; included: number };
  branches: { monthly: number; yearly: number; lifetime: number; included: number };
  warehouses: { monthly: number; yearly: number; lifetime: number; included: number };
};

export const DEFAULT_TENANT_LIMITS: BuilderTenantLimits = {
  users: 1,
  companies: 1,
  branches: 1,
  warehouses: 1,
};

const NAME_ALIASES: Record<string, string> = {
  purchasing: "procurement",
  purchase: "procurement",
  warehouse: "wms",
  "warehouse management": "wms",
  documents: "documents",
  service: "service",
  projects: "projects",
  assets: "assets",
  hr: "hr",
  wms: "wms",
  pos: "pos",
  inventory: "inventory",
  manufacturing: "manufacturing",
  finance: "finance",
  crm: "crm",
  sales: "sales",
  procurement: "procurement",
};

function normKey(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_");
}

/** Match Engine category → marketing IndustryProfile for recommendations. */
export function matchCategoryProfile(
  category: Pick<CatalogBusinessCategory, "code" | "slug" | "name" | "id"> | null | undefined
): IndustryProfile | null {
  if (!category) return null;
  const keys = [category.slug, category.code, category.id, category.name]
    .map((v) => normKey(String(v || "")))
    .filter(Boolean);
  const aliased = keys.map((k) => normKey(legacyProfileMap[k] || k));
  const all = [...new Set([...keys, ...aliased])];

  for (const key of all) {
    const hit = industriesServing.find(
      (p) =>
        normKey(p.id) === key ||
        normKey(p.name) === key ||
        slugifyLabel(p.name).replace(/-/g, "_") === key
    );
    if (hit) return hit;
  }

  // Loose: profile id contained in category slug or vice versa
  for (const profile of industriesServing) {
    const pid = normKey(profile.id);
    if (all.some((k) => k.includes(pid) || pid.includes(k))) return profile;
  }
  return null;
}

/** Map display module names / codes onto live catalog module codes. */
export function resolveModuleCodesFromLabels(
  labels: string[],
  modules: CatalogModule[]
): string[] {
  const byCode = moduleByCodeMap(modules);
  const out: string[] = [];
  const seen = new Set<string>();

  for (const label of labels) {
    const raw = String(label || "").trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    const aliased = NAME_ALIASES[key] || NAME_ALIASES[normKey(raw)] || key;
    const candidates = [raw, key, aliased, slugifyLabel(raw), normKey(raw)];
    let found: CatalogModule | undefined;
    for (const c of candidates) {
      found = byCode.get(c) || byCode.get(c.toLowerCase());
      if (found) break;
    }
    if (!found) {
      found = modules.find(
        (m) =>
          m.name.toLowerCase() === key ||
          m.name.toLowerCase().includes(key) ||
          key.includes(m.name.toLowerCase())
      );
    }
    if (!found || seen.has(found.code)) continue;
    seen.add(found.code);
    out.push(found.code);
  }
  return out;
}

export function resolveCategoryRequiredModuleCodes(
  category: CatalogBusinessCategory | null | undefined,
  modules: CatalogModule[]
): string[] {
  if (!category) return [];
  const posMode = String(category.pos_requirement || category.pos_mode || "")
    .trim()
    .toLowerCase();
  if (posMode !== "required") return [];
  return resolveModuleCodesFromLabels(["POS", "pos"], modules);
}

export type CategoryRecommendation = {
  profile: IndustryProfile | null;
  recommended_modules: string[];
  required_modules: string[];
  feature_packs: BuilderFeaturePack[];
};

function resolveEngineCategoryRecommendedCodes(
  category: CatalogBusinessCategory | null | undefined,
  modules: CatalogModule[]
): string[] {
  if (!category) return [];
  const table = (categoryRecommendedModules as { categories?: Record<string, string[]> })
    ?.categories || {};
  const keys = [category.code, category.slug, category.id]
    .map((v) => String(v || "").trim().toLowerCase().replace(/-/g, "_"))
    .filter(Boolean);
  for (const key of keys) {
    const list = table[key];
    if (Array.isArray(list) && list.length) {
      return resolveModuleCodesFromLabels(list, modules);
    }
  }
  return [];
}

export function buildCategoryRecommendation(
  category: CatalogBusinessCategory | null | undefined,
  modules: CatalogModule[]
): CategoryRecommendation {
  const profile = matchCategoryProfile(category);
  const recommendedFromEngine = resolveEngineCategoryRecommendedCodes(category, modules);
  const recommendedFromProfile = resolveModuleCodesFromLabels(
    profile?.modules || [],
    modules
  );
  // License Engine category defaults first; marketing profile is fallback only.
  const recommendedBase = recommendedFromEngine.length
    ? recommendedFromEngine
    : recommendedFromProfile;
  const categoryRequired = resolveCategoryRequiredModuleCodes(category, modules);
  // Lock category-required modules and their dependency tree (even if also recommended).
  const categoryDeps = resolveRequiredDependencies(categoryRequired, modules);
  const required_modules = Array.from(
    new Set([...categoryRequired, ...categoryDeps])
  );
  const recommended_modules = recommendedBase.filter(
    (c) => !required_modules.includes(c)
  );

  const posRequired =
    String(category?.pos_requirement || category?.pos_mode || "")
      .trim()
      .toLowerCase() === "required";

  const feature_packs: BuilderFeaturePack[] = (profile?.featurePacks || []).map(
    (name) => {
      const code = slugifyLabel(name);
      const required =
        posRequired && /^(barcode|discount|promo)$/i.test(code.replace(/-/g, ""));
      return {
        code,
        name,
        description: `${name} capabilities for ${profile?.name || "this business type"}.`,
        required,
        // Feature packs are configuration labels until Engine publishes priced packs.
        monthly_price: 0,
        yearly_price: 0,
        lifetime_price: 0,
      };
    }
  );

  return {
    profile,
    recommended_modules,
    required_modules,
    feature_packs,
  };
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function cycleTriple(unit: number): { monthly: number; yearly: number; lifetime: number } {
  // Catalog only exposes a single extra-unit rate (typically monthly). Reuse it
  // for all cycles — do not invent conversion multipliers.
  const u = Math.max(0, unit);
  return { monthly: u, yearly: u, lifetime: u };
}

function pickBusinessPlan(plans: PricingPlan[]): PricingPlan | null {
  if (!plans.length) return null;
  const byName = plans.find((p) => /business/i.test(`${p.id || ""} ${p.name || ""}`));
  if (byName) return byName;
  const recommended = plans.find((p) => p.recommended || p.popular);
  return recommended || plans[0] || null;
}

function limitsFromComparison(
  planId: string | undefined,
  comparison: CatalogComparisonBundle | null | undefined
): CatalogPlanLimits | null {
  if (!planId || !comparison?.comparison?.length) return null;
  const row = comparison.comparison.find((r) => r.plan?.id === planId);
  return row?.limits || null;
}

/** Unit prices + included baselines from existing plan / comparison catalog. */
export function resolveTenantUnitPrices(
  pricingPlans: PricingPlan[],
  comparison?: CatalogComparisonBundle | null
): BuilderTenantUnitPrices {
  const plan = pickBusinessPlan(pricingPlans);
  const limits = limitsFromComparison(plan?.id, comparison);

  const includedUsers =
    typeof plan?.usersIncluded === "number" && plan.usersIncluded > 0
      ? plan.usersIncluded
      : num(limits?.max_users, DEFAULT_TENANT_LIMITS.users) || DEFAULT_TENANT_LIMITS.users;

  const includedBranches =
    num(limits?.max_branches, DEFAULT_TENANT_LIMITS.branches) ||
    DEFAULT_TENANT_LIMITS.branches;
  const includedWarehouses =
    num(limits?.max_warehouses, DEFAULT_TENANT_LIMITS.warehouses) ||
    DEFAULT_TENANT_LIMITS.warehouses;
  const includedCompanies =
    num(
      limits && "max_companies" in limits ? limits.max_companies : undefined,
      DEFAULT_TENANT_LIMITS.companies
    ) || DEFAULT_TENANT_LIMITS.companies;

  const userUnit = num(plan?.extraUserPrice ?? limits?.extra_user_price, 0);
  const companyUnit = num(
    limits && "extra_company_price" in limits ? limits.extra_company_price : undefined,
    0
  );
  const branchUnit = num(
    limits && "extra_branch_price" in limits ? limits.extra_branch_price : undefined,
    0
  );
  const warehouseUnit = num(
    limits && "extra_warehouse_price" in limits
      ? limits.extra_warehouse_price
      : undefined,
    0
  );

  return {
    users: { ...cycleTriple(userUnit), included: Math.max(1, includedUsers) },
    companies: {
      ...cycleTriple(companyUnit),
      included: Math.max(1, includedCompanies),
    },
    branches: {
      ...cycleTriple(branchUnit),
      included: Math.max(1, includedBranches),
    },
    warehouses: {
      ...cycleTriple(warehouseUnit),
      included: Math.max(1, includedWarehouses),
    },
  };
}

/** License Engine GET /public/catalog/commercial — Custom Builder seat SSOT. */
export function resolveTenantUnitPricesFromCommercial(
  overview: PublicCommercialOverview | null | undefined
): BuilderTenantUnitPrices | null {
  if (!overview?.custom_builder?.unit_prices) return null;
  const u = overview.custom_builder.unit_prices;
  return {
    users: {
      monthly: num(u.users.monthly),
      yearly: num(u.users.yearly),
      lifetime: num(u.users.lifetime),
      included: Math.max(1, num(u.users.included, 1)),
    },
    companies: {
      monthly: num(u.companies.monthly),
      yearly: num(u.companies.yearly),
      lifetime: num(u.companies.lifetime),
      included: Math.max(1, num(u.companies.included, 1)),
    },
    branches: {
      monthly: num(u.branches.monthly),
      yearly: num(u.branches.yearly),
      lifetime: num(u.branches.lifetime),
      included: Math.max(1, num(u.branches.included, 1)),
    },
    warehouses: {
      monthly: num(u.warehouses.monthly),
      yearly: num(u.warehouses.yearly),
      lifetime: num(u.warehouses.lifetime),
      included: Math.max(1, num(u.warehouses.included, 1)),
    },
  };
}

export function defaultTenantLimitsFromCommercial(
  overview: PublicCommercialOverview | null | undefined
): BuilderTenantLimits {
  const included = overview?.custom_builder?.included_limits;
  if (!included) return { ...DEFAULT_TENANT_LIMITS };
  return {
    users: Math.max(1, num(included.users, 1)),
    companies: Math.max(1, num(included.companies, 1)),
    branches: Math.max(1, num(included.branches, 1)),
    warehouses: Math.max(1, num(included.warehouses, 1)),
  };
}

function normPackKey(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

/** Merge Product Catalog prices into Builder feature packs (never invent amounts). */
export function mergeFeaturePackCatalogPrices(
  packs: BuilderFeaturePack[],
  overview: PublicCommercialOverview | null | undefined
): BuilderFeaturePack[] {
  if (!packs.length) return packs;
  const catalog = overview?.feature_packs || [];
  const defaults = overview?.custom_builder?.feature_pack_default_unit;
  const byKey = new Map<string, (typeof catalog)[0]>();
  for (const row of catalog) {
    byKey.set(normPackKey(row.code), row);
    byKey.set(normPackKey(row.slug || ""), row);
    byKey.set(normPackKey(row.name), row);
  }

  return packs.map((pack) => {
    const match =
      byKey.get(normPackKey(pack.code)) ||
      byKey.get(normPackKey(pack.name)) ||
      null;
    const monthly =
      match?.monthly_price ??
      (match?.price_display?.monthly === "Included"
        ? 0
        : num(match?.price_display?.monthly, defaults?.monthly ?? 0));
    const yearly =
      match?.yearly_price ??
      (match?.price_display?.yearly === "Included"
        ? 0
        : num(match?.price_display?.yearly, defaults?.yearly ?? monthly));
    const lifetime =
      match?.lifetime_price ??
      (match?.price_display?.lifetime === "Included"
        ? 0
        : num(match?.price_display?.lifetime, defaults?.lifetime ?? monthly));
    const included =
      match?.is_included ||
      (monthly === 0 && yearly === 0 && lifetime === 0 && !match);
    return {
      ...pack,
      monthly_price: included ? 0 : monthly,
      yearly_price: included ? 0 : yearly,
      lifetime_price: included ? 0 : lifetime,
    };
  });
}

export function tenantOverageTotal(
  limits: BuilderTenantLimits,
  unitPrices: BuilderTenantUnitPrices,
  cycle: BillingCycle
): number {
  const priceKey =
    cycle === "yearly" ? "yearly" : cycle === "lifetime" ? "lifetime" : "monthly";
  const over = (count: number, included: number, unit: number) =>
    Math.max(0, count - included) * unit;
  return (
    over(limits.users, unitPrices.users.included, unitPrices.users[priceKey]) +
    over(
      limits.companies,
      unitPrices.companies.included,
      unitPrices.companies[priceKey]
    ) +
    over(limits.branches, unitPrices.branches.included, unitPrices.branches[priceKey]) +
    over(
      limits.warehouses,
      unitPrices.warehouses.included,
      unitPrices.warehouses[priceKey]
    )
  );
}

export function featurePackTotal(
  packs: BuilderFeaturePack[],
  selectedCodes: string[],
  cycle: BillingCycle
): number {
  const selected = new Set(selectedCodes);
  let total = 0;
  for (const pack of packs) {
    if (!selected.has(pack.code) && !pack.required) continue;
    if (cycle === "yearly") total += pack.yearly_price;
    else if (cycle === "lifetime") total += pack.lifetime_price;
    else total += pack.monthly_price;
  }
  return total;
}

export function clampTenantLimits(
  next: Partial<BuilderTenantLimits>,
  current: BuilderTenantLimits,
  unitPrices: BuilderTenantUnitPrices
): BuilderTenantLimits {
  const clamp = (value: number, min: number) =>
    Math.max(min, Math.min(500, Math.floor(Number(value) || min)));
  return {
    users: clamp(next.users ?? current.users, unitPrices.users.included),
    companies: clamp(next.companies ?? current.companies, unitPrices.companies.included),
    branches: clamp(next.branches ?? current.branches, unitPrices.branches.included),
    warehouses: clamp(
      next.warehouses ?? current.warehouses,
      unitPrices.warehouses.included
    ),
  };
}

export function stepIndex(step: BuilderStepId): number {
  return BUILDER_STEPS.findIndex((s) => s.id === step);
}

/**
 * Custom ERP Builder helpers — presentation + catalog matching only.
 * Industry/Category SSOT remains License Engine public registries.
 * Recommendations, required modules, and feature packs come from License Engine.
 */
import {
  moduleByCodeMap,
  resolveRequiredDependencies,
  slugifyLabel,
} from "@/lib/commercial/module-builder";
import type {
  BillingCycle,
  CatalogBuilderRecommendationPack,
  CatalogBuilderRecommendations,
  CatalogComparisonBundle,
  CatalogModule,
  CatalogPlanLimits,
  PublicCommercialFeaturePack,
  PublicCommercialOverview,
} from "@/lib/commercial/types";
import type { PricingPlan } from "@/types";

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
  { id: "category", label: "Business type" },
  { id: "recommended", label: "Recommended" },
  { id: "modules", label: "Customize" },
  { id: "feature-packs", label: "Feature packs" },
  { id: "tenant", label: "Limits" },
  { id: "billing", label: "Billing" },
  { id: "review", label: "Review" },
];

export type BuilderFeaturePack = {
  code: string;
  name: string;
  description: string;
  required: boolean;
  monthly_price: number;
  yearly_price: number;
  lifetime_price: number;
  required_module_codes?: string[];
  price_pending?: boolean;
  included?: boolean;
  disabled?: boolean;
  recommended?: boolean;
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
  users: 5,
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

export function normPackKey(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

export function isLegacyProvisioningPack(code: string): boolean {
  const c = String(code || "").trim();
  if (!c) return false;
  if (c === "CORE_ALL_MODULES") return true;
  return c.startsWith("BP_");
}

export function isBuilderRecommendationPack(code: string): boolean {
  const c = String(code || "").trim();
  return c === "CORE_OPS" || c.startsWith("BUILDER_");
}

function selectedModuleSet(codes: string[]): Set<string> {
  return new Set(codes.map((c) => String(c || "").trim().toLowerCase()).filter(Boolean));
}

export function featurePackMatchesSelectedModules(
  pack: { code: string; required_module_codes?: string[] | null },
  selected: Set<string>
): boolean {
  const code = String(pack.code || "").trim();
  if (code === "CORE_OPS") return true;
  const reqs = pack.required_module_codes || [];
  if (!reqs.length) return false;
  return reqs.some((r) => selected.has(String(r).toLowerCase()));
}

export function isPackExcludedFromBuilder(code: string): boolean {
  const c = String(code || "").trim();
  if (!c) return true;
  return isLegacyProvisioningPack(c);
}

/** Plan / trial / internal packs that must never appear on Custom ERP customer surfaces. */
export function isNonPurchasableCustomErpPack(
  code: string,
  name?: string | null
): boolean {
  if (isPackExcludedFromBuilder(code)) return true;
  const key = `${code || ""} ${name || ""}`.toLowerCase();
  if (!key.trim()) return true;
  if (
    /\b(trial|internal|system|hidden|default)\b/.test(key) ||
    /license\s*test|test\s*pack|all\s+erp\s+modules|all\s+core\s+modules/.test(key)
  ) {
    return true;
  }
  return false;
}

/** Modules that must not appear in Custom ERP purchase pickers. */
export function isNonPurchasableCustomErpModule(
  code: string,
  name?: string | null,
  status?: string | null,
  isPublic?: boolean | null
): boolean {
  if (isPublic === false) return true;
  const st = String(status || "active").trim().toLowerCase();
  if (st && !["active", "enabled", "published"].includes(st)) return true;
  const raw = String(code || "").trim();
  const key = `${raw} ${name || ""}`.toLowerCase();
  const codeKey = raw.toLowerCase();
  // Platform built-ins — included with every ERP SaaS subscription.
  if (
    codeKey === "whatsapp" ||
    codeKey === "support_system" ||
    codeKey === "chat" ||
    codeKey === "sup" ||
    /\b(whatsapp|support system|collaboration)\b/.test(key)
  ) {
    return true;
  }
  // Legacy License Engine seed aliases only (uppercase codes) — not SaaS Core runtime ids.
  if (
    /^(DASH|INV|CRM|FIN|POS|PROC|SALES|WH|HR|MFG|RPT|NTF|SET|FILE|API|SUP)$/.test(
      raw
    )
  ) {
    return true;
  }
  if (/^(dev_|test_|internal_|trial_)/.test(codeKey)) return true;
  if (/\b(trial[- ]?only|internal module|development module)\b/.test(key)) return true;
  return false;
}

/** Customer-facing module description — strips internal Engine seed wording. */
export function customerModuleDescription(
  description: string | null | undefined
): string | null {
  const raw = String(description || "").trim();
  if (!raw) return null;
  const cleaned = raw
    .replace(/\s*\(SaaS Core pack\)\s*/gi, " ")
    .replace(/\s*—?\s*SaaS Core pack\s*/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return cleaned || null;
}
/** Customer-facing included platform services (not in purchasable count). */
export const PLATFORM_BUILTIN_DISPLAY = [
  { code: "whatsapp", name: "WhatsApp" },
  { code: "support_system", name: "Support System" },
] as const;

export function isPlatformBuiltinModule(code: string | null | undefined): boolean {
  const c = String(code || "").trim().toLowerCase();
  return c === "whatsapp" || c === "support_system" || c === "chat";
}

export function resolveBuilderRecommendationPackRows(
  rec: CatalogBuilderRecommendations | null | undefined
): CatalogBuilderRecommendationPack[] {
  if (!rec) return [];
  if (rec.recommended_feature_pack_details?.length) {
    return rec.recommended_feature_pack_details;
  }
  return (rec.recommended_feature_packs || []).map((item) => {
    if (typeof item === "string") {
      return { code: item, name: item };
    }
    return item;
  });
}

export function mapBuilderRecommendations(
  rec: CatalogBuilderRecommendations,
  modules: CatalogModule[],
  _overview?: PublicCommercialOverview | null
): { required_modules: string[]; recommended_modules: string[] } {
  const requiredRaw = resolveModuleCodesFromLabels(rec.required_modules || [], modules);
  const recommendedRaw = resolveModuleCodesFromLabels(
    rec.recommended_modules || [],
    modules
  );
  const deps = resolveRequiredDependencies(requiredRaw, modules);
  const required_modules = Array.from(new Set([...requiredRaw, ...deps]));
  const recommended_modules = recommendedRaw.filter((c) => !required_modules.includes(c));
  return { required_modules, recommended_modules };
}

export function resolveBuilderEligiblePackCodes(
  rec: CatalogBuilderRecommendations,
  _overview: PublicCommercialOverview | null | undefined,
  _modules: CatalogModule[],
  selectedModuleCodes: string[]
): string[] {
  const selected = selectedModuleSet(selectedModuleCodes);
  return resolveBuilderRecommendationPackRows(rec)
    .filter((row) => featurePackMatchesSelectedModules(row, selected))
    .map((row) => row.code);
}

function packPriceFromRow(
  row: CatalogBuilderRecommendationPack | PublicCommercialFeaturePack | null | undefined,
  cycle: "monthly" | "yearly" | "lifetime",
  fallback = 0
): number {
  if (!row) return fallback;
  const direct =
    cycle === "yearly"
      ? row.yearly_price
      : cycle === "lifetime"
        ? row.lifetime_price
        : row.monthly_price;
  if (direct != null && Number.isFinite(Number(direct))) return num(direct, fallback);
  const display = row.price_display?.[cycle];
  if (display === "Included") return 0;
  if (display != null && Number.isFinite(Number(display))) return num(display, fallback);
  return fallback;
}

function packRowToBuilderFeaturePack(
  recRow: CatalogBuilderRecommendationPack | null | undefined,
  catalogRow: PublicCommercialFeaturePack | null | undefined,
  recommended: boolean
): BuilderFeaturePack {
  const code = recRow?.code || catalogRow?.code || "";
  const name = recRow?.name || catalogRow?.name || code;
  const description =
    recRow?.description ||
    catalogRow?.description ||
    `${name} capabilities for your configuration.`;
  const required_module_codes =
    recRow?.required_module_codes ||
    catalogRow?.required_module_codes ||
    null;
  const monthly = packPriceFromRow(recRow, "monthly", packPriceFromRow(catalogRow, "monthly", 0));
  const yearly = packPriceFromRow(recRow, "yearly", packPriceFromRow(catalogRow, "yearly", monthly));
  const lifetime = packPriceFromRow(
    recRow,
    "lifetime",
    packPriceFromRow(catalogRow, "lifetime", monthly)
  );
  const included =
    Boolean(recRow?.is_included || catalogRow?.is_included) ||
    (monthly === 0 && yearly === 0 && lifetime === 0 && Boolean(catalogRow || recRow));
  const posLocked =
    /^(barcode|discount|promo)$/i.test(code.replace(/-/g, "")) && Boolean(recRow || catalogRow);

  return {
    code,
    name,
    description,
    required: posLocked,
    monthly_price: included ? 0 : monthly,
    yearly_price: included ? 0 : yearly,
    lifetime_price: included ? 0 : lifetime,
    required_module_codes: required_module_codes || undefined,
    included,
    price_pending: !catalogRow && !recRow?.monthly_price && !recRow?.yearly_price,
    disabled: false,
    recommended,
  };
}

export function buildBuilderFeaturePacksForConfiguration(
  rec: CatalogBuilderRecommendations,
  overview: PublicCommercialOverview | null | undefined,
  _modules: CatalogModule[],
  _selectedModuleCodes: string[]
): BuilderFeaturePack[] {
  const recRows = resolveBuilderRecommendationPackRows(rec);
  const recByKey = new Map(recRows.map((row) => [normPackKey(row.code), row]));
  const recKeys = new Set(recRows.map((row) => normPackKey(row.code)));
  const catalog = overview?.feature_packs || [];
  const catalogByKey = new Map(catalog.map((row) => [normPackKey(row.code), row]));

  const codes = new Set<string>();
  for (const row of recRows) codes.add(row.code);
  // Include full Product Catalog packs (Custom ERP) — not only BUILDER_* rows.
  // Recommended packs stay marked via recKeys; the rest appear as optional add-ons.
  for (const row of catalog) {
    if (isPackExcludedFromBuilder(row.code)) continue;
    if (isNonPurchasableCustomErpPack(row.code, row.name)) continue;
    codes.add(row.code);
  }

  const packs: BuilderFeaturePack[] = [];
  for (const code of codes) {
    const key = normPackKey(code);
    packs.push(
      packRowToBuilderFeaturePack(
        recByKey.get(key) || null,
        catalogByKey.get(key) || null,
        recKeys.has(key)
      )
    );
  }
  return packs.sort((a, b) => a.name.localeCompare(b.name));
}

export function filterFeaturePacksForBuilder(
  packs: BuilderFeaturePack[],
  opts: {
    recommendedPackCodes: string[];
    selectedModuleCodes: string[];
    modules: CatalogModule[];
    commercialOverview?: PublicCommercialOverview | null;
  }
): BuilderFeaturePack[] {
  // Show all purchasable packs after modules (recommended + optional catalog).
  // Do not restrict the list to recommendation-eligible codes only.
  void opts.recommendedPackCodes;
  void opts.selectedModuleCodes;
  void opts.modules;
  void opts.commercialOverview;
  return packs.filter((pack) => {
    if (isPackExcludedFromBuilder(pack.code)) return false;
    if (isNonPurchasableCustomErpPack(pack.code, pack.name)) return false;
    return true;
  });
}

export function filterRecommendedFeaturePacks(
  packs: BuilderFeaturePack[],
  recommendationPackCodes: string[]
): BuilderFeaturePack[] {
  const keys = new Set(recommendationPackCodes.map(normPackKey));
  return packs.filter((pack) => keys.has(normPackKey(pack.code)));
}

export function initialSelectedFeaturePackCodes(visible: BuilderFeaturePack[]): string[] {
  const out: string[] = [];
  for (const pack of visible) {
    if (pack.required || pack.recommended) out.push(pack.code);
  }
  return Array.from(new Set(out));
}

export function isFeaturePackLocked(pack: BuilderFeaturePack): boolean {
  return Boolean(pack.required);
}

export function resolveRecommendedConfigurationPackTags(
  rec: CatalogBuilderRecommendations | null,
  featurePacks: BuilderFeaturePack[],
  _overview?: PublicCommercialOverview | null
): Array<{ code: string; name: string }> {
  if (!rec) return [];
  const byKey = new Map(featurePacks.map((pack) => [normPackKey(pack.code), pack]));
  return resolveBuilderRecommendationPackRows(rec).map((row) => {
    const match = byKey.get(normPackKey(row.code));
    return { code: row.code, name: match?.name || row.name || row.code };
  });
}

export function prepareFeaturePackCodesForQuote(
  selected: string[],
  rec: CatalogBuilderRecommendations | null | undefined,
  _overview?: PublicCommercialOverview | null
): string[] {
  const codes = selected.filter(Boolean);
  if (!codes.length) return codes;

  const recCodes = resolveBuilderRecommendationPackRows(rec).map((row) => row.code);
  const hasBuilderPacks = [...codes, ...recCodes].some(isBuilderRecommendationPack);
  if (!hasBuilderPacks) return codes;

  return codes.filter((code) => !isLegacyProvisioningPack(code));
}

export function parseInvalidFeaturePackCodes(message: string): Set<string> {
  const keys = new Set<string>();
  const patterns = [
    /feature\s*pack[s]?\s*[:\s]+['"]?([A-Za-z0-9_-]+)/gi,
    /unknown\s+feature\s+pack\s+['"]?([A-Za-z0-9_-]+)/gi,
    /invalid\s+feature\s+pack\s+['"]?([A-Za-z0-9_-]+)/gi,
  ];
  for (const re of patterns) {
    let match: RegExpExecArray | null = re.exec(message);
    while (match) {
      keys.add(normPackKey(match[1]));
      match = re.exec(message);
    }
  }
  return keys;
}

export function pruneSelectedFeaturePackCodes(
  selected: string[],
  visiblePacks: BuilderFeaturePack[]
): string[] {
  const visible = new Set(visiblePacks.map((pack) => normPackKey(pack.code)));
  return selected.filter((code) => visible.has(normPackKey(code)));
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

/** Merge Product Catalog prices into Builder feature packs (never invent amounts). */
export function mergeFeaturePackCatalogPrices(
  packs: BuilderFeaturePack[],
  overview: PublicCommercialOverview | null | undefined
): BuilderFeaturePack[] {
  if (!packs.length) return packs;
  const catalog = overview?.feature_packs || [];
  const defaults = overview?.custom_builder?.feature_pack_default_unit;
  const byKey = new Map<string, PublicCommercialFeaturePack>();
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
        : num(match?.price_display?.monthly, defaults?.monthly ?? pack.monthly_price));
    const yearly =
      match?.yearly_price ??
      (match?.price_display?.yearly === "Included"
        ? 0
        : num(match?.price_display?.yearly, defaults?.yearly ?? pack.yearly_price));
    const lifetime =
      match?.lifetime_price ??
      (match?.price_display?.lifetime === "Included"
        ? 0
        : num(match?.price_display?.lifetime, defaults?.lifetime ?? pack.lifetime_price));
    const included =
      match?.is_included ||
      pack.included ||
      (monthly === 0 && yearly === 0 && lifetime === 0 && !match);
    return {
      ...pack,
      required_module_codes:
        pack.required_module_codes || match?.required_module_codes || undefined,
      monthly_price: included ? 0 : monthly,
      yearly_price: included ? 0 : yearly,
      lifetime_price: included ? 0 : lifetime,
      included,
      price_pending: false,
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

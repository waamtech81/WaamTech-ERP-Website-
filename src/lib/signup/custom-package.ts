import type { BillingCycle } from "@/lib/commercial/types";

export const CUSTOM_PACKAGE_SESSION_KEY = "waamto-custom-erp-package:v1";

export type SignupPackageType = "predefined" | "custom";

/** Client-carried package snapshot (display + handoff). Server re-validates modules/prices. */
export type CustomErpPackageMoneyBreakdown = {
  subtotal: number;
  discount_code?: string | null;
  discount_amount?: number;
  tax_amount?: number;
  tax_label?: string | null;
  grand_total: number;
};

/** Optional tenant sizing carried from the Custom ERP Builder (display / handoff). */
export type CustomErpTenantLimits = {
  users: number;
  companies: number;
  branches: number;
  warehouses: number;
};

export type CustomErpFeaturePackSelection = {
  code: string;
  name: string;
  required?: boolean;
  monthly_price?: number;
  yearly_price?: number;
  lifetime_price?: number;
};

export type CustomErpBundleRecommendation = {
  matched_plan_id: string | null;
  matched_plan_name: string | null;
  matched_plan_slug: string | null;
  matched_plan_price: number;
  custom_price: number;
  bundle_savings: number;
  bundle_percentage: number;
  match_score: number;
  exact_match?: boolean;
  close_match?: boolean;
  show_bundle_offer?: boolean;
  message?: string | null;
};

export type CustomErpPackagePayload = {
  package_type: "custom";
  selected_modules: string[];
  dependency_modules: string[];
  recommended_modules: string[];
  billing_cycle: BillingCycle;
  monthly_price: number;
  yearly_price: number;
  lifetime_price: number;
  estimated_total: number;
  selected_module_count: number;
  /** Display labels keyed by module code */
  module_labels?: Record<string, string>;
  product_slug?: string;
  /** Coupon applied from License Engine commercial_discounts */
  discount_code?: string | null;
  /** Engine quote money lines for the selected cycle (tax/coupon when present). */
  money?: CustomErpPackageMoneyBreakdown | null;
  /** Builder industry / category context (Website handoff only this phase). */
  industry_id?: string | null;
  industry_name?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  feature_packs?: CustomErpFeaturePackSelection[];
  tenant_limits?: CustomErpTenantLimits | null;
  /** Add-ons estimated from catalog plan rates (users/companies/branches/warehouses). */
  tenant_addon_total?: number;
  feature_pack_total?: number;
  /** Support tier from License Engine plan/commercial snapshot. */
  support_plan?: string | null;
  /** Bundle recommendation from live quote (handoff only — never auto-switch). */
  bundle_recommendation?: CustomErpBundleRecommendation | null;
};

export function estimatedTotalForCycle(
  payload: Pick<
    CustomErpPackagePayload,
    "billing_cycle" | "monthly_price" | "yearly_price" | "lifetime_price" | "money"
  >
): number {
  if (payload.money && Number.isFinite(payload.money.grand_total)) {
    return Number(payload.money.grand_total) || 0;
  }
  if (payload.billing_cycle === "yearly") return payload.yearly_price;
  if (payload.billing_cycle === "lifetime") return payload.lifetime_price;
  return payload.monthly_price;
}

/** Normalize License Engine quote pricing into the signup handoff money shape. */
export function moneyFromEnginePricing(pricing: {
  subtotal?: number;
  selected_total?: number;
  discount_code?: string | null;
  discount_amount?: number;
  tax_amount?: number;
  taxes?: Array<{ name?: string; code?: string; rate?: number; amount?: number }>;
  grand_total?: number;
} | null | undefined): CustomErpPackageMoneyBreakdown | null {
  if (!pricing) return null;
  const taxLine = pricing.taxes?.[0];
  const taxLabel = taxLine
    ? `${taxLine.name || taxLine.code || "Tax"}${taxLine.rate ? ` (${taxLine.rate}%)` : ""}`
    : pricing.tax_amount
      ? "Tax"
      : null;
  const subtotal = Number(pricing.subtotal ?? pricing.selected_total) || 0;
  const grand = Number(pricing.grand_total ?? subtotal) || 0;
  return {
    subtotal,
    discount_code: pricing.discount_code ?? null,
    discount_amount: Number(pricing.discount_amount) || 0,
    tax_amount: Number(pricing.tax_amount) || 0,
    tax_label: taxLabel,
    grand_total: grand,
  };
}

export function couponAppliedInPricing(pricing: {
  discount_code?: string | null;
  discount_amount?: number;
} | null | undefined): boolean {
  if (!pricing) return false;
  return Boolean(pricing.discount_code) || Number(pricing.discount_amount) > 0;
}

export function buildCustomErpPackagePayload(input: {
  selected_modules: string[];
  dependency_modules: string[];
  recommended_modules: string[];
  billing_cycle: BillingCycle;
  monthly_price: number;
  yearly_price: number;
  lifetime_price: number;
  module_labels?: Record<string, string>;
  product_slug?: string;
  discount_code?: string | null;
  money?: CustomErpPackageMoneyBreakdown | null;
  industry_id?: string | null;
  industry_name?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  feature_packs?: CustomErpFeaturePackSelection[];
  tenant_limits?: CustomErpTenantLimits | null;
  tenant_addon_total?: number;
  feature_pack_total?: number;
  support_plan?: string | null;
  bundle_recommendation?: CustomErpBundleRecommendation | null;
}): CustomErpPackagePayload {
  const selected_module_count = new Set([
    ...input.selected_modules,
    ...input.dependency_modules,
  ]).size;
  const tenantAddon = Number(input.tenant_addon_total) || 0;
  const featurePackTotal = Number(input.feature_pack_total) || 0;
  const base = {
    package_type: "custom" as const,
    selected_modules: [...input.selected_modules],
    dependency_modules: [...input.dependency_modules],
    recommended_modules: [...input.recommended_modules],
    billing_cycle: input.billing_cycle,
    monthly_price: input.monthly_price,
    yearly_price: input.yearly_price,
    lifetime_price: input.lifetime_price,
    selected_module_count,
    module_labels: input.module_labels,
    product_slug: input.product_slug || "waamto-erp",
    discount_code: input.discount_code ?? null,
    money: input.money ?? null,
    industry_id: input.industry_id ?? null,
    industry_name: input.industry_name ?? null,
    category_id: input.category_id ?? null,
    category_name: input.category_name ?? null,
    feature_packs: Array.isArray(input.feature_packs) ? [...input.feature_packs] : [],
    tenant_limits: input.tenant_limits ?? null,
    tenant_addon_total: tenantAddon,
    feature_pack_total: featurePackTotal,
    support_plan: input.support_plan ?? null,
    bundle_recommendation: input.bundle_recommendation ?? null,
    estimated_total: 0,
  };
  // Engine money.grand_total is SSOT (modules + seats + packs + tax − discount).
  const estimated_total =
    input.money?.grand_total != null
      ? Number(input.money.grand_total) || 0
      : estimatedTotalForCycle(base) + tenantAddon + featurePackTotal;
  return {
    ...base,
    estimated_total,
  };
}

export function saveCustomErpPackage(payload: CustomErpPackagePayload): void {
  try {
    window.sessionStorage.setItem(CUSTOM_PACKAGE_SESSION_KEY, JSON.stringify(payload));
  } catch {
    // Privacy mode / quota — signup can still use in-memory navigation state via query.
  }
}

export function loadCustomErpPackage(): CustomErpPackagePayload | null {
  try {
    const raw = window.sessionStorage.getItem(CUSTOM_PACKAGE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CustomErpPackagePayload;
    if (!parsed || parsed.package_type !== "custom") return null;
    if (!Array.isArray(parsed.selected_modules) || !parsed.selected_modules.length) {
      return null;
    }
    if (
      parsed.billing_cycle !== "monthly" &&
      parsed.billing_cycle !== "yearly" &&
      parsed.billing_cycle !== "lifetime"
    ) {
      return null;
    }
    const tenantAddon = Number(parsed.tenant_addon_total) || 0;
    const featurePackTotal = Number(parsed.feature_pack_total) || 0;
    const normalized: CustomErpPackagePayload = {
      ...parsed,
      dependency_modules: Array.isArray(parsed.dependency_modules)
        ? parsed.dependency_modules
        : [],
      recommended_modules: Array.isArray(parsed.recommended_modules)
        ? parsed.recommended_modules
        : [],
      discount_code: parsed.discount_code ?? parsed.money?.discount_code ?? null,
      money: parsed.money ?? null,
      product_slug: parsed.product_slug || "waamto-erp",
      industry_id: parsed.industry_id ?? null,
      industry_name: parsed.industry_name ?? null,
      category_id: parsed.category_id ?? null,
      category_name: parsed.category_name ?? null,
      feature_packs: Array.isArray(parsed.feature_packs) ? parsed.feature_packs : [],
      tenant_limits: parsed.tenant_limits ?? null,
      tenant_addon_total: tenantAddon,
      feature_pack_total: featurePackTotal,
      support_plan: parsed.support_plan ?? null,
      bundle_recommendation: parsed.bundle_recommendation ?? null,
      estimated_total: 0,
    };
    const estimated_total =
      normalized.money?.grand_total != null
        ? Number(normalized.money.grand_total) || 0
        : estimatedTotalForCycle(normalized) + tenantAddon + featurePackTotal;
    return {
      ...normalized,
      estimated_total,
    };
  } catch {
    return null;
  }
}

export function clearCustomErpPackage(): void {
  try {
    window.sessionStorage.removeItem(CUSTOM_PACKAGE_SESSION_KEY);
  } catch {
    // ignore
  }
}

export function moduleLabel(
  payload: CustomErpPackagePayload | null | undefined,
  code: string
): string {
  return payload?.module_labels?.[code] || code;
}

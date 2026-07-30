import type { CustomErpPackagePayload } from "@/lib/signup/custom-package";

export type CustomSignupPricingSummary = {
  monthly: number;
  yearly: number;
  lifetime: number;
  billing_cycle: string;
  /** Billing SSOT — Engine quotes are always USD until payment gateway converts. */
  currency: "USD";
  base_currency: "USD";
  subtotal: number;
  discount_code: string | null;
  discount_amount: number;
  tax_amount: number;
  tax_label: string | null;
  grand_total: number;
  frozen_at: "registration_pricing_summary";
  selected_modules?: string[];
  dependency_modules?: string[];
  effective_modules?: string[];
  selected_feature_packs?: string[];
  tenant_limits?: CustomErpPackagePayload["tenant_limits"];
  feature_packs?: CustomErpPackagePayload["feature_packs"];
};

/**
 * Freeze custom ERP pricing at signup — same contract as predefined plans.
 * License Engine uses this as SSOT; checkout must not recalculate.
 */
export function buildCustomSignupPricingSummary(input: {
  pkg: CustomErpPackagePayload;
  effectiveModules?: string[];
}): CustomSignupPricingSummary {
  const pkg = input.pkg;
  const money = pkg.money;
  const grandTotal = Number(money?.grand_total ?? pkg.estimated_total) || 0;
  const subtotal = Number(money?.subtotal ?? grandTotal) || 0;

  return {
    monthly: Number(pkg.monthly_price) || 0,
    yearly: Number(pkg.yearly_price) || 0,
    lifetime: Number(pkg.lifetime_price) || 0,
    billing_cycle: pkg.billing_cycle,
    currency: "USD",
    base_currency: "USD",
    subtotal,
    discount_code: pkg.discount_code ?? money?.discount_code ?? null,
    discount_amount: Number(money?.discount_amount) || 0,
    tax_amount: Number(money?.tax_amount) || 0,
    tax_label: money?.tax_label ?? null,
    grand_total: grandTotal,
    frozen_at: "registration_pricing_summary",
    selected_modules: [...pkg.selected_modules],
    dependency_modules: [...pkg.dependency_modules],
    ...(input.effectiveModules?.length
      ? { effective_modules: [...input.effectiveModules] }
      : {}),
    ...(pkg.feature_packs?.length
      ? {
          selected_feature_packs: pkg.feature_packs
            .map((p) => String(p.code || "").trim())
            .filter(Boolean),
          feature_packs: pkg.feature_packs,
        }
      : {}),
    ...(pkg.tenant_limits ? { tenant_limits: pkg.tenant_limits } : {}),
  };
}

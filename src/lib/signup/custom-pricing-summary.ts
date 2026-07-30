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

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function positiveMoney(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Freeze custom ERP pricing at signup — same contract as predefined plans.
 * License Engine uses this as SSOT; checkout must not recalculate.
 *
 * `clientGrandTotal` is the USD amount already shown on Custom ERP / signup cart.
 * Never freeze a lower server re-quote than the customer-facing cart total
 * (that undercharge was sending checkout to e.g. $23 while cart showed $35.25).
 */
export function buildCustomSignupPricingSummary(input: {
  pkg: CustomErpPackagePayload;
  effectiveModules?: string[];
  /** USD grand total the customer already saw on Custom ERP / signup. */
  clientGrandTotal?: number | null;
}): CustomSignupPricingSummary {
  const pkg = input.pkg;
  const money = pkg.money;
  const quotedGrand = positiveMoney(money?.grand_total ?? pkg.estimated_total);
  const clientGrand = positiveMoney(input.clientGrandTotal);
  // Never undercharge vs the cart the customer already confirmed.
  const grandTotal = roundMoney(Math.max(quotedGrand, clientGrand));

  const discountAmount = Number(money?.discount_amount) || 0;
  const taxAmount = Number(money?.tax_amount) || 0;
  // Engine invoice rule: subtotal - discount + tax === grand_total
  const subtotal = roundMoney(grandTotal - taxAmount + discountAmount);
  const cycle = pkg.billing_cycle;
  // Selected-cycle amount must equal Grand Total (seats/packs/tax included).
  const monthly =
    cycle === "monthly" ? grandTotal : Number(pkg.monthly_price) || 0;
  const yearly =
    cycle === "yearly" ? grandTotal : Number(pkg.yearly_price) || 0;
  const lifetime =
    cycle === "lifetime" ? grandTotal : Number(pkg.lifetime_price) || 0;

  return {
    monthly,
    yearly,
    lifetime,
    billing_cycle: cycle,
    currency: "USD",
    base_currency: "USD",
    subtotal,
    discount_code: pkg.discount_code ?? money?.discount_code ?? null,
    discount_amount: discountAmount,
    tax_amount: taxAmount,
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

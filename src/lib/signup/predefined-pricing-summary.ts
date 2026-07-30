import type { CatalogPlan } from "@/lib/commercial/types";

type BillingCycle = "monthly" | "yearly" | "lifetime";

function resolveBillingCycle(
  plan: Pick<CatalogPlan, "slug" | "tier" | "lifetime_price">,
  billingCycle?: string | null
): BillingCycle {
  const cycle = String(billingCycle || "").toLowerCase();
  if (cycle === "lifetime" || cycle === "yearly" || cycle === "monthly") {
    return cycle;
  }
  const slug = String(plan.slug || plan.tier || "").toLowerCase();
  if (plan.lifetime_price != null || slug.includes("lifetime")) return "lifetime";
  return "monthly";
}

/**
 * Freeze predefined-plan pricing at signup — same shape as custom ERP pricing_summary.
 * License Engine uses this as SSOT; checkout must not recalculate.
 */
export function buildPredefinedSignupPricingSummary(input: {
  plan: CatalogPlan;
  billingCycle?: string | null;
  currency?: string | null;
}) {
  const cycle = resolveBillingCycle(input.plan, input.billingCycle);
  const monthly = Number(input.plan.monthly_price ?? input.plan.price ?? 0);
  const yearly = Number(input.plan.yearly_price ?? monthly * 12);
  const lifetime = Number(input.plan.lifetime_price ?? 0);
  const grandTotal =
    cycle === "lifetime" ? lifetime : cycle === "yearly" ? yearly : monthly;
  const currency = String(input.currency || input.plan.currency || "USD")
    .trim()
    .toUpperCase()
    .slice(0, 3);

  return {
    monthly,
    yearly,
    lifetime,
    billing_cycle: cycle,
    currency,
    subtotal: grandTotal,
    discount_amount: 0,
    tax_amount: 0,
    grand_total: grandTotal,
    frozen_at: "registration_pricing_summary",
    plan_id: input.plan.id,
    plan_slug: input.plan.slug,
  };
}

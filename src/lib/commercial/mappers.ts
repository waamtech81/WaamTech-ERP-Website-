import type { PricingPlan, Product } from "@/types";
import type {
  CatalogIndustry,
  CatalogPlan,
  CatalogPricing,
  CatalogProduct,
} from "@/lib/commercial/types";

const TIER_ORDER = ["starter", "business", "lifetime", "enterprise"] as const;

export function sortPlansByTier<T extends { tier?: string; slug?: string; sort_order?: number }>(
  plans: T[]
): T[] {
  return [...plans].sort((a, b) => {
    const aTier = String(a.tier || a.slug || "").toLowerCase();
    const bTier = String(b.tier || b.slug || "").toLowerCase();
    const ai = TIER_ORDER.indexOf(aTier as (typeof TIER_ORDER)[number]);
    const bi = TIER_ORDER.indexOf(bTier as (typeof TIER_ORDER)[number]);
    if (ai !== -1 || bi !== -1) {
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    }
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
}

function featureLinesFromDescription(description: string | null | undefined): string[] {
  if (!description?.trim()) return [];
  return description
    .split(/[;\n•]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2)
    .slice(0, 8);
}

function billingCycleLabel(plan: CatalogPlan): string {
  if (plan.lifetime_price != null && plan.pricing_type !== "custom") return "One-time";
  if (plan.plan_type === "lifetime") return "One-time";
  if (plan.plan_type === "yearly") return "Yearly";
  if (plan.plan_type === "monthly") return "Monthly";
  if (plan.yearly_price != null || plan.monthly_price != null) return "Monthly / Yearly";
  return plan.plan_type || "Custom";
}

export function mapCatalogProductToUi(product: CatalogProduct): Product {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    tagline: product.description?.split(/[.!?]/)[0]?.trim() || product.name,
    description: product.description || `${product.name} by WaamTech.`,
    category: product.product_type || "Product",
    icon: product.icon || "Boxes",
    features: featureLinesFromDescription(product.description),
    status: product.status === "active" ? "available" : "coming-soon",
  };
}

export function mapCatalogPlanToPricingPlan(plan: CatalogPlan): PricingPlan {
  const isEnterprise =
    plan.contact_sales ||
    plan.pricing_type === "custom" ||
    String(plan.tier || plan.slug).toLowerCase() === "enterprise";
  const isLifetime =
    !isEnterprise &&
    (plan.lifetime_price != null ||
      String(plan.tier || plan.slug).toLowerCase() === "lifetime" ||
      plan.plan_type === "lifetime");
  const isBusiness = String(plan.tier || plan.slug).toLowerCase() === "business";

  const features = featureLinesFromDescription(plan.description);
  if (plan.has_free_trial && plan.trial_days) {
    features.unshift(`${plan.trial_days}-day free trial`);
  }
  features.push(`Billing: ${billingCycleLabel(plan)}`);

  if (isEnterprise) {
    return {
      id: plan.slug || plan.id,
      name: plan.name,
      description: plan.description || "Custom pricing — contact sales for a quote.",
      monthlyPrice: null,
      yearlyPrice: null,
      lifetimePrice: null,
      popular: false,
      cta: "Contact sales",
      href: `/contact?intent=enterprise&plan=${encodeURIComponent(plan.slug || plan.id)}`,
      usersIncluded: "unlimited",
      usersNote: "Custom pricing",
      modules: [],
      features: [
        "Custom Pricing",
        "Contact Sales",
        "Request a Quote",
        ...features.filter((f) => !/custom pricing/i.test(f)),
      ],
    };
  }

  return {
    id: plan.slug || plan.id,
    name: plan.name,
    description: plan.description || `${plan.name} plan`,
    monthlyPrice: plan.monthly_price,
    yearlyPrice:
      plan.yearly_price != null && plan.monthly_price != null
        ? Number((plan.yearly_price / 12).toFixed(2))
        : plan.yearly_price,
    lifetimePrice: plan.lifetime_price,
    popular: isBusiness,
    badge: isLifetime ? "Best value" : undefined,
    cta: isLifetime ? "Get lifetime access" : "Start free trial",
    href: isLifetime
      ? `/contact?intent=lifetime&plan=${encodeURIComponent(plan.slug || plan.id)}`
      : `/signup?plan=${encodeURIComponent(plan.slug || plan.id)}&product=${encodeURIComponent(plan.product_slug || "")}&plan_id=${encodeURIComponent(plan.id)}`,
    modules: [],
    features,
  };
}

export function mapPricingRowsToPlans(
  pricing: CatalogPricing[],
  plans: CatalogPlan[]
): PricingPlan[] {
  const byId = new Map(plans.map((p) => [p.id, p]));
  const merged = pricing.map((row) => {
    const full = byId.get(row.plan_id);
    return mapCatalogPlanToPricingPlan(
      full ||
        ({
          id: row.plan_id,
          product_id: row.product_id,
          product_slug: row.product_slug,
          product_name: row.product_name,
          product_code: null,
          name: row.name,
          slug: row.slug,
          plan_code: row.plan_code,
          plan_version: "1",
          description: null,
          tier: row.tier,
          plan_type: row.lifetime_price != null ? "lifetime" : "monthly",
          pricing_type: row.pricing_type,
          currency: row.currency,
          monthly_price: row.monthly_price,
          yearly_price: row.yearly_price,
          lifetime_price: row.lifetime_price,
          price: row.monthly_price,
          has_free_trial: row.has_free_trial,
          trial_days: row.trial_days,
          grace_period_days: 0,
          contact_sales: row.contact_sales,
          sort_order: 0,
          is_active: true,
          is_public: true,
        } satisfies CatalogPlan)
    );
  });
  return sortPlansByTier(
    merged.map((p, i) => ({ ...p, sort_order: i, tier: p.id }))
  ).map(({ sort_order: _s, tier: _t, ...plan }) => plan as PricingPlan);
}

export function buildDynamicComparison(
  plans: PricingPlan[]
): Array<Record<string, string | boolean>> {
  const keys = plans.map((p) => p.id);
  const rows: Array<Record<string, string | boolean>> = [
    {
      name: "Pricing",
      ...Object.fromEntries(
        plans.map((p) => [
          p.id,
          p.lifetimePrice != null
            ? "One-time"
            : p.monthlyPrice == null && p.yearlyPrice == null
              ? "Custom"
              : "Subscription",
        ])
      ),
    },
    {
      name: "Free trial",
      ...Object.fromEntries(
        plans.map((p) => [
          p.id,
          p.features.some((f) => /free trial/i.test(f)) ||
            (!p.id.includes("enterprise") && !p.id.includes("lifetime")),
        ])
      ),
    },
    {
      name: "Contact sales",
      ...Object.fromEntries(plans.map((p) => [p.id, /contact sales/i.test(p.cta)])),
    },
  ];

  // Ensure all plan keys exist on every row for the comparison table.
  for (const row of rows) {
    for (const key of keys) {
      if (row[key] === undefined) row[key] = false;
    }
  }
  return rows;
}

export function industryDisplayIcon(industry: CatalogIndustry): string {
  const icon = (industry.icon || "").toLowerCase();
  const map: Record<string, string> = {
    car: "Car",
    pill: "Pill",
    building: "Building2",
    factory: "Factory",
    store: "Store",
    truck: "Truck",
    warehouse: "Warehouse",
    utensils: "UtensilsCrossed",
    "graduation-cap": "GraduationCap",
    hospital: "Hospital",
    sprout: "Sprout",
    shirt: "Shirt",
    sofa: "Armchair",
    sparkles: "Sparkles",
    droplets: "Droplets",
  };
  return map[icon] || "Boxes";
}

export function popularPlans(plans: PricingPlan[], limit = 3): PricingPlan[] {
  const nonEnterprise = plans.filter(
    (p) => !/enterprise/i.test(p.id) && !/contact sales/i.test(p.cta)
  );
  const popular = nonEnterprise.filter((p) => p.popular);
  const rest = nonEnterprise.filter((p) => !p.popular);
  return [...popular, ...rest].slice(0, limit);
}

export function enterprisePlan(plans: PricingPlan[]): PricingPlan | undefined {
  return plans.find(
    (p) =>
      /enterprise/i.test(p.id) ||
      /enterprise/i.test(p.name) ||
      /contact sales/i.test(p.cta)
  );
}

export function cardPlans(plans: PricingPlan[]): PricingPlan[] {
  return plans.filter((p) => p !== enterprisePlan(plans));
}

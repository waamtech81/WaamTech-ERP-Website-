import type { PricingFeatureGroup, PricingPlan, Product } from "@/types";
import type {
  BillingCycle,
  CatalogComparisonBundle,
  CatalogComparisonRow,
  CatalogFeatureGroup,
  CatalogFeatureItem,
  CatalogIndustry,
  CatalogPlan,
  CatalogPlanLimits,
  CatalogPricing,
  CatalogProduct,
} from "@/lib/commercial/types";
import { buildAppPath, buildSignupPath } from "@/lib/urls";

const TIER_ORDER = ["starter", "business", "lifetime", "enterprise"] as const;

/**
 * Dedicated Trial commercial plans (plan_type/tier/slug/name).
 * Does NOT treat Starter/Business as Trial just because they offer a free-trial benefit.
 */
export function isTrialPlan(plan: {
  id?: string | null;
  name?: string | null;
  slug?: string | null;
  tier?: string | null;
  plan_type?: string | null;
  pricing_type?: string | null;
}): boolean {
  const id = String(plan.id || "").toLowerCase().trim();
  const name = String(plan.name || "").toLowerCase().trim();
  const slug = String(plan.slug || "").toLowerCase().trim() || id;
  const tier = String(plan.tier || "").toLowerCase().trim();
  const planType = String(plan.plan_type || "").toLowerCase().trim();
  const pricingType = String(plan.pricing_type || "").toLowerCase().trim();

  if (planType === "trial") return true;
  if (tier === "trial") return true;
  if (pricingType === "trial") return true;

  if (
    slug === "trial" ||
    slug === "free-trial" ||
    slug === "freetrial" ||
    slug.startsWith("trial-") ||
    slug.endsWith("-trial") ||
    slug.includes("-trial-")
  ) {
    return true;
  }

  if (
    id === "trial" ||
    id === "free-trial" ||
    id.startsWith("trial-") ||
    id.endsWith("-trial") ||
    id.includes("-trial-")
  ) {
    return true;
  }

  if (
    name === "trial" ||
    name === "free trial" ||
    name === "free-trial" ||
    /^trial(\s|$)/i.test(name) ||
    /\btrial plan\b/i.test(name)
  ) {
    return true;
  }

  return false;
}

/** Public marketing catalog: Starter / Business / Lifetime / Enterprise only. */
export function publicMarketingPlans<T extends Parameters<typeof isTrialPlan>[0]>(plans: T[]): T[] {
  return plans.filter((p) => !isTrialPlan(p));
}

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

function mapFeatureGroups(
  groups: CatalogFeatureGroup[] | undefined
): PricingFeatureGroup[] {
  if (!groups?.length) return [];
  return [...groups]
    .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999))
    .map((g) => ({
      id: g.id || g.code || g.slug || g.name,
      code: g.code,
      name: g.name,
      icon: g.icon,
      features: (g.features || [])
        .filter((f) => f.included !== false)
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map((f: CatalogFeatureItem) => ({
          id: f.id,
          name: f.name,
          description: f.description,
          tooltip: f.tooltip,
          highlighted: Boolean(f.highlighted),
          greenTick: f.show_green_tick !== false && f.green_tick !== false,
          inherited: Boolean(f.inherited),
          category: f.category,
        })),
    }))
    .filter((g) => g.features.length > 0);
}

function usersFromLimits(limits?: CatalogPlanLimits | null): {
  usersIncluded?: number | "unlimited";
  usersNote?: string;
  storageIncludedGb?: number | "unlimited" | null;
  extraUserPrice?: number | null;
  extraStoragePricePerGb?: number | null;
} {
  if (!limits) return {};
  const unlimitedUsers = Boolean(limits.unlimited_users);
  const usersIncluded = unlimitedUsers
    ? ("unlimited" as const)
    : limits.max_users != null
      ? Number(limits.max_users)
      : undefined;
  const unlimitedStorage = Boolean(limits.unlimited_storage);
  const storageIncludedGb = unlimitedStorage
    ? ("unlimited" as const)
    : limits.max_storage_gb != null
      ? Number(limits.max_storage_gb)
      : null;

  return {
    usersIncluded,
    usersNote: usersIncluded
      ? usersIncluded === "unlimited"
        ? "Unlimited users"
        : `${usersIncluded} user${usersIncluded === 1 ? "" : "s"} included`
      : undefined,
    storageIncludedGb,
    extraUserPrice:
      limits.extra_user_price != null ? Number(limits.extra_user_price) : null,
    extraStoragePricePerGb:
      limits.extra_storage_price_per_gb != null
        ? Number(limits.extra_storage_price_per_gb)
        : null,
  };
}

function usersFromHighlights(highlights: string[] | undefined): number | "unlimited" | undefined {
  if (!highlights?.length) return undefined;
  for (const h of highlights) {
    if (/unlimited\s+users?/i.test(h)) return "unlimited";
    const m = h.match(/(\d+)\s+users?/i);
    if (m) return Number(m[1]);
  }
  return undefined;
}

function firstText(
  ...values: Array<string | null | undefined>
): string | undefined {
  for (const value of values) {
    const trimmed = String(value ?? "").trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

function ctaText(
  plan: Pick<
    CatalogPlan,
    "cta" | "cta_button_text" | "contact_sales" | "lifetime_price" | "has_free_trial"
  >
): string {
  const fromEngine = firstText(plan.cta?.text, plan.cta_button_text);
  if (fromEngine) return fromEngine;
  if (plan.contact_sales) return "Contact sales";
  if (plan.lifetime_price != null) return "Get lifetime access";
  // Starter / Business and other self-serve plans — free trial CTA (Engine may omit has_free_trial)
  return "Start free trial";
}

/** Public helper — same CTA rules as pricing cards (Engine SSOT). */
export function planCtaLabel(
  plan: Pick<
    CatalogPlan,
    "cta" | "cta_button_text" | "contact_sales" | "lifetime_price" | "has_free_trial"
  >
): string {
  return ctaText(plan);
}

function buildSignupHref(plan: {
  id: string;
  slug?: string | null;
  product_slug?: string | null;
  contact_sales?: boolean;
  pricing_type?: string | null;
  lifetime_price?: number | null;
  billing_cycle?: string | null;
}): string {
  const slug = plan.slug || plan.id;
  if (
    plan.contact_sales ||
    plan.pricing_type === "custom" ||
    String(slug).toLowerCase() === "enterprise"
  ) {
    return buildAppPath("/contact", {
      intent: "enterprise",
      plan: slug,
    });
  }
  if (plan.lifetime_price != null || String(slug).toLowerCase() === "lifetime") {
    return buildAppPath("/contact", {
      intent: "lifetime",
      plan: slug,
    });
  }
  return buildSignupPath({
    product: plan.product_slug,
    planId: plan.id,
    planSlug: slug,
  });
}

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function yearlyPerMonth(yearlyTotal: number | null): number | null {
  if (yearlyTotal == null) return null;
  return Number((yearlyTotal / 12).toFixed(2));
}

/** Map Engine launch pricing onto monthly / yearly display fields. */
function resolveLaunchFields(source: {
  monthly_price?: number | null;
  yearly_price?: number | null;
  lifetime_price?: number | null;
  original_price?: number | null;
  launch_price?: number | null;
  display_price?: number | null;
  discount_percentage?: number | null;
  savings_amount?: number | null;
  show_strike_through?: boolean;
  billing_cycle?: string | null;
  plan_type?: string | null;
}) {
  const monthly = num(source.monthly_price);
  const yearlyTotal = num(source.yearly_price);
  const lifetime = num(source.lifetime_price);
  const original = num(source.original_price);
  const display = num(source.display_price) ?? num(source.launch_price) ?? monthly;
  const discount = num(source.discount_percentage);
  const savings = num(source.savings_amount);
  const cycle = String(source.billing_cycle || source.plan_type || "monthly").toLowerCase();

  const originalMonthly =
    cycle.includes("month") || (!cycle.includes("year") && !cycle.includes("life"))
      ? original
      : monthly != null && original != null && display != null && display > 0
        ? Number(((original / display) * monthly).toFixed(2))
        : original;

  const yearlyPerMo = yearlyPerMonth(yearlyTotal);
  let originalYearlyTotal: number | null = null;
  let originalYearlyPerMo: number | null = null;
  let yearlySavings: number | null = null;

  if (yearlyTotal != null && monthly != null && originalMonthly != null && monthly > 0) {
    const ratio = originalMonthly / monthly;
    originalYearlyTotal = Number((yearlyTotal * ratio).toFixed(2));
    originalYearlyPerMo = yearlyPerMonth(originalYearlyTotal);
    yearlySavings = Number((originalYearlyTotal - yearlyTotal).toFixed(2));
  } else if (yearlyTotal != null && monthly != null) {
    const billedMonthly = monthly * 12;
    if (billedMonthly > yearlyTotal) {
      yearlySavings = Number((billedMonthly - yearlyTotal).toFixed(2));
      originalYearlyTotal = billedMonthly;
      originalYearlyPerMo = monthly;
    }
  }

  return {
    monthlyPrice: display ?? monthly,
    originalMonthlyPrice:
      source.show_strike_through && originalMonthly != null && display != null && originalMonthly > display
        ? originalMonthly
        : originalMonthly != null && display != null && originalMonthly > (display ?? 0)
          ? originalMonthly
          : source.show_strike_through
            ? originalMonthly
            : null,
    yearlyTotal,
    yearlyPrice: yearlyPerMo,
    originalYearlyTotal:
      originalYearlyTotal != null && yearlyTotal != null && originalYearlyTotal > yearlyTotal
        ? originalYearlyTotal
        : null,
    originalYearlyPrice:
      originalYearlyPerMo != null &&
      yearlyPerMo != null &&
      originalYearlyPerMo > yearlyPerMo
        ? originalYearlyPerMo
        : null,
    lifetimePrice: lifetime,
    originalLifetimePrice:
      lifetime != null && original != null && original > lifetime ? original : null,
    launchDiscount: discount ?? undefined,
    savingsAmount: savings,
    yearlySavingsAmount: yearlySavings,
    showStrikeThrough: Boolean(source.show_strike_through),
  };
}

export type CyclePriceDisplay = {
  billingCycle: BillingCycle;
  price: number | null;
  originalPrice: number | null;
  discountPercent: number | null;
  savings: number | null;
  unitLabel: string;
  contactSales: boolean;
};

/** Resolve displayed price for the active billing toggle from Engine-mapped plan fields. */
export function resolveCyclePrice(
  plan: PricingPlan,
  yearly: boolean
): CyclePriceDisplay {
  if (plan.contactSales || (plan.monthlyPrice == null && plan.yearlyPrice == null && plan.lifetimePrice == null)) {
    if (plan.lifetimePrice != null) {
      return {
        billingCycle: "lifetime",
        price: plan.lifetimePrice,
        originalPrice: plan.originalLifetimePrice ?? null,
        discountPercent: plan.launchDiscount ?? null,
        savings:
          plan.originalLifetimePrice != null && plan.lifetimePrice != null
            ? Number((plan.originalLifetimePrice - plan.lifetimePrice).toFixed(2))
            : null,
        unitLabel: "one-time",
        contactSales: false,
      };
    }
    return {
      billingCycle: "monthly",
      price: null,
      originalPrice: null,
      discountPercent: null,
      savings: null,
      unitLabel: "custom",
      contactSales: true,
    };
  }

  if (plan.lifetimePrice != null) {
    return {
      billingCycle: "lifetime",
      price: plan.lifetimePrice,
      originalPrice: plan.originalLifetimePrice ?? null,
      discountPercent: plan.launchDiscount ?? null,
      savings:
        plan.originalLifetimePrice != null
          ? Number((plan.originalLifetimePrice - plan.lifetimePrice).toFixed(2))
          : null,
      unitLabel: "one-time",
      contactSales: false,
    };
  }

  if (yearly) {
    return {
      billingCycle: "yearly",
      price: plan.yearlyPrice,
      originalPrice: plan.originalYearlyPrice ?? null,
      discountPercent: plan.launchDiscount ?? null,
      savings: plan.yearlySavingsAmount ?? null,
      unitLabel: "/user/mo",
      contactSales: false,
    };
  }

  return {
    billingCycle: "monthly",
    price: plan.monthlyPrice,
    originalPrice: plan.originalMonthlyPrice ?? null,
    discountPercent: plan.launchDiscount ?? null,
    savings: plan.savingsAmount ?? null,
    unitLabel: "/user/mo",
    contactSales: false,
  };
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

export function mapCatalogPlanToPricingPlan(
  plan: CatalogPlan,
  extras?: {
    limits?: CatalogPlanLimits | null;
    featureGroups?: CatalogFeatureGroup[];
    modules?: string[];
  }
): PricingPlan {
  const isEnterprise =
    plan.contact_sales ||
    plan.pricing_type === "custom" ||
    String(plan.tier || plan.slug).toLowerCase() === "enterprise";

  const launch = resolveLaunchFields(plan);
  const fromLimits = usersFromLimits(extras?.limits);
  const fromHighlights = usersFromHighlights(plan.highlights);
  const featureGroups = mapFeatureGroups(
    extras?.featureGroups || (plan as CatalogPlan & { feature_groups?: CatalogFeatureGroup[] }).feature_groups
  );

  const groupedFeatureNames = featureGroups
    .flatMap((g) => g.features.map((f) => f.name).filter(Boolean))
    .slice(0, 12);
  const featureNames =
    groupedFeatureNames.length > 0
      ? groupedFeatureNames
      : (plan.highlights || []).filter((h) => String(h || "").trim())
          .length > 0
        ? (plan.highlights || []).filter((h) => String(h || "").trim())
        : featureLinesFromDescription(plan.description);

  // Do not inject trial into features — CTA already communicates trial; avoids duplicate rows
  const features = featureNames.filter((f) => String(f || "").trim());

  const usersIncluded = fromLimits.usersIncluded ?? fromHighlights;
  const badge = firstText(
    plan.badge_label,
    plan.ribbon,
    plan.badge ? String(plan.badge).replace(/_/g, " ") : undefined
  );
  const description = firstText(
    plan.short_description,
    plan.marketing_summary,
    plan.description
  );
  // Prefer one body copy — avoid rendering the same Engine string twice
  const marketingSummary =
    firstText(plan.marketing_summary) &&
    firstText(plan.marketing_summary) !== firstText(plan.short_description)
      ? firstText(plan.marketing_summary)
      : undefined;

  if (isEnterprise) {
    return {
      id: plan.slug || plan.id,
      planId: plan.id,
      productId: plan.product_id,
      productSlug: plan.product_slug,
      name: plan.name || plan.title || "Enterprise",
      subtitle: firstText(plan.subtitle, plan.tagline) || null,
      description:
        description ||
        undefined,
      marketingSummary: marketingSummary || null,
      monthlyPrice: null,
      yearlyPrice: null,
      lifetimePrice: null,
      popular: Boolean(plan.is_popular),
      recommended: Boolean(plan.is_recommended),
      badge: firstText(plan.badge_label, plan.ribbon) || undefined,
      ribbon: firstText(plan.ribbon) || null,
      cta: ctaText(plan),
      ctaStyle: plan.cta?.style || plan.cta_button_style,
      href: buildSignupHref(plan),
      usersIncluded: usersIncluded,
      usersNote: firstText(fromLimits.usersNote) || undefined,
      storageIncludedGb: fromLimits.storageIncludedGb ?? null,
      extraUserPrice: fromLimits.extraUserPrice,
      extraStoragePricePerGb: fromLimits.extraStoragePricePerGb,
      supportLevel: firstText(plan.support_level) || null,
      modules: (extras?.modules || []).filter(Boolean),
      highlights: (plan.highlights || []).filter((h) => String(h || "").trim()),
      featureGroups,
      features: features.filter((f) => !/custom pricing/i.test(f)),
      hasFreeTrial: plan.has_free_trial,
      trialDays: plan.trial_days,
      contactSales: true,
      billingCycle: plan.billing_cycle || plan.plan_type,
      currency: plan.currency,
      launchCampaign: firstText(plan.launch_campaign) || null,
      launchBadge: firstText(plan.launch_badge) || null,
    };
  }

  return {
    id: plan.slug || plan.id,
    planId: plan.id,
    productId: plan.product_id,
    productSlug: plan.product_slug,
    name: plan.name || plan.title || plan.slug,
    subtitle: firstText(plan.subtitle, plan.tagline) || null,
    description,
    marketingSummary: marketingSummary || null,
    monthlyPrice: launch.monthlyPrice,
    yearlyPrice: launch.yearlyPrice,
    yearlyTotal: launch.yearlyTotal,
    originalMonthlyPrice: launch.originalMonthlyPrice,
    originalYearlyPrice: launch.originalYearlyPrice,
    originalYearlyTotal: launch.originalYearlyTotal,
    lifetimePrice: launch.lifetimePrice,
    originalLifetimePrice: launch.originalLifetimePrice,
    displayPrice: num(plan.display_price),
    launchPrice: num(plan.launch_price),
    launchDiscount: launch.launchDiscount,
    savingsAmount: launch.savingsAmount,
    yearlySavingsAmount: launch.yearlySavingsAmount,
    showStrikeThrough: launch.showStrikeThrough,
    launchActive: Boolean(plan.launch_active),
    launchCampaign: firstText(plan.launch_campaign) || null,
    launchBadge: firstText(plan.launch_badge) || null,
    billingCycle: plan.billing_cycle || plan.plan_type,
    currency: plan.currency,
    popular: Boolean(plan.is_popular),
    recommended: Boolean(plan.is_recommended),
    badge,
    ribbon: firstText(plan.ribbon) || null,
    cta: ctaText(plan),
    ctaStyle: plan.cta?.style || plan.cta_button_style,
    href: buildSignupHref(plan),
    usersIncluded,
    usersNote: firstText(fromLimits.usersNote) || undefined,
    storageIncludedGb: fromLimits.storageIncludedGb ?? null,
    extraUserPrice: fromLimits.extraUserPrice,
    extraStoragePricePerGb: fromLimits.extraStoragePricePerGb,
    supportLevel: firstText(plan.support_level) || null,
    modules: (extras?.modules || []).filter(Boolean),
    highlights: (plan.highlights || []).filter((h) => String(h || "").trim()),
    featureGroups,
    features,
    hasFreeTrial: plan.has_free_trial,
    trialDays: plan.trial_days,
    contactSales: false,
  };
}

export function mapPricingRowsToPlans(
  pricing: CatalogPricing[],
  plans: CatalogPlan[],
  comparison?: CatalogComparisonBundle | null
): PricingPlan[] {
  const byId = new Map(plans.map((p) => [p.id, p]));
  const limitsById = new Map(
    (comparison?.comparison || []).map((row) => [row.plan.id, row.limits])
  );
  const modulesById = new Map(
    (comparison?.comparison || []).map((row) => [
      row.plan.id,
      (row.modules || []).map((m) => m.name || m.code || "").filter(Boolean),
    ])
  );

  const merged = pricing.map((row) => {
    const full = byId.get(row.plan_id);
    const limits = limitsById.get(row.plan_id);
    const modules = modulesById.get(row.plan_id);
    const asPlan: CatalogPlan =
      full ||
      ({
        id: row.plan_id,
        product_id: row.product_id,
        product_slug: row.product_slug,
        product_name: row.product_name,
        product_code: null,
        name: row.name || row.title || row.slug,
        title: row.title,
        slug: row.slug,
        seo_slug: row.seo_slug,
        plan_code: row.plan_code,
        plan_version: "1",
        description: row.description || null,
        subtitle: row.subtitle,
        short_description: row.description,
        marketing_summary: row.marketing_summary,
        badge: row.badge,
        badge_label: row.badge_label,
        ribbon: row.ribbon,
        icon: row.icon,
        highlight_color: row.highlight_color,
        highlights: row.highlights,
        support_level: row.support_level,
        tier: row.tier,
        plan_type: row.lifetime_price != null ? "lifetime" : row.billing_cycle || "monthly",
        pricing_type: row.pricing_type,
        currency: row.currency,
        billing_cycle: row.billing_cycle,
        monthly_price: row.monthly_price,
        yearly_price: row.yearly_price,
        lifetime_price: row.lifetime_price,
        price: row.display_price ?? row.monthly_price,
        original_price: row.original_price,
        launch_price: row.launch_price,
        display_price: row.display_price,
        discount_percentage: row.discount_percentage,
        savings_amount: row.savings_amount,
        show_strike_through: row.show_strike_through,
        launch_active: row.launch_active,
        launch_campaign: row.launch_campaign,
        launch_badge: row.launch_badge,
        cta: row.cta,
        has_free_trial: row.has_free_trial,
        trial_days: row.trial_days,
        grace_period_days: 0,
        contact_sales: row.contact_sales,
        is_popular: row.is_popular ?? row.popular_flag,
        is_recommended: row.is_recommended ?? row.recommended_flag,
        sort_order: row.sort_order ?? 0,
        is_active: true,
        is_public: true,
      } satisfies CatalogPlan);

    // Prefer pricing-row marketing fields (richer) over thin plan list.
    const enriched: CatalogPlan = {
      ...asPlan,
      subtitle: row.subtitle ?? asPlan.subtitle,
      marketing_summary: row.marketing_summary ?? asPlan.marketing_summary,
      badge: row.badge ?? asPlan.badge,
      badge_label: row.badge_label ?? asPlan.badge_label,
      ribbon: row.ribbon ?? asPlan.ribbon,
      highlights: row.highlights?.length ? row.highlights : asPlan.highlights,
      original_price: row.original_price ?? asPlan.original_price,
      launch_price: row.launch_price ?? asPlan.launch_price,
      display_price: row.display_price ?? asPlan.display_price,
      discount_percentage: row.discount_percentage ?? asPlan.discount_percentage,
      savings_amount: row.savings_amount ?? asPlan.savings_amount,
      show_strike_through: row.show_strike_through ?? asPlan.show_strike_through,
      launch_active: row.launch_active ?? asPlan.launch_active,
      launch_campaign: row.launch_campaign ?? asPlan.launch_campaign,
      launch_badge: row.launch_badge ?? asPlan.launch_badge,
      is_popular: row.is_popular ?? row.popular_flag ?? asPlan.is_popular,
      is_recommended:
        row.is_recommended ?? row.recommended_flag ?? asPlan.is_recommended,
      cta: row.cta ?? asPlan.cta,
      monthly_price: row.monthly_price ?? asPlan.monthly_price,
      yearly_price: row.yearly_price ?? asPlan.yearly_price,
      lifetime_price: row.lifetime_price ?? asPlan.lifetime_price,
    };

    return mapCatalogPlanToPricingPlan(enriched, {
      limits,
      featureGroups: row.feature_groups,
      modules,
    });
  });

  return sortPlansByTier(
    merged.map((p, i) => ({ ...p, sort_order: i, tier: p.id }))
  ).map(({ sort_order: _s, tier: _t, ...plan }) => plan as PricingPlan);
}

function formatLimitValue(
  key: string,
  limits: CatalogPlanLimits | undefined
): string | boolean {
  if (!limits) return "—";
  const unlimitedKey = key.replace(/^max_/, "unlimited_") as keyof CatalogPlanLimits;
  if (limits[unlimitedKey] === true) return "Unlimited";

  const value = limits[key];
  if (value == null) return "—";
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (key === "max_storage_gb") return `${value} GB`;
    if (key === "max_users") return value === 1 ? "1 User" : `${value} Users`;
    return String(value);
  }
  return String(value);
}

function featureIncluded(
  row: CatalogComparisonRow,
  needle: RegExp
): boolean {
  const names = [
    ...(row.features || []),
    ...(row.commercial_features || []).map((f) => f.name),
    ...(row.highlights || []),
  ];
  return names.some((n) => needle.test(String(n)));
}

/** Build comparison matrix from License Engine comparison payload when available. */
function planHasFeature(plan: PricingPlan, featureName: string): boolean {
  const needle = featureName.trim().toLowerCase();
  if (!needle) return false;
  if (
    (plan.featureGroups || []).some((g) =>
      g.features.some((f) => f.name.trim().toLowerCase() === needle)
    )
  ) {
    return true;
  }
  return (plan.features || []).some((f) => f.trim().toLowerCase() === needle);
}

/** Detailed feature matrix from Engine-mapped plan feature groups. */
function featureGroupComparisonRows(
  plans: PricingPlan[]
): Array<Record<string, string | boolean>> {
  const groupOrder: string[] = [];
  const featuresByGroup = new Map<string, string[]>();
  const seenFeatures = new Set<string>();

  for (const plan of plans) {
    for (const group of plan.featureGroups || []) {
      const gName = group.name.trim() || "Features";
      if (!featuresByGroup.has(gName)) {
        featuresByGroup.set(gName, []);
        groupOrder.push(gName);
      }
      const list = featuresByGroup.get(gName)!;
      for (const feature of group.features) {
        const key = feature.name.trim().toLowerCase();
        if (!key || seenFeatures.has(key)) continue;
        seenFeatures.add(key);
        list.push(feature.name);
      }
    }
  }

  if (!groupOrder.length) {
    const flat: string[] = [];
    for (const plan of plans) {
      for (const name of plan.features || []) {
        const key = name.trim().toLowerCase();
        if (!key || seenFeatures.has(key)) continue;
        seenFeatures.add(key);
        flat.push(name);
      }
    }
    if (flat.length) {
      groupOrder.push("Features");
      featuresByGroup.set("Features", flat);
    }
  }

  const rows: Array<Record<string, string | boolean>> = [];
  for (const gName of groupOrder) {
    const features = featuresByGroup.get(gName) || [];
    if (!features.length) continue;
    rows.push({ name: gName, __section: true });
    for (const featureName of features) {
      const row: Record<string, string | boolean> = { name: featureName };
      for (const plan of plans) {
        row[plan.id] = planHasFeature(plan, featureName);
      }
      rows.push(row);
    }
  }
  return rows;
}

function baseLimitComparisonRows(
  plans: PricingPlan[]
): Array<Record<string, string | boolean>> {
  return [
    {
      name: "Users",
      ...Object.fromEntries(
        plans.map((p) => [
          p.id,
          p.usersIncluded === "unlimited"
            ? "Unlimited Users"
            : typeof p.usersIncluded === "number"
              ? p.usersIncluded === 1
                ? "1 Included User"
                : `${p.usersIncluded} Included Users`
              : "—",
        ])
      ),
    },
    {
      name: "Storage",
      ...Object.fromEntries(
        plans.map((p) => [
          p.id,
          p.storageIncludedGb === "unlimited"
            ? "Unlimited"
            : p.storageIncludedGb != null
              ? `${p.storageIncludedGb} GB`
              : "—",
        ])
      ),
    },
    {
      name: "Support",
      ...Object.fromEntries(plans.map((p) => [p.id, p.supportLevel || "—"])),
    },
    {
      name: "Free trial",
      ...Object.fromEntries(
        plans.map((p) => [
          p.id,
          p.hasFreeTrial
            ? p.trialDays
              ? `${p.trialDays}-day trial`
              : true
            : false,
        ])
      ),
    },
    {
      name: "Extra user price",
      ...Object.fromEntries(
        plans.map((p) => [
          p.id,
          p.extraUserPrice != null
            ? `$${p.extraUserPrice}`
            : p.usersIncluded === "unlimited"
              ? "Included"
              : "—",
        ])
      ),
    },
    {
      name: "Extra storage price",
      ...Object.fromEntries(
        plans.map((p) => [
          p.id,
          p.extraStoragePricePerGb != null
            ? `$${p.extraStoragePricePerGb}/GB`
            : p.storageIncludedGb === "unlimited"
              ? "Included"
              : "—",
        ])
      ),
    },
  ];
}

export function buildDynamicComparison(
  plans: PricingPlan[],
  comparison?: CatalogComparisonBundle | null
): Array<Record<string, string | boolean>> {
  const visible = publicMarketingPlans(plans);
  const keys = visible.map((p) => p.id);

  if (comparison?.comparison?.length) {
    const rowsByPlan = new Map(
      comparison.comparison.map((row) => [row.plan.slug || row.plan.id, row])
    );

    const limitRows: Array<{ name: string; key: string }> = [
      { name: "Users", key: "max_users" },
      { name: "Storage", key: "max_storage_gb" },
      { name: "Branches", key: "max_branches" },
      { name: "Warehouses", key: "max_warehouses" },
    ];

    const capabilityRows: Array<{ name: string; test: RegExp }> = [
      { name: "Modules", test: /module|inventory|crm|sales|purchase|pos/i },
      { name: "Support", test: /support|sla/i },
      { name: "API", test: /\bapi\b/i },
      { name: "Reports", test: /report|analytics|dashboard/i },
      { name: "Security", test: /security|rbac|auth|ssl|encryption/i },
      { name: "Integrations", test: /integrat|whatsapp|import|export/i },
    ];

    const matrix: Array<Record<string, string | boolean>> = [];

    for (const lr of limitRows) {
      const row: Record<string, string | boolean> = { name: lr.name };
      for (const plan of visible) {
        const engineRow = rowsByPlan.get(plan.id);
        if (lr.key === "max_users" && plan.usersIncluded != null) {
          row[plan.id] =
            plan.usersIncluded === "unlimited"
              ? "Unlimited Users"
              : plan.usersIncluded === 1
                ? "1 Included User"
                : `${plan.usersIncluded} Included Users`;
        } else if (lr.key === "max_storage_gb" && plan.storageIncludedGb != null) {
          row[plan.id] =
            plan.storageIncludedGb === "unlimited"
              ? "Unlimited"
              : `${plan.storageIncludedGb} GB`;
        } else {
          row[plan.id] = formatLimitValue(lr.key, engineRow?.limits);
        }
      }
      matrix.push(row);
    }

    for (const cr of capabilityRows) {
      const row: Record<string, string | boolean> = { name: cr.name };
      for (const plan of visible) {
        const engineRow = rowsByPlan.get(plan.id);
        if (cr.name === "Support") {
          row[plan.id] =
            engineRow?.support_level ||
            plan.supportLevel ||
            (engineRow ? featureIncluded(engineRow, cr.test) : false);
        } else if (cr.name === "Modules") {
          const mods = engineRow?.modules?.map((m) => m.name || m.code).filter(Boolean);
          row[plan.id] = mods?.length
            ? mods.slice(0, 4).join(", ") + (mods.length > 4 ? "…" : "")
            : engineRow
              ? featureIncluded(engineRow, cr.test)
              : false;
        } else {
          row[plan.id] = engineRow ? featureIncluded(engineRow, cr.test) : false;
        }
      }
      matrix.push(row);
    }

    matrix.push({
      name: "Extra user price",
      ...Object.fromEntries(
        visible.map((p) => [
          p.id,
          p.extraUserPrice != null ? `$${p.extraUserPrice}` : p.usersIncluded === "unlimited" ? "Included" : "—",
        ])
      ),
    });
    matrix.push({
      name: "Extra storage price",
      ...Object.fromEntries(
        visible.map((p) => [
          p.id,
          p.extraStoragePricePerGb != null
            ? `$${p.extraStoragePricePerGb}/GB`
            : p.storageIncludedGb === "unlimited"
              ? "Included"
              : "—",
        ])
      ),
    });

    matrix.push(...featureGroupComparisonRows(visible));

    for (const row of matrix) {
      if (row.__section === true) continue;
      for (const key of keys) {
        if (row[key] === undefined) row[key] = "—";
      }
    }
    return matrix;
  }

  // Fallback when comparison API is unavailable — limits + full feature groups from plans.
  const rows: Array<Record<string, string | boolean>> = [
    ...baseLimitComparisonRows(visible),
    ...featureGroupComparisonRows(visible),
  ];

  for (const row of rows) {
    if (row.__section === true) continue;
    for (const key of keys) {
      if (row[key] === undefined) row[key] = false;
    }
  }
  return rows;
}

/** Promo strip sourced from Engine launch campaign fields (never hardcoded). */
export function launchPromoFromPlans(plans: PricingPlan[]): {
  campaign: string | null;
  badge: string | null;
  maxDiscount: number | null;
  maxSavings: number | null;
} | null {
  const active = publicMarketingPlans(plans).filter((p) => p.launchActive);
  if (!active.length) return null;
  const maxDiscount = Math.max(
    ...active.map((p) => p.launchDiscount ?? 0).filter((n) => n > 0),
    0
  );
  const maxSavings = Math.max(
    ...active.map((p) => p.savingsAmount ?? 0).filter((n) => n > 0),
    0
  );
  const sample = active.find((p) => p.launchCampaign || p.launchBadge) || active[0];
  return {
    campaign: sample.launchCampaign || null,
    badge: sample.launchBadge || null,
    maxDiscount: maxDiscount || null,
    maxSavings: maxSavings || null,
  };
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
  const nonEnterprise = publicMarketingPlans(plans).filter(
    (p) => !/enterprise/i.test(p.id) && !p.contactSales
  );
  return sortCardDisplayOrder(nonEnterprise).slice(0, limit);
}

export function enterprisePlan(plans: PricingPlan[]): PricingPlan | undefined {
  return publicMarketingPlans(plans).find(
    (p) =>
      /enterprise/i.test(p.id) ||
      /enterprise/i.test(p.name) ||
      Boolean(p.contactSales)
  );
}

/** Card grid order: Starter | Most popular (Business) | Lifetime */
function sortCardDisplayOrder(plans: PricingPlan[]): PricingPlan[] {
  function rank(p: PricingPlan): number {
    const id = String(p.id || "").toLowerCase();
    const name = String(p.name || "").toLowerCase();
    if (id.includes("starter") || name.includes("starter")) return 0;
    if (p.popular || id.includes("business") || name.includes("business")) return 1;
    if (
      id.includes("lifetime") ||
      name.includes("lifetime") ||
      p.lifetimePrice != null
    ) {
      return 2;
    }
    return 50;
  }
  return [...plans].sort((a, b) => rank(a) - rank(b));
}

export function cardPlans(plans: PricingPlan[]): PricingPlan[] {
  const marketing = publicMarketingPlans(plans);
  return sortCardDisplayOrder(marketing.filter((p) => p !== enterprisePlan(marketing)));
}

/** Append billing cycle onto a plan CTA href — never attach client-side prices. */
export function withPlanSelectionParams(
  href: string,
  selection: { billingCycle: BillingCycle }
): string {
  if (!href.startsWith("/signup") && !href.startsWith("/contact")) return href;
  const url = new URL(href, "https://waamto.invalid");
  url.searchParams.set("billing_cycle", selection.billingCycle);
  // Explicitly strip any legacy pricing query params if present on href
  for (const key of ["price", "discount", "original_price", "savings"]) {
    url.searchParams.delete(key);
  }
  return `${url.pathname}${url.search}`;
}

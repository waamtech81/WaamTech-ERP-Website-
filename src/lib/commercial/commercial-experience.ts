/**
 * Website Phase 2 helpers — consume License Engine commercial foundation only.
 * No local plan/module/industry catalogues.
 */

import type { PricingPlan } from "@/types";
import type {
  PublicCommercialRegistry,
  PublicCommercialRegistrySummary,
} from "@/lib/commercial/types";

export type CommercialPlanKind =
  | "starter"
  | "business"
  | "lifetime"
  | "enterprise"
  | "white_label"
  | "custom_erp"
  | "other";

function planHay(plan: {
  id?: string | null;
  name?: string | null;
  slug?: string | null;
  plan_code?: string | null;
}): string {
  return [plan.id, plan.name, plan.slug, plan.plan_code]
    .map((v) => String(v || "").toLowerCase())
    .join(" ");
}

function isBuildYourOwnLocal(plan: {
  id?: string | null;
  name?: string | null;
  slug?: string | null;
}): boolean {
  const hay = planHay(plan);
  return (
    hay.includes("custom-erp") ||
    hay.includes("custom erp") ||
    hay.includes("build your own")
  );
}

function isTrialLocal(plan: {
  id?: string | null;
  name?: string | null;
  slug?: string | null;
  plan_type?: string | null;
  tier?: string | null;
  pricing_type?: string | null;
}): boolean {
  const slug = String(plan.slug || plan.id || "").toLowerCase();
  const name = String(plan.name || "").toLowerCase();
  const tier = String(plan.tier || "").toLowerCase();
  const planType = String(plan.plan_type || "").toLowerCase();
  const pricingType = String(plan.pricing_type || "").toLowerCase();
  if (planType === "trial" || tier === "trial" || pricingType === "trial") return true;
  if (slug === "trial" || slug.includes("trial")) return true;
  if (name === "trial" || name === "free trial" || /\btrial plan\b/.test(name)) return true;
  return false;
}

export function isWhiteLabelPlan(plan: {
  id?: string | null;
  name?: string | null;
  slug?: string | null;
  plan_code?: string | null;
}): boolean {
  return /\bwhite[\s_-]?label\b|\bwhitelabel\b/.test(planHay(plan));
}

export function isEnterpriseManualPlan(plan: {
  id?: string | null;
  name?: string | null;
  slug?: string | null;
  plan_code?: string | null;
  contactSales?: boolean;
  contact_sales?: boolean;
}): boolean {
  if (isWhiteLabelPlan(plan) || isBuildYourOwnLocal(plan) || isTrialLocal(plan)) {
    return false;
  }
  const hay = planHay(plan);
  if (/\benterprise\b/.test(hay)) return true;
  return (
    Boolean(plan.contactSales || plan.contact_sales) &&
    !/\blifetime\b|\bbusiness\b|\bstarter\b/.test(hay)
  );
}

export function classifyCommercialPlan(plan: {
  id?: string | null;
  name?: string | null;
  slug?: string | null;
  plan_code?: string | null;
  contactSales?: boolean;
  contact_sales?: boolean;
}): CommercialPlanKind {
  if (isBuildYourOwnLocal(plan)) return "custom_erp";
  if (isWhiteLabelPlan(plan)) return "white_label";
  if (isEnterpriseManualPlan(plan)) return "enterprise";
  const hay = planHay(plan);
  if (/\bstarter\b/.test(hay)) return "starter";
  if (/\blifetime\b/.test(hay)) return "lifetime";
  if (/\bbusiness\b/.test(hay) && !/\bprofile\b/.test(hay)) return "business";
  return "other";
}

/** Self-serve pricing cards only — Starter / Business / Lifetime. */
export function isSelfServePredefinedPlan(plan: {
  id?: string | null;
  name?: string | null;
  slug?: string | null;
  plan_code?: string | null;
  contactSales?: boolean;
  contact_sales?: boolean;
}): boolean {
  const kind = classifyCommercialPlan(plan);
  return kind === "starter" || kind === "business" || kind === "lifetime";
}

export function whiteLabelPlan(plans: PricingPlan[]): PricingPlan | undefined {
  return plans.find((p) => isWhiteLabelPlan(p) && !isTrialLocal(p));
}

/** Synthetic contact-sales card when White Label / Enterprise are non-public in Engine plans API. */
export function contactSalesPlanFromRegistry(
  registry: PublicCommercialRegistry | PublicCommercialRegistrySummary | null | undefined,
  code: "ENTERPRISE" | "WHITE_LABEL"
): PricingPlan | null {
  if (!registry) return null;
  const full = "plans" in registry ? registry.plans : null;
  const meta = full?.find((p) => p.code === code);
  const manuals = registry.manual_products || [];
  if (!meta && manuals.length > 0 && !manuals.includes(code)) return null;
  const slug = meta?.slug || (code === "WHITE_LABEL" ? "white-label" : "enterprise");
  const name = meta?.name || (code === "WHITE_LABEL" ? "White Label" : "Enterprise");
  const description =
    meta?.description ||
    (code === "WHITE_LABEL"
      ? "Manual white-label commercial product for branded deployments. Sold via contact sales."
      : "Enterprise deployments with custom scale, security, and SLA. Sold via contact sales.");
  return {
    id: slug,
    name,
    subtitle: code === "WHITE_LABEL" ? "Manual white-label product" : "Contact sales",
    description,
    marketingSummary: description,
    monthlyPrice: null,
    yearlyPrice: null,
    lifetimePrice: null,
    contactSales: true,
    cta: "Contact Sales",
    href: `/contact?intent=${slug}`,
    ribbon: name,
    features: [],
  };
}

export function resolveManualPricingCards(input: {
  plans: PricingPlan[];
  registry?: PublicCommercialRegistry | PublicCommercialRegistrySummary | null;
}): { enterprise: PricingPlan | null; whiteLabel: PricingPlan | null } {
  const enterprise =
    input.plans.find((p) => isEnterpriseManualPlan(p)) ||
    contactSalesPlanFromRegistry(input.registry, "ENTERPRISE");
  const whiteLabel =
    whiteLabelPlan(input.plans) ||
    contactSalesPlanFromRegistry(input.registry, "WHITE_LABEL");
  return {
    enterprise: enterprise || null,
    whiteLabel: whiteLabel || null,
  };
}

export function predefinedHierarchyFromRegistry(
  registry?: PublicCommercialRegistrySummary | PublicCommercialRegistry | null
): string[] {
  if (!registry) return ["starter", "business", "lifetime"];
  if ("predefined_hierarchy" in registry && Array.isArray(registry.predefined_hierarchy) && registry.predefined_hierarchy.length) {
    return registry.predefined_hierarchy.map((s) => String(s).toLowerCase());
  }
  if ("plans" in registry && Array.isArray(registry.plans)) {
    const fromPlans = registry.plans
      .filter((p) => p.public_predefined_hierarchy)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((p) => p.slug.toLowerCase());
    if (fromPlans.length) return fromPlans;
  }
  return ["starter", "business", "lifetime"];
}

export function pricingGuideFromRegistry(
  registry?: PublicCommercialRegistry | null,
  fallbackPlans: PricingPlan[] = []
): Array<{ code: string; name: string; line: string; mode: string }> {
  if (registry?.plans?.length) {
    return [...registry.plans]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((p) => ({
        code: p.code,
        name: p.name,
        line: p.description,
        mode: p.commercial_mode,
      }));
  }
  return fallbackPlans
    .filter((p) => !isTrialLocal(p))
    .map((p) => ({
      code: classifyCommercialPlan(p).toUpperCase(),
      name: p.name,
      line: p.marketingSummary || p.description || p.subtitle || "",
      mode: p.contactSales
        ? "manual"
        : isBuildYourOwnLocal(p)
          ? "custom"
          : "predefined",
    }));
}

export function comparisonNoteFromRegistry(
  registry?: PublicCommercialRegistrySummary | PublicCommercialRegistry | null,
  engineNote?: string | null
): string {
  if (engineNote?.trim()) return engineNote.trim();
  const hierarchy = predefinedHierarchyFromRegistry(registry).join(" → ");
  const manuals = (registry?.manual_products || ["ENTERPRISE", "WHITE_LABEL"]).join(", ");
  return `Predefined inheritance: ${hierarchy}. ${manuals} are contact-sales / manual products (not predefined upgrade targets). Custom ERP is independent and built from selected modules and packs.`;
}

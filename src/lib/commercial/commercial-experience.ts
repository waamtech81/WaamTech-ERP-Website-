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

/** Map a pricing-card plan to License Engine registry plan_code. */
export function registryPlanCodeForPricingPlan(plan: {
  id?: string | null;
  name?: string | null;
  slug?: string | null;
  plan_code?: string | null;
}): string | null {
  const kind = classifyCommercialPlan(plan);
  switch (kind) {
    case "starter":
      return "STARTER";
    case "business":
      return "BUSINESS";
    case "lifetime":
      return "LIFETIME";
    case "enterprise":
      return "ENTERPRISE";
    case "white_label":
      return "WHITE_LABEL";
    case "custom_erp":
      return "CUSTOM_ERP";
    default:
      return null;
  }
}

/**
 * Comparison column order from License Engine commercial registry:
 * self-serve hierarchy → Custom ERP → Enterprise. White Label stays off the matrix.
 */
export function orderComparisonPlans(
  plans: PricingPlan[],
  registry?: PublicCommercialRegistry | PublicCommercialRegistrySummary | null
): PricingPlan[] {
  const hierarchy = predefinedHierarchyFromRegistry(registry).map((s) =>
    String(s).toLowerCase()
  );
  const filtered = plans.filter((p) => !isWhiteLabelPlan(p) && !isTrialLocal(p));

  function rank(p: PricingPlan): number {
    const kind = classifyCommercialPlan(p);
    if (kind === "custom_erp") return 80;
    if (kind === "enterprise") return 90;
    if (kind === "white_label") return 95;
    const slug = String(p.id || "").toLowerCase();
    const hi = hierarchy.findIndex(
      (h) => slug === h || slug.includes(h) || kind === h
    );
    if (hi >= 0) return hi;
    if (kind === "starter") return 0;
    if (kind === "business") return 1;
    if (kind === "lifetime") return 2;
    return 50;
  }

  return [...filtered].sort((a, b) => rank(a) - rank(b));
}

/**
 * Modules / Feature Packs / commercial capabilities from License Engine
 * `plan_entitlements` — never invent local commercial catalogues.
 */
export function registryEntitlementComparisonRows(
  plans: PricingPlan[],
  registry?: PublicCommercialRegistry | null
): Array<Record<string, string | boolean>> {
  if (!registry?.plan_entitlements?.length || !plans.length) return [];

  const entitlementByCode = new Map(
    registry.plan_entitlements.map((row) => [String(row.plan_code).toUpperCase(), row])
  );
  const planCodes = plans.map((p) => ({
    plan: p,
    code: registryPlanCodeForPricingPlan(p),
  }));

  const moduleMeta = new Map(
    (registry.modules || []).map((m) => [String(m.code).toUpperCase(), m])
  );
  const packMeta = new Map(
    (registry.feature_packs || []).map((p) => [String(p.code).toUpperCase(), p])
  );

  const moduleCodes = [
    ...new Set(
      registry.plan_entitlements.flatMap((r) =>
        (r.modules || [])
          .map((c) => String(c).toUpperCase())
          .filter((code) => {
            const meta = moduleMeta.get(code);
            return !meta?.platform_builtin;
          })
      )
    ),
  ].sort((a, b) => {
    const ao = moduleMeta.get(a)?.display_order ?? 999;
    const bo = moduleMeta.get(b)?.display_order ?? 999;
    if (ao !== bo) return ao - bo;
    return (moduleMeta.get(a)?.name || a).localeCompare(moduleMeta.get(b)?.name || b);
  });

  const packCodes = [
    ...new Set(
      registry.plan_entitlements.flatMap((r) =>
        (r.feature_packs || []).map((c) => String(c).toUpperCase())
      )
    ),
  ].sort((a, b) => {
    const ao = packMeta.get(a)?.display_order ?? 999;
    const bo = packMeta.get(b)?.display_order ?? 999;
    if (ao !== bo) return ao - bo;
    return (packMeta.get(a)?.name || a).localeCompare(packMeta.get(b)?.name || b);
  });

  const featureCodes = [
    ...new Set(
      registry.plan_entitlements.flatMap((r) =>
        (r.commercial_features || []).map((c) => String(c).toUpperCase())
      )
    ),
  ].sort();

  const rows: Array<Record<string, string | boolean>> = [];

  function entitlementCell(
    planCode: string | null,
    list: string[] | undefined,
    itemCode: string,
    customMode: boolean
  ): string | boolean {
    // Custom ERP: leave unset/false so applyCustomErpColumnCells maps builder icon.
    if (customMode) return false;
    if (!planCode) return "—";
    const entitled = (list || []).some(
      (c) => String(c).toUpperCase() === itemCode
    );
    return entitled;
  }

  if (moduleCodes.length) {
    rows.push({ name: "Modules", __section: true });
    for (const code of moduleCodes) {
      const meta = moduleMeta.get(code);
      const row: Record<string, string | boolean> = {
        name: meta?.name || code,
      };
      for (const { plan, code: planCode } of planCodes) {
        const ent = planCode ? entitlementByCode.get(planCode) : undefined;
        row[plan.id] = entitlementCell(
          planCode,
          ent?.modules,
          code,
          planCode === "CUSTOM_ERP"
        );
      }
      rows.push(row);
    }
  }

  if (packCodes.length) {
    rows.push({ name: "Feature Packs", __section: true });
    for (const code of packCodes) {
      const meta = packMeta.get(code);
      const row: Record<string, string | boolean> = {
        name: meta?.name || code,
      };
      for (const { plan, code: planCode } of planCodes) {
        const ent = planCode ? entitlementByCode.get(planCode) : undefined;
        row[plan.id] = entitlementCell(
          planCode,
          ent?.feature_packs,
          code,
          planCode === "CUSTOM_ERP"
        );
      }
      rows.push(row);
    }
  }

  if (featureCodes.length) {
    rows.push({ name: "Commercial capabilities", __section: true });
    for (const code of featureCodes) {
      const row: Record<string, string | boolean> = {
        name: code === "WHITE_LABEL" ? "White Label capability" : code,
      };
      for (const { plan, code: planCode } of planCodes) {
        const ent = planCode ? entitlementByCode.get(planCode) : undefined;
        row[plan.id] = entitlementCell(
          planCode,
          ent?.commercial_features,
          code,
          planCode === "CUSTOM_ERP"
        );
      }
      rows.push(row);
    }
  }

  return rows;
}

export function customErpPricingCopy(
  registry?: PublicCommercialRegistry | null
): { title: string; body: string } {
  const meta = registry?.plans?.find((p) => p.code === "CUSTOM_ERP");
  return {
    title: meta?.name || "Custom ERP",
    body:
      meta?.description ||
      "Independent Build Your Own ERP offering — configure modules and feature packs from the License Engine registry; not a predefined Starter / Business / Lifetime upgrade.",
  };
}

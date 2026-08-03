/**
 * Website Phase 2 helpers — consume License Engine commercial foundation only.
 * No local plan/module/industry catalogues.
 */

import type { PricingPlan } from "@/types";
import type {
  PublicCommercialRegistry,
  PublicCommercialRegistrySummary,
} from "@/lib/commercial/types";
import { formatCommercialCapabilityLabel } from "@/lib/commercial/capability-labels";

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
  const hierarchy = predefinedHierarchyFromRegistry(registry).join(" → ");
  const manuals = (registry?.manual_products || ["ENTERPRISE", "WHITE_LABEL"]).join(", ");
  const base =
    engineNote?.trim() ||
    `Predefined inheritance: ${hierarchy}. ${manuals} are contact-sales / manual products (not predefined upgrade targets). Custom ERP is independent and built from selected modules and packs.`;

  const extras: string[] = [];

  if (registry && "module_capabilities" in registry && Array.isArray(registry.module_capabilities)) {
    extras.push(
      "Module cells show Basic / Full / Advanced (for example Basic on Starter primary workflows, Full on Business+, Advanced Warehouse from Lifetime)."
    );
    extras.push(
      "Industry modules stay independent of predefined plans and are added only through industry selection."
    );
    extras.push(
      "Primary business workflows stay available on every included module — optional Full / Advanced upgrades never block core work."
    );
  }
  if (
    registry &&
    "custom_erp" in registry &&
    registry.custom_erp?.purchased_modules_fully_enabled
  ) {
    extras.push("Custom ERP purchased modules and feature packs are fully enabled.");
  }
  return extras.length ? `${base} ${extras.join(" ")}` : base;
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
 * Presentation-only marketing labels for commercial UI.
 * Does not change License Engine codes, APIs, or registry values.
 */
const MODULE_MARKETING_DISPLAY_NAMES: Record<string, string> = {
  crm: "Customer Relationship Management",
  inventory: "Inventory Management",
  finance: "Finance Management",
  procurement: "Purchase Management",
  purchase: "Purchase Management",
  sales: "Sales Management",
  wms: "Warehouse Management",
  warehouse: "Warehouse Management",
  hr: "Human Resources",
  pos: "Point of Sale",
  manufacturing: "Manufacturing",
  documents: "Document Management",
  file: "Document Management",
  support_system: "Support System",
  support: "Support System",
  reports: "Reporting",
  notifications: "Notifications",
  settings: "Settings",
};

const MODULE_MARKETING_BY_SHORT_LABEL: Record<string, string> = {
  crm: "Customer Relationship Management",
  inventory: "Inventory Management",
  finance: "Finance Management",
  purchase: "Purchase Management",
  procurement: "Purchase Management",
  "purchase management": "Purchase Management",
  sales: "Sales Management",
  "sales management": "Sales Management",
  warehouse: "Warehouse Management",
  wms: "Warehouse Management",
  "warehouse management": "Warehouse Management",
  "human resources": "Human Resources",
  pos: "Point of Sale",
  "point of sale": "Point of Sale",
  manufacturing: "Manufacturing",
  "file manager": "Document Management",
  "document management": "Document Management",
  support: "Support System",
  "support system": "Support System",
  reports: "Reporting",
  reporting: "Reporting",
  notifications: "Notifications",
  settings: "Settings",
};

/** Customer-friendly module label for pricing/marketing UI only. */
export function marketingModuleDisplayName(
  codeOrName: string | null | undefined,
  fallback?: string | null
): string {
  const raw = String(codeOrName || "").trim();
  const fb = String(fallback || raw || "").trim();
  if (!raw && !fb) return "";

  const codeKey = raw
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_");
  if (MODULE_MARKETING_DISPLAY_NAMES[codeKey]) {
    return MODULE_MARKETING_DISPLAY_NAMES[codeKey];
  }

  const labelKey = fb.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (MODULE_MARKETING_BY_SHORT_LABEL[labelKey]) {
    return MODULE_MARKETING_BY_SHORT_LABEL[labelKey];
  }

  return fb || raw;
}

/**
 * Ensure Enterprise / White Label / Custom ERP columns exist when Engine registry
 * exposes them (synthetic cards when plans API omits manual products).
 */
export function plansForCommercialComparison(input: {
  plans: PricingPlan[];
  registry?: PublicCommercialRegistry | PublicCommercialRegistrySummary | null;
}): PricingPlan[] {
  const base = input.plans.filter((p) => !isTrialLocal(p));
  const manuals = resolveManualPricingCards({
    plans: base,
    registry: input.registry,
  });
  const byKind = new Map(base.map((p) => [classifyCommercialPlan(p), p]));
  const merged = [...base];
  if (manuals.enterprise && !byKind.has("enterprise")) {
    merged.push(manuals.enterprise);
  }
  if (manuals.whiteLabel && !byKind.has("white_label")) {
    merged.push(manuals.whiteLabel);
  }
  return merged;
}

/**
 * Comparison column order from License Engine commercial registry:
 * Starter → Business → Lifetime → Enterprise → White Label → Custom ERP.
 */
export function orderComparisonPlans(
  plans: PricingPlan[],
  registry?: PublicCommercialRegistry | PublicCommercialRegistrySummary | null
): PricingPlan[] {
  const hierarchy = predefinedHierarchyFromRegistry(registry).map((s) =>
    String(s).toLowerCase()
  );
  const filtered = plans.filter((p) => !isTrialLocal(p));

  function rank(p: PricingPlan): number {
    const kind = classifyCommercialPlan(p);
    if (kind === "enterprise") return 80;
    if (kind === "white_label") return 85;
    if (kind === "custom_erp") return 90;
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
 * Modules / Feature Packs / module capabilities / commercial features from
 * License Engine `plan_entitlements` + `module_capabilities` (FINAL v1.2.0) —
 * never invent local commercial catalogues.
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
    (registry.modules || []).map((m) => [String(m.code).toLowerCase(), m])
  );

  /** Map any entitlement token (legacy INV / WH / canonical) → registry module code. */
  const aliasToCanonical = new Map<string, string>();
  for (const mod of registry.modules || []) {
    aliasToCanonical.set(String(mod.code).toLowerCase(), mod.code);
    aliasToCanonical.set(String(mod.slug || "").toLowerCase(), mod.code);
    for (const alias of mod.legacy_aliases || []) {
      aliasToCanonical.set(String(alias).toLowerCase(), mod.code);
    }
  }

  function canonicalize(raw: string): string | null {
    const key = String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/-/g, "_");
    if (!key) return null;
    return aliasToCanonical.get(key) || (moduleMeta.has(key) ? key : null);
  }

  const packMeta = new Map(
    (registry.feature_packs || []).map((p) => [String(p.code).toUpperCase(), p])
  );

  const advancedFromByModule = new Map<string, string>();
  for (const row of registry.module_capabilities || []) {
    if (row.advanced_from_plan) {
      advancedFromByModule.set(
        String(row.module_code).toLowerCase(),
        String(row.advanced_from_plan).toUpperCase()
      );
    }
  }

  const capabilityByPlanModule = new Map<string, "basic" | "advanced">();
  for (const row of registry.plan_entitlements) {
    const plan = String(row.plan_code).toUpperCase();
    for (const cap of row.module_capabilities || []) {
      capabilityByPlanModule.set(
        `${plan}:${String(cap.module_code).toLowerCase()}`,
        cap.level
      );
    }
  }
  // Fallback: full matrix when plan_entitlements omit embedded capabilities.
  if (!capabilityByPlanModule.size && registry.module_capabilities?.length) {
    for (const row of registry.module_capabilities) {
      if (row.industry_independent || row.platform_builtin) continue;
      for (const lvl of row.levels_by_plan || []) {
        if (!lvl.level) continue;
        capabilityByPlanModule.set(
          `${String(lvl.plan_code).toUpperCase()}:${String(row.module_code).toLowerCase()}`,
          lvl.level
        );
      }
    }
  }

  const moduleCodes = [
    ...new Set(
      registry.plan_entitlements.flatMap((r) =>
        (r.modules || [])
          .map((c) => canonicalize(c))
          .filter((code): code is string => {
            if (!code) return false;
            const meta = moduleMeta.get(code.toLowerCase());
            if (meta?.platform_builtin) return false;
            if (meta?.category === "Industry") return false;
            return true;
          })
      )
    ),
  ].sort((a, b) => {
    const ao = moduleMeta.get(a.toLowerCase())?.display_order ?? 999;
    const bo = moduleMeta.get(b.toLowerCase())?.display_order ?? 999;
    if (ao !== bo) return ao - bo;
    return (moduleMeta.get(a.toLowerCase())?.name || a).localeCompare(
      moduleMeta.get(b.toLowerCase())?.name || b
    );
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
  ].sort((a, b) => {
    const ao = packMeta.get(a)?.display_order ?? 999;
    const bo = packMeta.get(b)?.display_order ?? 999;
    if (ao !== bo) return ao - bo;
    return marketingCapabilityDisplayName(a, packMeta.get(a)?.name).localeCompare(
      marketingCapabilityDisplayName(b, packMeta.get(b)?.name)
    );
  });

  const rows: Array<Record<string, string | boolean>> = [];

  function entitlementIncluded(
    planCode: string | null,
    list: string[] | undefined,
    itemCode: string,
    customMode: boolean
  ): boolean {
    if (customMode || !planCode) return false;
    const target = String(itemCode).toUpperCase();
    return (list || []).some((c) => String(c).toUpperCase() === target);
  }

  /**
   * FINAL V1.2.0 customer-facing capability labels from License Engine levels:
   * basic → Basic, advanced @ Business → Full, advanced from Lifetime+ → Advanced.
   */
  function formatCapabilityLabel(
    moduleCode: string,
    level: "basic" | "advanced" | null | undefined
  ): string | boolean {
    const labeled = formatCommercialCapabilityLabel(level, {
      moduleCode,
      advancedFromPlan: advancedFromByModule.get(moduleCode.toLowerCase()) || null,
    });
    return labeled || false;
  }

  function moduleCell(
    planCode: string | null,
    moduleCode: string,
    customMode: boolean
  ): string | boolean {
    if (customMode) return false;
    if (!planCode) return "—";
    const cap = capabilityByPlanModule.get(`${planCode}:${moduleCode.toLowerCase()}`);
    const labeled = formatCapabilityLabel(moduleCode, cap || null);
    if (labeled) return labeled;
    const ent = entitlementByCode.get(planCode);
    const entitled = (ent?.modules || []).some((c) => canonicalize(c) === moduleCode);
    return entitled;
  }

  if (moduleCodes.length) {
    rows.push({ name: "Modules (Basic / Full / Advanced)", __section: true });
    for (const code of moduleCodes) {
      const meta = moduleMeta.get(code.toLowerCase());
      const row: Record<string, string | boolean> = {
        name: marketingModuleDisplayName(code, meta?.name || code),
      };
      for (const { plan, code: planCode } of planCodes) {
        row[plan.id] = moduleCell(planCode, code, planCode === "CUSTOM_ERP");
      }
      rows.push(row);
    }
  }

  if (packCodes.length) {
    rows.push({ name: "Feature Packs", __section: true });
    for (const code of packCodes) {
      const meta = packMeta.get(code);
      const row: Record<string, string | boolean> = {
        name: meta?.name || marketingCapabilityDisplayName(code),
      };
      for (const { plan, code: planCode } of planCodes) {
        const ent = planCode ? entitlementByCode.get(planCode) : undefined;
        row[plan.id] = entitlementIncluded(
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
        name: marketingCapabilityDisplayName(code, packMeta.get(code)?.name),
      };
      for (const { plan, code: planCode } of planCodes) {
        const ent = planCode ? entitlementByCode.get(planCode) : undefined;
        row[plan.id] = entitlementIncluded(
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

/** Customer-friendly labels for LE commercial capability / pack codes (never show raw codes). */
export function marketingCapabilityDisplayName(
  code: string | null | undefined,
  engineName?: string | null
): string {
  const fromEngine = String(engineName || "").trim();
  if (fromEngine) return fromEngine;
  const key = String(code || "").trim().toUpperCase();
  const known: Record<string, string> = {
    WHITE_LABEL: "White Label capability",
    ADVANCED_WMS: "Advanced Warehouse",
    AUTOMATION: "Automation",
    ADVANCED_ANALYTICS: "Advanced Analytics",
    ENTERPRISE_INTEGRATIONS: "Enterprise Integrations",
    ENTERPRISE_CAPABILITIES: "Enterprise features",
    CORE_OPS: "Core Operations",
    GROWTH: "Growth Pack",
    LIFETIME_SUITE: "Lifetime Suite",
    ENTERPRISE_SUITE: "Enterprise Suite",
  };
  if (known[key]) return known[key];
  return key
    .toLowerCase()
    .split(/[_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function customErpPricingCopy(
  registry?: PublicCommercialRegistry | null
): { title: string; body: string } {
  const meta = registry?.plans?.find((p) => p.code === "CUSTOM_ERP");
  return {
    title: meta?.name || "Custom ERP",
    body:
      (meta?.description ||
        "Independent Build Your Own ERP — configure modules and feature packs yourself; not a predefined Starter / Business / Lifetime upgrade.") +
      " Purchased modules and feature packs are fully enabled.",
  };
}

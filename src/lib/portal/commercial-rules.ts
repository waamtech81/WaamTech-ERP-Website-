/**
 * Portal Phase 3 — commercial experience rules from License Engine foundation.
 * No hardcoded plan catalogues; reuse Website commercial-experience classifiers.
 */

import type { PricingPlan } from "@/types";
import {
  classifyCommercialPlan,
  isEnterpriseManualPlan,
  isSelfServePredefinedPlan,
  isWhiteLabelPlan,
  type CommercialPlanKind,
} from "@/lib/commercial/commercial-experience";
import { formatCommercialCapabilityLabel } from "@/lib/commercial/capability-labels";
import type {
  PublicCommercialRegistry,
  PublicCommercialRegistrySummary,
} from "@/lib/commercial/types";
import type { PortalLicense } from "@/lib/portal/dashboard";
import type { PortalCommercialSnapshot } from "@/lib/portal/commercial-snapshot";
import { isCustomErpPackageType } from "@/lib/portal/package-type";

export type PortalPlanTier =
  | "starter"
  | "business"
  | "lifetime"
  | "enterprise"
  | "white_label"
  | "custom"
  | "unknown";

/** Default self-serve upgrade map when registry paths are unavailable. */
const DEFAULT_UPGRADE_TARGETS: Record<string, string[]> = {
  starter: ["business", "lifetime"],
  business: ["lifetime"],
  lifetime: [],
  enterprise: [],
  white_label: [],
  custom: [],
  unknown: ["starter", "business", "lifetime"],
};

function hay(...parts: Array<string | null | undefined>): string {
  return parts
    .map((p) => String(p || "").toLowerCase())
    .join(" ");
}

export function resolvePortalPlanTier(input: {
  plan_name?: string | null;
  plan_code?: string | null;
  plan_slug?: string | null;
  plan_id?: string | null;
  package_type?: string | null;
  billing_cycle?: string | null;
  currentPlan?: string | null;
} | null | undefined): PortalPlanTier {
  if (!input) return "unknown";
  if (isCustomErpPackageType(input.package_type)) return "custom";

  const kind = classifyCommercialPlan({
    id: input.plan_id || input.plan_slug || input.currentPlan,
    name: input.plan_name || input.currentPlan,
    slug: input.plan_slug || input.plan_code,
    plan_code: input.plan_code,
  });

  if (kind === "custom_erp") return "custom";
  if (kind === "white_label") return "white_label";
  if (kind === "enterprise") return "enterprise";
  if (kind === "starter" || kind === "business" || kind === "lifetime") return kind;

  const h = hay(
    input.plan_name,
    input.plan_code,
    input.plan_slug,
    input.currentPlan,
    input.billing_cycle
  );
  if (/\bwhite[\s_-]?label\b/.test(h)) return "white_label";
  if (/\benterprise\b/.test(h)) return "enterprise";
  if (/\blifetime\b/.test(h)) return "lifetime";
  if (/\bstarter\b/.test(h)) return "starter";
  if (/\bbusiness\b/.test(h) && !/\bprofile\b/.test(h)) return "business";
  return "unknown";
}

function slugKindsFromRegistryPath(to: string): PortalPlanTier[] {
  const raw = String(to || "").toLowerCase();
  if (raw.includes("lifetime")) return ["lifetime"];
  if (raw.includes("business")) return ["business"];
  if (raw.includes("starter")) return ["starter"];
  return [];
}

export function allowedSelfServeUpgradeTiers(
  current: PortalPlanTier,
  registry?: PublicCommercialRegistry | PublicCommercialRegistrySummary | null
): PortalPlanTier[] {
  if (current === "custom" || current === "enterprise" || current === "white_label") {
    return [];
  }

  const paths = registry?.predefined_upgrade_paths;
  if (Array.isArray(paths) && paths.length) {
    const fromKeys =
      current === "starter"
        ? ["STARTER", "starter"]
        : current === "business"
          ? ["BUSINESS", "business"]
          : current === "lifetime"
            ? ["LIFETIME", "lifetime"]
            : [];
    const targets = new Set<PortalPlanTier>();
    for (const path of paths) {
      const from = String(path.from || "").toUpperCase();
      if (!fromKeys.some((k) => from === k.toUpperCase())) continue;
      for (const t of slugKindsFromRegistryPath(path.to)) targets.add(t);
    }
    return Array.from(targets);
  }

  return (DEFAULT_UPGRADE_TARGETS[current] || []) as PortalPlanTier[];
}

export function isManualCommercialTier(tier: PortalPlanTier): boolean {
  return tier === "enterprise" || tier === "white_label";
}

/** True when predefined portal may offer self-serve plan upgrade UI. */
export function canSelfServeUpgrade(
  current: PortalPlanTier,
  registry?: PublicCommercialRegistry | PublicCommercialRegistrySummary | null
): boolean {
  if (current === "custom") return false;
  if (isManualCommercialTier(current)) return false;
  return allowedSelfServeUpgradeTiers(current, registry).length > 0;
}

export function filterPlansForPortalFlow(input: {
  plans: PricingPlan[];
  mode: "upgrade" | "renew" | "new_place";
  currentTier: PortalPlanTier;
  registry?: PublicCommercialRegistry | PublicCommercialRegistrySummary | null;
  currentPlanId?: string | null;
}): PricingPlan[] {
  const selfServe = input.plans.filter(
    (p) =>
      Boolean(p.planId) &&
      isSelfServePredefinedPlan(p) &&
      !p.contactSales &&
      !isEnterpriseManualPlan(p) &&
      !isWhiteLabelPlan(p)
  );

  if (input.mode === "new_place" || input.mode === "renew") {
    return selfServe;
  }

  // Upgrade: only registry-approved targets (never Enterprise / White Label / Custom).
  const allowed = new Set(allowedSelfServeUpgradeTiers(input.currentTier, input.registry));
  return selfServe.filter((p) => {
    const kind = classifyCommercialPlan(p) as CommercialPlanKind;
    const tier =
      kind === "starter" || kind === "business" || kind === "lifetime"
        ? kind
        : resolvePortalPlanTier({
            plan_name: p.name,
            plan_slug: p.id,
            plan_id: p.planId,
          });
    if (!allowed.has(tier as PortalPlanTier)) return false;
    // Don't advertise current plan as an upgrade target.
    if (input.currentPlanId && p.planId === input.currentPlanId) return false;
    return true;
  });
}

export function recommendedUpgradePlan(
  plans: PricingPlan[],
  currentTier: PortalPlanTier,
  registry?: PublicCommercialRegistry | PublicCommercialRegistrySummary | null
): PricingPlan | null {
  const allowed = allowedSelfServeUpgradeTiers(currentTier, registry);
  const prefer = allowed.includes("business")
    ? "business"
    : allowed.includes("lifetime")
      ? "lifetime"
      : null;
  if (!prefer) return null;
  return (
    plans.find((p) => classifyCommercialPlan(p) === prefer) ||
    plans.find((p) => resolvePortalPlanTier({ plan_name: p.name, plan_slug: p.id }) === prefer) ||
    null
  );
}

export function manualProductContactHref(tier: PortalPlanTier): string | null {
  if (tier === "enterprise") return "/contact?intent=enterprise";
  if (tier === "white_label") return "/contact?intent=white-label";
  return null;
}

export function upgradeActionForPortal(input: {
  journey: "custom" | "predefined";
  currentTier: PortalPlanTier;
  registry?: PublicCommercialRegistry | PublicCommercialRegistrySummary | null;
  subscriptionId?: string | null;
}): {
  kind: "custom_modify" | "self_serve_upgrade" | "contact_sales" | "none";
  href: string | null;
  label: string;
  hint: string;
} {
  if (input.journey === "custom" || input.currentTier === "custom") {
    return {
      kind: "custom_modify",
      href: "/portal/custom-erp",
      label: "Modify package",
      hint: "Modules · feature packs · limits — Custom ERP stays independent; purchases are fully enabled",
    };
  }
  if (isManualCommercialTier(input.currentTier)) {
    return {
      kind: "contact_sales",
      href: manualProductContactHref(input.currentTier),
      label: "Contact Sales",
      hint: "Enterprise / White Label are arranged with Waamto Sales (not self-serve plan upgrades)",
    };
  }
  if (!canSelfServeUpgrade(input.currentTier, input.registry)) {
    return {
      kind: "none",
      href: null,
      label: "Upgrade",
      hint: "No self-serve upgrade path for this plan in the License Engine registry",
    };
  }
  const q = new URLSearchParams({ intent: "upgrade" });
  if (input.subscriptionId) q.set("subscription_id", input.subscriptionId);
  return {
    kind: "self_serve_upgrade",
    href: `/portal/plans?${q.toString()}`,
    label: "Upgrade plan",
    hint: "Starter → Business / Lifetime · Business → Lifetime · Industry modules stay separate",
  };
}

/** Entitled module labels/codes from license + active snapshot (Custom ERP prefers snapshot). */
export function entitledModules(input: {
  journey: "custom" | "predefined";
  license: PortalLicense | null;
  snapshot: PortalCommercialSnapshot | null | undefined;
  fallbackLicenses?: PortalLicense[];
}): string[] {
  const snap = input.snapshot;
  if (input.journey === "custom" && snap) {
    const codes =
      (snap.selected_modules?.length && snap.selected_modules) ||
      (snap.modules?.length && snap.modules) ||
      snap.effective_modules ||
      [];
    if (codes.length) return Array.from(new Set(codes.map(String).filter(Boolean)));
  }
  const primary = input.license;
  if (primary?.modules?.length) return Array.from(new Set(primary.modules.filter(Boolean)));
  const flat = (input.fallbackLicenses || []).flatMap((l) => l.modules || []);
  return Array.from(new Set(flat.filter(Boolean)));
}

export function entitledFeaturePacks(input: {
  journey: "custom" | "predefined";
  license: PortalLicense | null;
  snapshot: PortalCommercialSnapshot | null | undefined;
  fallbackPacks?: string[];
  fallbackLicenses?: PortalLicense[];
}): string[] {
  const snap = input.snapshot;
  if (input.journey === "custom" && snap?.feature_packs?.length) {
    return Array.from(new Set(snap.feature_packs.map(String).filter(Boolean)));
  }
  const primary = input.license;
  if (primary?.feature_packs?.length) {
    return Array.from(new Set(primary.feature_packs.filter(Boolean)));
  }
  if (input.fallbackPacks?.length) {
    return Array.from(new Set(input.fallbackPacks.filter(Boolean)));
  }
  const flat = (input.fallbackLicenses || []).flatMap((l) => l.feature_packs || []);
  return Array.from(new Set(flat.filter(Boolean)));
}

const TIER_TO_PLAN_CODE: Record<PortalPlanTier, string | null> = {
  starter: "STARTER",
  business: "BUSINESS",
  lifetime: "LIFETIME",
  enterprise: "ENTERPRISE",
  white_label: "WHITE_LABEL",
  custom: "CUSTOM_ERP",
  unknown: null,
};

export function registryPlanCodeFromPortalTier(tier: PortalPlanTier): string | null {
  return TIER_TO_PLAN_CODE[tier] ?? null;
}

function canonicalizeRegistryModuleCode(
  registry: PublicCommercialRegistry | null | undefined,
  raw: string
): string | null {
  const key = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  if (!key || !registry?.modules?.length) return key || null;
  for (const mod of registry.modules) {
    if (String(mod.code).toLowerCase() === key) return mod.code;
    if (String(mod.slug || "").toLowerCase() === key) return mod.code;
    if (String(mod.name || "").toLowerCase() === key) return mod.code;
    for (const alias of mod.legacy_aliases || []) {
      if (String(alias).toLowerCase() === key) return mod.code;
    }
  }
  return key;
}

/**
 * Resolve engine basic|advanced for an active license module from License Engine registry v1.2.
 * Display uses formatCapabilityLabel → Basic | Full | Advanced.
 * Custom ERP → advanced (display Full) when purchased. Industry modules → null (independent of plans).
 */
export function resolvePortalModuleCapability(input: {
  moduleLabelOrCode: string;
  planTier: PortalPlanTier;
  journey: "custom" | "predefined";
  registry?: PublicCommercialRegistry | null;
}): "basic" | "advanced" | null {
  const registry = input.registry;
  if (!registry) {
    return input.journey === "custom" ? "advanced" : null;
  }

  if (input.journey === "custom" || input.planTier === "custom") {
    return registry.custom_erp?.purchased_modules_capability_level === "advanced"
      ? "advanced"
      : "advanced";
  }

  const planCode = registryPlanCodeFromPortalTier(input.planTier);
  if (!planCode) return null;

  const canonical = canonicalizeRegistryModuleCode(registry, input.moduleLabelOrCode);
  if (!canonical) return null;

  const meta = registry.modules?.find(
    (m) => String(m.code).toLowerCase() === canonical.toLowerCase()
  );
  if (meta?.category === "Industry") return null;

  const fromMatrix = registry.module_capabilities?.find(
    (r) => String(r.module_code).toLowerCase() === canonical.toLowerCase()
  );
  if (fromMatrix?.industry_independent) return null;
  if (fromMatrix) {
    const hit = fromMatrix.levels_by_plan.find(
      (l) => String(l.plan_code).toUpperCase() === planCode
    );
    if (hit?.level) return hit.level;
  }

  const ent = registry.plan_entitlements?.find(
    (r) => String(r.plan_code).toUpperCase() === planCode
  );
  const embedded = ent?.module_capabilities?.find(
    (c) => String(c.module_code).toLowerCase() === canonical.toLowerCase()
  );
  return embedded?.level ?? null;
}

export function annotateEntitledModulesWithCapability(input: {
  modules: string[];
  planTier: PortalPlanTier;
  journey: "custom" | "predefined";
  registry?: PublicCommercialRegistry | null;
}): Array<{ label: string; capability: "basic" | "advanced" | null }> {
  return input.modules.map((label) => ({
    label,
    capability: resolvePortalModuleCapability({
      moduleLabelOrCode: label,
      planTier: input.planTier,
      journey: input.journey,
      registry: input.registry || null,
    }),
  }));
}

export function formatCapabilityLabel(
  level: "basic" | "advanced" | null,
  opts?: {
    moduleCode?: string | null;
    registry?: PublicCommercialRegistry | null;
    customErp?: boolean;
  }
): string | null {
  return formatCommercialCapabilityLabel(level, {
    moduleCode: opts?.moduleCode,
    registry: opts?.registry || null,
    customErp: opts?.customErp === true,
  });
}

export function licenseSnapshotMeta(
  snapshot: PortalCommercialSnapshot | null | undefined
): Array<{ label: string; value: string }> {
  // Customer-safe package label only — IDs/versions belong in technicalLicenseMeta.
  if (!snapshot) return [];
  const rows: Array<{ label: string; value: string }> = [];
  if (snapshot.package_type) {
    rows.push({
      label: "Package",
      value: isCustomErpPackageType(snapshot.package_type) ? "Custom ERP" : String(snapshot.package_type),
    });
  }
  return rows;
}

/** Internal identifiers — show only inside collapsed Technical Details. */
export function technicalLicenseMeta(input: {
  snapshot?: PortalCommercialSnapshot | null;
  licenseId?: string | null;
  keyMasked?: string | null;
  planType?: string | null;
  deploymentType?: string | null;
  packageMode?: string | null;
}): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [];
  const snap = input.snapshot;
  if (input.keyMasked) rows.push({ label: "License key", value: input.keyMasked });
  if (input.licenseId) rows.push({ label: "License ID", value: String(input.licenseId) });
  if (snap?.snapshot_id) rows.push({ label: "Snapshot ID", value: String(snap.snapshot_id) });
  if (snap?.snapshot_version != null && snap.snapshot_version !== "") {
    rows.push({ label: "Snapshot version", value: String(snap.snapshot_version) });
  }
  if (snap?.package_type) {
    rows.push({ label: "Package type (internal)", value: String(snap.package_type) });
  }
  if (input.packageMode || snap?.package_mode) {
    rows.push({
      label: "Package mode (internal)",
      value: String(input.packageMode || snap?.package_mode),
    });
  }
  if (input.planType) rows.push({ label: "Plan type (internal)", value: String(input.planType) });
  if (input.deploymentType) {
    rows.push({ label: "Deployment type (internal)", value: String(input.deploymentType) });
  }
  return rows.filter((r) => r.value && r.value !== "—");
}

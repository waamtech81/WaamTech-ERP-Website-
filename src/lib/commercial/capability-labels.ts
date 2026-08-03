/**
 * Customer-facing capability labels — Website + Portal SSOT.
 * Engine levels remain basic|advanced; marketing shows Basic|Full|Advanced|Fully Enabled.
 *
 * Rules (FINAL V1.2):
 * - basic → Basic
 * - advanced + advanced_from_plan BUSINESS (or unset) → Full
 * - advanced + advanced_from_plan LIFETIME | ENTERPRISE | WHITE_LABEL → Advanced
 * - Custom ERP purchased modules → Fully Enabled (never Advanced)
 */

import type { PublicCommercialRegistry } from "@/lib/commercial/types";

export type CommercialCapabilityMarketingLabel =
  | "Basic"
  | "Full"
  | "Advanced"
  | "Fully Enabled";

const ADVANCED_MARKETING_PLANS = new Set([
  "LIFETIME",
  "ENTERPRISE",
  "WHITE_LABEL",
]);

function resolveAdvancedFromPlan(opts?: {
  moduleCode?: string | null;
  advancedFromPlan?: string | null;
  registry?: PublicCommercialRegistry | null;
}): string | null {
  if (opts?.advancedFromPlan) {
    return String(opts.advancedFromPlan).trim().toUpperCase() || null;
  }
  const code = String(opts?.moduleCode || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  if (!code || !opts?.registry?.module_capabilities?.length) return null;
  const row = opts.registry.module_capabilities.find((r) => {
    const mc = String(r.module_code || "")
      .trim()
      .toLowerCase()
      .replace(/-/g, "_");
    return mc === code || mc === code.replace(/_/g, "");
  });
  if (!row && opts.registry.modules?.length) {
    const meta = opts.registry.modules.find((m) => {
      const c = String(m.code || "")
        .toLowerCase()
        .replace(/-/g, "_");
      const n = String(m.name || "").toLowerCase();
      const needle = String(opts.moduleCode || "").trim().toLowerCase();
      return c === code || n === needle;
    });
    if (meta) {
      const byCode = opts.registry.module_capabilities.find(
        (r) =>
          String(r.module_code || "")
            .toLowerCase()
            .replace(/-/g, "_") ===
          String(meta.code || "")
            .toLowerCase()
            .replace(/-/g, "_")
      );
      return byCode?.advanced_from_plan
        ? String(byCode.advanced_from_plan).toUpperCase()
        : null;
    }
  }
  return row?.advanced_from_plan
    ? String(row.advanced_from_plan).toUpperCase()
    : null;
}

export function formatCommercialCapabilityLabel(
  level: "basic" | "advanced" | null | undefined,
  opts?: {
    moduleCode?: string | null;
    advancedFromPlan?: string | null;
    registry?: PublicCommercialRegistry | null;
    /** Custom ERP purchases are fully enabled — never label as Advanced. */
    customErp?: boolean;
  }
): CommercialCapabilityMarketingLabel | null {
  if (level === "basic") return "Basic";
  if (level !== "advanced") return null;
  if (opts?.customErp) return "Fully Enabled";
  const from = resolveAdvancedFromPlan(opts);
  if (from && ADVANCED_MARKETING_PLANS.has(from)) return "Advanced";
  return "Full";
}

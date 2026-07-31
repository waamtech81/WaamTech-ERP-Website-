/**
 * Custom ERP billing SSOT — Build Your Own Custom ERP.
 *
 * Allowed purchase cycles: monthly, yearly only.
 * Lifetime remains valid for Predefined ERP and other products — never for Custom ERP.
 *
 * Use these helpers everywhere Custom ERP presents or accepts a billing cycle.
 * Do not scatter ad-hoc `!== "lifetime"` checks across UI components.
 */

import type { BillingCycle } from "@/lib/commercial/types";

export const CUSTOM_ERP_BILLING_CYCLES = ["monthly", "yearly"] as const;

export type CustomErpBillingCycle = (typeof CUSTOM_ERP_BILLING_CYCLES)[number];

export const CUSTOM_ERP_BILLING_CYCLE_OPTIONS: ReadonlyArray<{
  id: CustomErpBillingCycle;
  label: string;
  hint: string;
}> = [
  { id: "monthly", label: "Monthly", hint: "Billed every month" },
  { id: "yearly", label: "Yearly", hint: "Billed once a year" },
];

/** True when package / product type is Build Your Own Custom ERP. */
export function isCustomErpProductType(
  packageOrProductType?: string | null
): boolean {
  const raw = String(packageOrProductType || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (!raw) return false;
  return (
    raw === "custom" ||
    raw === "custom_erp" ||
    raw === "build_your_own" ||
    raw === "build_your_own_custom_erp" ||
    raw.includes("custom_erp") ||
    raw.includes("build_your_own")
  );
}

export function isCustomErpBillingCycle(
  cycle: string | null | undefined
): cycle is CustomErpBillingCycle {
  const c = String(cycle || "")
    .trim()
    .toLowerCase();
  return c === "monthly" || c === "yearly";
}

/** Lifetime (and any other cycle) is never purchaseable for Custom ERP. */
export function isLifetimeForbiddenForCustomErp(
  cycle: string | null | undefined
): boolean {
  const c = String(cycle || "")
    .trim()
    .toLowerCase();
  return c === "lifetime" || c === "one_time" || c === "one-time" || c === "once";
}

/**
 * Normalize a cycle for Custom ERP surfaces.
 * Invalid / lifetime → default monthly (never surface Lifetime).
 */
export function normalizeCustomErpBillingCycle(
  cycle: string | null | undefined,
  fallback: CustomErpBillingCycle = "monthly"
): CustomErpBillingCycle {
  if (isCustomErpBillingCycle(cycle)) return cycle;
  return fallback;
}

/**
 * Filter any billing-cycle list for Custom ERP presentation.
 * Non-custom products return the list unchanged (Lifetime may remain).
 */
export function billingCyclesForProductType<T extends { id: string }>(
  packageOrProductType: string | null | undefined,
  cycles: readonly T[]
): T[] {
  if (!isCustomErpProductType(packageOrProductType)) {
    return [...cycles];
  }
  return cycles.filter((c) => isCustomErpBillingCycle(c.id));
}

export type CustomErpBillingValidation =
  | { ok: true; cycle: CustomErpBillingCycle }
  | { ok: false; message: string; code: "CUSTOM_ERP_LIFETIME_FORBIDDEN" | "BILLING_CYCLE_INVALID" };

/**
 * Backend / API guard — reject Custom ERP + Lifetime (and unknown cycles).
 */
export function validateCustomErpBillingCycle(
  cycle: string | null | undefined
): CustomErpBillingValidation {
  const c = String(cycle || "")
    .trim()
    .toLowerCase();
  if (isLifetimeForbiddenForCustomErp(c)) {
    return {
      ok: false,
      code: "CUSTOM_ERP_LIFETIME_FORBIDDEN",
      message:
        "Lifetime billing is not available for Build your own custom ERP. Choose Monthly or Yearly.",
    };
  }
  if (!isCustomErpBillingCycle(c)) {
    return {
      ok: false,
      code: "BILLING_CYCLE_INVALID",
      message: "Choose Monthly or Yearly billing for your Build your own custom ERP package.",
    };
  }
  return { ok: true, cycle: c };
}

/** Type-narrow helper when a full BillingCycle is required by shared types. */
export function asBillingCycle(cycle: CustomErpBillingCycle): BillingCycle {
  return cycle;
}

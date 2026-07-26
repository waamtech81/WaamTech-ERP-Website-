import type { PortalLicense } from "@/lib/portal/dashboard";

/** Commercial journey for Website Customer Portal rendering only. */
export type PortalCommercialJourney = "custom" | "predefined";

/** Normalize Engine / identity package_type into a portal journey. */
export function resolvePortalCommercialJourney(
  packageType?: string | null
): PortalCommercialJourney {
  const raw = String(packageType || "")
    .trim()
    .toLowerCase();
  if (raw === "custom" || raw === "custom_erp" || raw === "builder") {
    return "custom";
  }
  return "predefined";
}

export function isCustomErpPackageType(packageType?: string | null): boolean {
  return resolvePortalCommercialJourney(packageType) === "custom";
}

/** Prefer active/trial/grace license; fall back to first license. */
export function primaryPortalLicense(
  licenses: PortalLicense[] | null | undefined
): PortalLicense | null {
  if (!licenses?.length) return null;
  const active = licenses.find((l) =>
    ["active", "trial", "grace", "pending"].includes(
      String(l.effective_status || l.status).toLowerCase()
    )
  );
  return active || licenses[0] || null;
}

export function resolveJourneyFromLicenses(
  licenses: PortalLicense[] | null | undefined
): PortalCommercialJourney {
  const primary = primaryPortalLicense(licenses);
  if (!primary) return "predefined";
  if (licenseIsCustomErp(primary)) return "custom";
  return resolvePortalCommercialJourney(primary.package_type);
}

export function licenseIsCustomErp(license: PortalLicense | null | undefined): boolean {
  if (!license) return false;
  if (isCustomErpPackageType(license.package_type)) return true;
  // Fallback when Engine omits package_type but modules are present without a plan name
  const hasModules = (license.modules?.length || 0) > 0;
  const hasPlanName = Boolean(String(license.plan_name || "").trim());
  return hasModules && !hasPlanName;
}

/** Normalize billing cycle strings from License Engine / commercial subs. */
export function normalizeBillingCycle(cycle?: string | null): string {
  return String(cycle || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export function isLifetimeBillingCycle(cycle?: string | null): boolean {
  const raw = normalizeBillingCycle(cycle);
  return raw === "lifetime" || raw === "one_time" || raw === "once";
}

/** Lifetime packages never show renew / auto-renew surfaces. */
export function showRenewalUi(cycle?: string | null): boolean {
  return !isLifetimeBillingCycle(cycle);
}

export function resolvePrimaryBillingCycle(
  license: PortalLicense | null | undefined,
  subscriptions?: Array<{ billing_cycle?: string | null }> | null
): string | null {
  const fromLicense = String(license?.billing_cycle || "").trim();
  if (fromLicense) return fromLicense;
  const fromSub = String(subscriptions?.[0]?.billing_cycle || "").trim();
  return fromSub || null;
}

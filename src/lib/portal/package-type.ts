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

/**
 * Portal journey SSOT = active commercial license package_type (primary license).
 * Snapshot package_type is secondary when license is unset.
 * Custom ERP is sticky: license package_type=custom never reverts due to stale snapshot data.
 * Never infer from module counts, feature packs, cart, or UI state.
 */
export function resolveJourneyFromLicenses(
  licenses: PortalLicense[] | null | undefined,
  opts?: {
    commercialSnapshotPackageType?: string | null;
    commercialSnapshotPackageMode?: string | null;
  }
): PortalCommercialJourney {
  const primary = primaryPortalLicense(licenses);
  const licenseType = primary?.package_type;
  const licenseJourney =
    licenseType != null && String(licenseType).trim() !== ""
      ? resolvePortalCommercialJourney(licenseType)
      : null;

  // Sticky custom — active license is authoritative; snapshot cannot downgrade.
  if (licenseJourney === "custom") {
    return "custom";
  }

  const snapType = opts?.commercialSnapshotPackageType;
  const snapMode = opts?.commercialSnapshotPackageMode;
  if (isCustomErpPackageType(snapType) || isCustomErpPackageType(snapMode)) {
    return "custom";
  }

  if (licenseJourney === "predefined") {
    return "predefined";
  }

  if (snapType != null && String(snapType).trim() !== "") {
    return resolvePortalCommercialJourney(snapType);
  }
  if (snapMode != null && String(snapMode).trim() !== "") {
    return resolvePortalCommercialJourney(snapMode);
  }

  return "predefined";
}

/** Read journey from aggregated dashboard payload (centralized consumer entry point). */
export function resolvePortalJourneyFromDashboard(
  data: { commercialJourney?: PortalCommercialJourney | null } | null | undefined
): PortalCommercialJourney {
  return data?.commercialJourney === "custom" ? "custom" : "predefined";
}

export function licenseIsCustomErp(license: PortalLicense | null | undefined): boolean {
  if (!license) return false;
  return isCustomErpPackageType(license.package_type);
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

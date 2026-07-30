"use client";

import { usePortalContext } from "@/components/portal/portal-data-provider";
import { PortalDashboardView } from "@/components/portal/portal-dashboard";
import { PortalCustomErpDashboardView } from "@/components/portal/portal-custom-erp";
import { PortalErrorState, PortalSkeleton } from "@/components/portal/portal-ui";
import { isCustomErpPackageType } from "@/lib/portal/package-type";

/**
 * Renders Predefined Plan portal dashboard or Custom ERP portal dashboard.
 * Journey SSOT = commercial snapshot package_type / package_mode.
 */
export function PortalDashboardRouter() {
  const { data, loading, error, reload } = usePortalContext();

  if (loading) return <PortalSkeleton rows={3} />;
  if (error && !data) {
    return <PortalErrorState message={error} onRetry={reload} />;
  }

  const snap = data?.commercialSnapshot;
  const isCustom =
    data?.commercialJourney === "custom" ||
    isCustomErpPackageType(snap?.package_type) ||
    isCustomErpPackageType(snap?.package_mode);

  if (isCustom) {
    return <PortalCustomErpDashboardView />;
  }

  return <PortalDashboardView />;
}

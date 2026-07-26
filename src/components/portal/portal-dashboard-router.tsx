"use client";

import { usePortalContext } from "@/components/portal/portal-data-provider";
import { PortalDashboardView } from "@/components/portal/portal-dashboard";
import { PortalCustomErpDashboardView } from "@/components/portal/portal-custom-erp";
import { PortalErrorState, PortalSkeleton } from "@/components/portal/portal-ui";

/**
 * Renders Predefined Plan portal dashboard or Custom ERP portal dashboard
 * based on commercialJourney from License Engine package_type.
 */
export function PortalDashboardRouter() {
  const { data, loading, error, reload } = usePortalContext();

  if (loading) return <PortalSkeleton rows={3} />;
  if (error && !data) {
    return <PortalErrorState message={error} onRetry={reload} />;
  }

  if (data?.commercialJourney === "custom") {
    return <PortalCustomErpDashboardView />;
  }

  return <PortalDashboardView />;
}

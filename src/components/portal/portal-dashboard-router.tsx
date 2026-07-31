"use client";

import { usePortalContext } from "@/components/portal/portal-data-provider";
import { PortalDashboardView } from "@/components/portal/portal-dashboard";
import { PortalCustomErpDashboardView } from "@/components/portal/portal-custom-erp";
import { PortalErrorState, PortalSkeleton } from "@/components/portal/portal-ui";
import { resolvePortalJourneyFromDashboard } from "@/lib/portal/package-type";

/**
 * Renders Predefined Plan portal dashboard or Custom ERP portal dashboard.
 * Journey SSOT = centralized commercialJourney from dashboard API.
 */
export function PortalDashboardRouter() {
  const { data, loading, error, reload } = usePortalContext();

  if (loading) return <PortalSkeleton rows={3} />;
  if (error && !data) {
    return <PortalErrorState message={error} onRetry={reload} />;
  }

  const isCustom = resolvePortalJourneyFromDashboard(data) === "custom";

  if (isCustom) {
    return <PortalCustomErpDashboardView />;
  }

  return <PortalDashboardView />;
}

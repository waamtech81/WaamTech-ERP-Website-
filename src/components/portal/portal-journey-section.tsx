"use client";

import { usePortalContext } from "@/components/portal/portal-data-provider";
import { PortalSectionPage, type PortalSectionKey } from "@/components/portal/portal-section";
import {
  PortalCustomErpSectionView,
  type CustomErpSectionKey,
} from "@/components/portal/portal-custom-erp";
import { PortalErrorState, PortalSkeleton } from "@/components/portal/portal-ui";
import { resolvePortalJourneyFromDashboard } from "@/lib/portal/package-type";

type JourneySectionConfig =
  | { predefinedSection: PortalSectionKey; customSection: CustomErpSectionKey }
  | { predefinedSection: PortalSectionKey; customSection?: undefined };

/**
 * Shared portal routes: Custom ERP customers get dedicated section UI;
 * predefined customers keep the existing portal section unchanged.
 * Journey SSOT = centralized commercialJourney from dashboard API.
 */
export function PortalJourneySection({
  predefinedSection,
  customSection,
}: JourneySectionConfig) {
  const { data, loading, error, reload } = usePortalContext();

  if (loading) return <PortalSkeleton rows={2} />;
  if (error && !data) {
    return <PortalErrorState message={error} onRetry={reload} />;
  }

  const isCustom = resolvePortalJourneyFromDashboard(data) === "custom";

  if (isCustom && customSection) {
    return <PortalCustomErpSectionView section={customSection} />;
  }

  return <PortalSectionPage section={predefinedSection} />;
}

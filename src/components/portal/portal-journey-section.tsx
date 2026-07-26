"use client";

import { usePortalContext } from "@/components/portal/portal-data-provider";
import { PortalSectionPage, type PortalSectionKey } from "@/components/portal/portal-section";
import {
  PortalCustomErpSectionView,
  type CustomErpSectionKey,
} from "@/components/portal/portal-custom-erp";
import { PortalErrorState, PortalSkeleton } from "@/components/portal/portal-ui";

/**
 * For shared routes (e.g. /portal/modules): Custom ERP customers get the
 * dedicated Custom ERP section UI; predefined customers keep existing section.
 */
export function PortalJourneySection({
  predefinedSection,
  customSection,
}: {
  predefinedSection: PortalSectionKey;
  customSection: CustomErpSectionKey;
}) {
  const { data, loading, error, reload } = usePortalContext();

  if (loading) return <PortalSkeleton rows={2} />;
  if (error && !data) {
    return <PortalErrorState message={error} onRetry={reload} />;
  }

  if (data?.commercialJourney === "custom") {
    return <PortalCustomErpSectionView section={customSection} />;
  }

  return <PortalSectionPage section={predefinedSection} />;
}

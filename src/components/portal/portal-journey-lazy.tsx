"use client";

import dynamic from "next/dynamic";
import { PortalSkeleton } from "@/components/portal/portal-ui";
import type { PortalSectionKey } from "@/components/portal/portal-section";
import type { CustomErpSectionKey } from "@/components/portal/portal-custom-erp";

const PortalJourneySectionLazy = dynamic(
  () =>
    import("@/components/portal/portal-journey-section").then((m) => m.PortalJourneySection),
  {
    loading: () => <PortalSkeleton rows={2} />,
    ssr: false,
  }
);

export function createPortalJourneySectionLazy(
  predefinedSection: PortalSectionKey,
  customSection?: CustomErpSectionKey
) {
  return function PortalJourneySectionPage() {
    return (
      <PortalJourneySectionLazy
        predefinedSection={predefinedSection}
        customSection={customSection}
      />
    );
  };
}

"use client";

import dynamic from "next/dynamic";
import { PortalSkeleton } from "@/components/portal/portal-ui";

const Journey = dynamic(
  () =>
    import("@/components/portal/portal-journey-section").then(
      (m) => m.PortalJourneySection
    ),
  { loading: () => <PortalSkeleton rows={2} />, ssr: false }
);

export default function PortalModulesPage() {
  return <Journey predefinedSection="modules" customSection="modules" />;
}

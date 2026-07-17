"use client";

import dynamic from "next/dynamic";
import { PortalSkeleton } from "@/components/portal/portal-ui";

export const PortalDashboardLazy = dynamic(
  () =>
    import("@/components/portal/portal-dashboard").then((m) => m.PortalDashboardView),
  {
    loading: () => <PortalSkeleton rows={3} />,
    ssr: false,
  }
);

export function createPortalSectionLazy(
  section:
    | "licenses"
    | "subscriptions"
    | "billing"
    | "invoices"
    | "users"
    | "organization"
    | "modules"
    | "support"
    | "business-profile"
    | "notifications"
    | "settings"
) {
  const LazySection = dynamic(
    () =>
      import("@/components/portal/portal-section").then((m) => m.PortalSectionPage),
    {
      loading: () => <PortalSkeleton rows={2} />,
      ssr: false,
    }
  );

  return function PortalSectionLazyPage() {
    return <LazySection section={section} />;
  };
}

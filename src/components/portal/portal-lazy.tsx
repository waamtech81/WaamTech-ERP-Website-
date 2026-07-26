"use client";

import dynamic from "next/dynamic";
import { PortalSkeleton } from "@/components/portal/portal-ui";

export const PortalDashboardLazy = dynamic(
  () =>
    import("@/components/portal/portal-dashboard-router").then(
      (m) => m.PortalDashboardRouter
    ),
  {
    loading: () => <PortalSkeleton rows={3} />,
    ssr: false,
  }
);

export const PortalCustomErpSectionLazy = (
  section: "modules" | "feature-packs" | "limits" | "custom-erp" | "support"
) => {
  const LazySection = dynamic(
    () =>
      import("@/components/portal/portal-custom-erp").then((m) => m.PortalCustomErpSectionView),
    {
      loading: () => <PortalSkeleton rows={2} />,
      ssr: false,
    }
  );
  return function PortalCustomErpSectionLazyPage() {
    return <LazySection section={section} />;
  };
};

export function createPortalSectionLazy(
  section:
    | "licenses"
    | "subscriptions"
    | "billing"
    | "invoices"
    | "users"
    | "organization"
    | "modules"
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

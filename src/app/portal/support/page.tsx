"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePortalContext } from "@/components/portal/portal-data-provider";
import { PortalSkeleton } from "@/components/portal/portal-ui";

const CustomSection = dynamic(
  () =>
    import("@/components/portal/portal-custom-erp").then(
      (m) => m.PortalCustomErpSectionView
    ),
  { loading: () => <PortalSkeleton rows={2} />, ssr: false }
);

/**
 * Custom ERP customers get an in-portal Support section.
 * Predefined plan customers keep the prior redirect-to-dashboard behavior.
 */
export default function PortalSupportPage() {
  const router = useRouter();
  const { data, loading } = usePortalContext();

  useEffect(() => {
    if (!loading && data && data.commercialJourney !== "custom") {
      router.replace("/portal");
    }
  }, [data, loading, router]);

  if (loading || !data) return <PortalSkeleton rows={2} />;
  if (data.commercialJourney !== "custom") return <PortalSkeleton rows={1} />;

  return <CustomSection section="support" />;
}
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { usePortalContext } from "@/components/portal/portal-data-provider";
import { PortalSkeleton } from "@/components/portal/portal-ui";
import { resolvePortalJourneyFromDashboard } from "@/lib/portal/package-type";

const CustomSection = dynamic(
  () =>
    import("@/components/portal/portal-custom-erp").then(
      (m) => m.PortalCustomErpSectionView
    ),
  { loading: () => <PortalSkeleton rows={2} />, ssr: false }
);

/**
 * Custom ERP configuration / upgrade surface.
 * Predefined plan customers are redirected — no Custom ERP page leakage.
 * Journey SSOT = centralized commercialJourney from dashboard API.
 */
export default function PortalCustomErpPage() {
  const router = useRouter();
  const { data, loading } = usePortalContext();
  const isCustom = resolvePortalJourneyFromDashboard(data) === "custom";

  useEffect(() => {
    if (!loading && data && !isCustom) {
      router.replace("/portal");
    }
  }, [data, loading, isCustom, router]);

  if (loading || !data) return <PortalSkeleton rows={2} />;
  if (!isCustom) return <PortalSkeleton rows={1} />;

  return <CustomSection section="custom-erp" />;
}

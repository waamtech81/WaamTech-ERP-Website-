"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PortalPlansView } from "@/components/portal/portal-plans";
import { usePortalContext } from "@/components/portal/portal-data-provider";
import { PortalErrorState, PortalSkeleton } from "@/components/portal/portal-ui";
import { resolvePortalJourneyFromDashboard } from "@/lib/portal/package-type";

/**
 * Predefined plan change UI is blocked for Custom ERP customers.
 * They upgrade via modules / feature packs / limits only.
 * Journey SSOT = centralized commercialJourney from dashboard API.
 */
export function PortalPlansGate() {
  const router = useRouter();
  const { data, loading, error, reload } = usePortalContext();
  const isCustom = resolvePortalJourneyFromDashboard(data) === "custom";

  useEffect(() => {
    if (!loading && isCustom) {
      router.replace("/portal/custom-erp");
    }
  }, [isCustom, loading, router]);

  if (loading) return <PortalSkeleton rows={3} />;
  if (error && !data) {
    return <PortalErrorState message={error} onRetry={reload} />;
  }
  if (isCustom) {
    return <PortalSkeleton rows={2} />;
  }

  return <PortalPlansView />;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PortalPlansView } from "@/components/portal/portal-plans";
import { usePortalContext } from "@/components/portal/portal-data-provider";
import { PortalErrorState, PortalSkeleton } from "@/components/portal/portal-ui";

/**
 * Predefined plan change UI is blocked for Custom ERP customers.
 * They upgrade via modules / feature packs / limits only.
 */
export function PortalPlansGate() {
  const router = useRouter();
  const { data, loading, error, reload } = usePortalContext();

  useEffect(() => {
    if (!loading && data?.commercialJourney === "custom") {
      router.replace("/portal/custom-erp");
    }
  }, [data?.commercialJourney, loading, router]);

  if (loading) return <PortalSkeleton rows={3} />;
  if (error && !data) {
    return <PortalErrorState message={error} onRetry={reload} />;
  }
  if (data?.commercialJourney === "custom") {
    return <PortalSkeleton rows={2} />;
  }

  return <PortalPlansView />;
}

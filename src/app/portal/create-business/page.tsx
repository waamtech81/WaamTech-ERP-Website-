"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePortalContext } from "@/components/portal/portal-data-provider";
import { PortalSkeleton } from "@/components/portal/portal-ui";
import { resolvePortalJourneyFromDashboard } from "@/lib/portal/package-type";

/**
 * Portal-scoped alias for Create New Business.
 * Predefined → plans; Custom ERP → custom-erp (no plans leakage).
 */
export default function PortalCreateBusinessPage() {
  const router = useRouter();
  const { data, loading } = usePortalContext();

  useEffect(() => {
    if (loading) return;
    const isCustom = resolvePortalJourneyFromDashboard(data) === "custom";
    router.replace(isCustom ? "/portal/custom-erp" : "/portal/plans?intent=new_place");
  }, [data, loading, router]);

  return <PortalSkeleton rows={1} />;
}

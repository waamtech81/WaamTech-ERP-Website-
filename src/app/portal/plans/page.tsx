"use client";

import { Suspense } from "react";
import { PortalPlansView } from "@/components/portal/portal-plans";
import { PortalSkeleton } from "@/components/portal/portal-ui";

export default function PortalPlansPage() {
  return (
    <Suspense fallback={<PortalSkeleton rows={3} />}>
      <PortalPlansView />
    </Suspense>
  );
}

"use client";

import { Suspense } from "react";
import { PortalPlansGate } from "@/components/portal/portal-plans-gate";
import { PortalSkeleton } from "@/components/portal/portal-ui";

export default function PortalPlansPage() {
  return (
    <Suspense fallback={<PortalSkeleton rows={3} />}>
      <PortalPlansGate />
    </Suspense>
  );
}

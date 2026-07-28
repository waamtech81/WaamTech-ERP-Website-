"use client";

import { Suspense } from "react";
import { PortalCheckoutView } from "@/components/portal/portal-checkout-view";
import { PortalSkeleton } from "@/components/portal/portal-ui";

export default function PortalCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-1 py-2">
          <PortalSkeleton rows={4} />
        </div>
      }
    >
      <PortalCheckoutView />
    </Suspense>
  );
}

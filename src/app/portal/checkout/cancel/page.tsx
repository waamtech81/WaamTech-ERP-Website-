"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PortalPanel } from "@/components/portal/portal-ui";

export default function PortalCheckoutCancelPage() {
  return (
    <PortalPanel
      title="Checkout cancelled"
      description="No payment was taken. You can restart renewal or upgrade anytime from subscriptions."
    >
      <div className="flex flex-wrap gap-2">
        <Button asChild className="rounded-xl">
          <Link href="/portal/plans?intent=renew">Choose a plan</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/portal/subscriptions">Back to subscriptions</Link>
        </Button>
      </div>
    </PortalPanel>
  );
}

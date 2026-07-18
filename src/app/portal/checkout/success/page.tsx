"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortalPanel } from "@/components/portal/portal-ui";
import { usePortalContext } from "@/components/portal/portal-data-provider";
import { useEffect } from "react";

export default function PortalCheckoutSuccessPage() {
  const { reload } = usePortalContext();

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <PortalPanel
      title="All set"
      description="Your renewal or upgrade request completed successfully."
    >
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
        <p className="text-sm">
          Subscription details will refresh in your portal shortly. You can
          review billing and invoices anytime without leaving this workspace.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild className="rounded-xl">
          <Link href="/portal/subscriptions">View subscriptions</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/portal">Back to dashboard</Link>
        </Button>
      </div>
    </PortalPanel>
  );
}

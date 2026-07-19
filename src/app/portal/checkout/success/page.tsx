"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortalPanel, PortalSkeleton } from "@/components/portal/portal-ui";
import { usePortalContext } from "@/components/portal/portal-data-provider";
import { authConfig } from "@/lib/auth/config";

function SuccessInner() {
  const { reload } = usePortalContext();
  const searchParams = useSearchParams();
  const mode = String(searchParams.get("mode") || "").trim();
  const planName = String(searchParams.get("plan") || "").trim();
  const appUrl = authConfig.appUrl.replace(/\/+$/, "");

  useEffect(() => {
    void reload();
  }, [reload]);

  const isNewPlace = mode === "new_place" || mode === "add_place";

  return (
    <PortalPanel
      title={isNewPlace ? "New place activated" : "Payment complete"}
      description={
        isNewPlace
          ? "Your new place subscription is recorded. License Engine updates the account; WAAMTO SaaS shows it under multi-business after sync."
          : "Your renewal or upgrade completed successfully."
      }
    >
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="space-y-2 text-sm">
          <p>
            {planName
              ? `Plan “${planName}” is now processing on this account.`
              : "Subscription details will refresh in your portal shortly."}
          </p>
          {isNewPlace ? (
            <p>
              Next on{" "}
              <a
                href={`${appUrl}/login`}
                className="font-semibold underline underline-offset-2"
                target="_blank"
                rel="noreferrer"
              >
                app.waamto.com
              </a>
              : open Multi-business → select the new place → complete Business
              Profile Setup → Application Settings for that business.
            </p>
          ) : (
            <p>
              If this was an upgrade, limits and modules sync to the same business
              in SaaS. Review billing and invoices anytime in this portal.
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild className="rounded-xl">
          <Link href="/portal/subscriptions">View subscriptions</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/portal/billing">Billing & payments</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <a href={`${appUrl}/login`} target="_blank" rel="noreferrer">
            Open WAAMTO app
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
        <Button asChild variant="ghost" className="rounded-xl">
          <Link href="/portal">Dashboard</Link>
        </Button>
      </div>
    </PortalPanel>
  );
}

export default function PortalCheckoutSuccessPage() {
  return (
    <Suspense fallback={<PortalSkeleton rows={1} />}>
      <SuccessInner />
    </Suspense>
  );
}

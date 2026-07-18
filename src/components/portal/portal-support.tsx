"use client";

import Link from "next/link";
import { PortalEmptyState } from "@/components/portal/portal-ui";
import { Button } from "@/components/ui/button";
import { authConfig } from "@/lib/auth/config";

/** Support tickets live in WAAMTO SaaS — not in the customer portal. */
export function PortalSupportView() {
  const appUrl = authConfig.appUrl.replace(/\/+$/, "");
  return (
    <PortalEmptyState
      title="Support is in the WAAMTO app"
      description="Open and track support tickets inside your WAAMTO application. The portal focuses on licenses, billing, and account."
      action={
        <Button asChild size="sm" className="rounded-xl">
          <Link href={`${appUrl}/login`} target="_blank" rel="noopener noreferrer">
            Open WAAMTO
          </Link>
        </Button>
      }
    />
  );
}

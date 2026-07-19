import type { Metadata } from "next";
import { PortalDataProvider } from "@/components/portal/portal-data-provider";
import { PortalErrorBoundary } from "@/components/portal/portal-error-boundary";
import { PortalShell } from "@/components/portal/portal-shell";

export const metadata: Metadata = {
  title: "Customer Success Portal",
  description:
    "Enterprise customer portal for WAAMTO — licenses, subscriptions, invoices, billing, and support.",
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  // Inter is loaded once on the root layout (`--font-inter` / `--font-body`).
  return (
    <div className="portal-font-root">
      <PortalDataProvider>
        <PortalErrorBoundary>
          <PortalShell>
            {children}
          </PortalShell>
        </PortalErrorBoundary>
      </PortalDataProvider>
    </div>
  );
}

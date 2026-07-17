import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { PortalDataProvider } from "@/components/portal/portal-data-provider";
import { PortalShell } from "@/components/portal/portal-shell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-portal-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Customer Success Portal",
  description:
    "Enterprise customer portal for WAAMTO — licenses, subscriptions, invoices, billing, and support.",
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.variable} portal-font-root`}>
      <PortalDataProvider>
        <PortalShell>{children}</PortalShell>
      </PortalDataProvider>
    </div>
  );
}

import type { Metadata } from "next";
import { siteConfig } from "@/lib/data/site";
import { buildAbsoluteSiteUrl } from "@/lib/urls";

export const metadata: Metadata = {
  title: "Pricing — ERP Plans & Free Trial",
  description: `Clear ${siteConfig.name} cloud ERP pricing — Starter, Business, Lifetime, and Enterprise. Inventory, POS, CRM, Finance & AI. Start a free trial — no card required.`,
  keywords: [
    "ERP pricing",
    "cloud ERP plans",
    "ERP free trial",
    "WAAMTO pricing",
    "business ERP cost",
    "affordable ERP software",
  ],
  alternates: { canonical: buildAbsoluteSiteUrl("/pricing") },
  openGraph: {
    title: `Pricing | ${siteConfig.name}`,
    description:
      "Compare WAAMTO ERP plans — Starter, Business, Lifetime, and Enterprise. Transparent live pricing for growing teams.",
    url: buildAbsoluteSiteUrl("/pricing"),
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}

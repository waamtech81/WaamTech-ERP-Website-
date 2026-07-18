import type { Metadata } from "next";
import { siteConfig } from "@/lib/data/site";
import { buildAbsoluteSiteUrl } from "@/lib/urls";

export const metadata: Metadata = {
  title: "Pricing — ERP Plans & Free Trial",
  description: `WAAMTO cloud ERP pricing — Starter, Business, Lifetime, and Enterprise plans. Inventory, POS, CRM, Finance & AI included. Start a free trial on ${siteConfig.name}.`,
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
      "Compare WAAMTO ERP plans — Starter, Business, Lifetime, and Enterprise. Live pricing from WaamTech License Engine.",
    url: buildAbsoluteSiteUrl("/pricing"),
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}

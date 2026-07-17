import type { Metadata } from "next";
import { siteConfig } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Pricing",
  description: `WAAMTO plans and pricing from the License Engine catalog — Starter, Business, Lifetime, and Enterprise. Start a ${siteConfig.name} free trial.`,
  alternates: { canonical: `${siteConfig.url}/pricing` },
  openGraph: {
    title: `Pricing | ${siteConfig.name}`,
    description:
      "Live commercial plans and pricing from WaamTech License Engine. Enterprise is always custom.",
    url: `${siteConfig.url}/pricing`,
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}

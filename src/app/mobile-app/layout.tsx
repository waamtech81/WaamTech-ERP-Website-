import type { Metadata } from "next";
import { siteConfig } from "@/lib/data/site";
import { buildAbsoluteSiteUrl } from "@/lib/urls";

const title = "Mobile ERP App — Native Android & Responsive Web | WAAMTO";
const description =
  "Run WAAMTO ERP on desktop, tablet, and phone. Native Android mobile app for delivery, warehouse, and field service — included by business profile. Responsive web on every plan.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "ERP mobile app",
    "cloud ERP mobile",
    "Android ERP app",
    "field service mobile ERP",
    "warehouse mobile app",
    "delivery route ERP app",
    "responsive ERP web app",
    "WAAMTO mobile",
    "WaamTech ERP app",
    "inventory mobile app",
    "POS mobile ERP",
    "business profile ERP",
  ],
  alternates: { canonical: buildAbsoluteSiteUrl("/mobile-app") },
  openGraph: {
    title,
    description,
    url: buildAbsoluteSiteUrl("/mobile-app"),
    type: "website",
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function MobileAppLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";
import { siteConfig } from "@/lib/data/site";

export const metadata: Metadata = {
  title: `Contact — ${siteConfig.name}`,
  description: `Contact ${siteConfig.name} for sales, demos, partnerships, and support. Talk with our team about plans, custom ERP, or deployment options.`,
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}

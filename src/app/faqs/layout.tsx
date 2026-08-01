import type { Metadata } from "next";
import { siteConfig } from "@/lib/data/site";

export const metadata: Metadata = {
  title: `FAQs — ${siteConfig.name}`,
  description: `Answers to common ${siteConfig.name} questions about plans, trials, billing, security, modules, and getting started.`,
  alternates: { canonical: "/faqs" },
};

export default function FaqsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

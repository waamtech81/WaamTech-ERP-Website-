import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { FaqBrowser } from "@/components/sections/faq-browser";
import { siteConfig } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "FAQs — Plans, Custom ERP, Billing & Support",
  description:
    "Answers about WAAMTO modules, Custom ERP, predefined plans, feature packs, seats, portal billing, security, and support at support@waamto.com.",
  keywords: [
    "WAAMTO FAQ",
    "ERP pricing questions",
    "custom ERP FAQ",
    "cloud ERP support",
  ],
  alternates: { canonical: "/faqs" },
};

export default function FaqsPage() {
  return (
    <Section className="!pb-16 !pt-12 md:!pt-16">
      <Container>
        <SectionHeader
          eyebrow="FAQs"
          as="h1"
          title="Answers to common questions"
          description={`Search by topic or browse product, billing, Custom ERP, security, and integrations. Email ${siteConfig.supportEmail} or open the Customer Portal anytime.`}
        />
        <FaqBrowser />
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Need a human?{" "}
          <Link href="/support" className="font-medium text-primary underline-offset-4 hover:underline">
            Visit support
          </Link>
          {" · "}
          <Link href="/contact" className="font-medium text-primary underline-offset-4 hover:underline">
            Contact sales
          </Link>
          {" · "}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Customer Portal
          </Link>
        </p>
      </Container>
    </Section>
  );
}

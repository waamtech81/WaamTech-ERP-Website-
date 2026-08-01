import Link from "next/link";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { FaqBrowser } from "@/components/sections/faq-browser";

export default function FaqsPage() {
  return (
    <Section className="!pb-16 !pt-12 md:!pt-16">
      <Container>
        <Breadcrumbs items={[{ label: "FAQs" }]} />
        <SectionHeader
          eyebrow="FAQs"
          as="h1"
          title="Answers to common questions"
          description="Search by topic or browse product, billing, support, security, and integrations. Still stuck? Contact support or open Customer Portal."
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

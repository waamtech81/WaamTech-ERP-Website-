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
          title="Answers to common questions"
          description="Search by topic or browse categories across product, billing, support, security, and integrations."
        />
        <FaqBrowser />
      </Container>
    </Section>
  );
}

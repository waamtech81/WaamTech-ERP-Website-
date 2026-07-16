import type { Metadata } from "next";
import { industries } from "@/lib/data/site";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { IndustryCard } from "@/components/shared/cards";
import { AnimateIn } from "@/components/shared/animate-in";
import { CTASection } from "@/components/shared/cta-section";

export const metadata: Metadata = {
  title: "Industries",
  description: "WaamTech solutions for retail, wholesale, manufacturing, healthcare, pharmacy, warehouse, construction, real estate, education, restaurant, and more.",
};

export default function IndustriesPage() {
  return (
    <>
      <Section className="!pb-10 !pt-12 md:!pt-16">
        <Container>
          <Breadcrumbs items={[{ label: "Industries" }]} />
          <SectionHeader
            align="left"
            eyebrow="Industries"
            title="Software shaped by real industry workflows"
            description="WaamTech adapts to the operating realities of your sector — inventory patterns, compliance needs, and fulfillment models included."
            className="mb-0 max-w-3xl"
          />
        </Container>
      </Section>

      <Section muted className="!pt-10">
        <Container>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {industries.map((ind, i) => (
              <div key={ind.id} id={ind.slug}>
                <AnimateIn delay={(i % 4) * 0.04}>
                  <IndustryCard
                    name={ind.name}
                    description={ind.description}
                    icon={ind.icon}
                    href={`/industries#${ind.slug}`}
                    benefits={ind.benefits}
                  />
                </AnimateIn>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <CTASection
        title="Don't see your industry?"
        description="Talk with our team — Enterprise deployments can be tailored for specialized operating models."
        primaryLabel="Contact sales"
        primaryHref="/contact?intent=industry"
      />
    </>
  );
}

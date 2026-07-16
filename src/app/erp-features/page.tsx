import type { Metadata } from "next";
import { erpFeatureGroups } from "@/lib/data/site";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { FeatureCard } from "@/components/shared/cards";
import { AnimateIn } from "@/components/shared/animate-in";
import { CTASection } from "@/components/shared/cta-section";

export const metadata: Metadata = {
  title: "ERP Features",
  description: "Explore WaamTech ERP features across operations, finance, sales, inventory, purchase, HR, CRM, analytics, reports, automation, and integrations.",
};

export default function ErpFeaturesPage() {
  return (
    <>
      <Section className="!pb-10 !pt-12 md:!pt-16">
        <Container>
          <Breadcrumbs items={[{ label: "ERP Features" }]} />
          <SectionHeader
            align="left"
            eyebrow="ERP Features"
            title="Categorized capabilities for enterprise operations"
            description="Every module is designed to feel coherent — clean workflows, strong permissions, and reporting that leadership can trust."
            className="mb-0 max-w-3xl"
          />
        </Container>
      </Section>

      <Section muted className="!pt-10">
        <Container>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {erpFeatureGroups.map((group, i) => (
              <div key={group.id} id={group.id}>
                <AnimateIn delay={(i % 3) * 0.05}>
                  <FeatureCard
                    title={group.title}
                    description={group.description}
                    icon={group.icon}
                    features={group.features}
                  />
                </AnimateIn>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <CTASection
        title="See WaamTech ERP in your workflow"
        description="We'll map modules to your current process and show a clear path from pilot to production."
        primaryLabel="Book a demo"
        primaryHref="/contact?intent=demo"
      />
    </>
  );
}

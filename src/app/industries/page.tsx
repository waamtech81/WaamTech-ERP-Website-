import type { Metadata } from "next";
import { hierarchyStats } from "@/lib/data/business-hierarchy";
import { siteConfig } from "@/lib/data/site";
import { Container, Section } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { IndustriesGallery } from "@/components/sections/industries-gallery";
import { CTASection } from "@/components/shared/cta-section";

export const metadata: Metadata = {
  title: `Industries We Serve — ${hierarchyStats.industries} Industries & ${hierarchyStats.categories}+ Categories`,
  description: `Explore ${siteConfig.name} industries from SaaS Core: Retail, Automotive, Pharmacy, Restaurant, Manufacturing, Wholesale, Warehouse, Property, and more.`,
};

export default function IndustriesPage() {
  return (
    <>
      <Section className="!pb-6 !pt-12 md:!pt-16">
        <Container>
          <Breadcrumbs items={[{ label: "Industries" }]} />
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-medium tracking-wide text-primary uppercase">
              Industries we serve
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] font-semibold tracking-tight text-[#0b1f3a] text-balance leading-tight">
              Industry first. Then your business category.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Pick your industry, choose a business category, and start a free trial with the right
              profile — {hierarchyStats.industries} industries · {hierarchyStats.categories}{" "}
              categories.
            </p>
          </div>
        </Container>
      </Section>

      <Section muted className="!pt-8 !pb-14 md:!pb-16">
        <Container>
          <IndustriesGallery />
        </Container>
      </Section>

      <Section className="!py-14 md:!py-16">
        <Container>
          <div className="mb-8 max-w-2xl">
            <p className="mb-2 text-sm font-medium tracking-wide text-primary uppercase">
              How it works
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#0b1f3a]">
              Pick industry → choose category → go live
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Choose your industry",
                text: `Select from ${hierarchyStats.industries} parent industries — Retail, Automotive, Healthcare, and more.`,
              },
              {
                step: "02",
                title: "Pick a business category",
                text: "Retail Store, Chain Pharmacy, Vehicle Dealership — the profile that matches how you operate.",
              },
              {
                step: "03",
                title: "Auto-provisioned stack",
                text: "Modules, POS, and mobile follow the category — so go-live is faster and cleaner.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-border bg-white p-5 md:p-6"
              >
                <p className="text-sm font-semibold text-primary">{item.step}</p>
                <h3 className="mt-2 text-lg font-semibold tracking-tight text-[#0b1f3a]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <CTASection
        title="Ready for your industry profile?"
        description={`We'll map ${siteConfig.name} to your industry and business category — then you start the free trial.`}
        primaryLabel="Start free trial"
        primaryHref="/signup"
        secondaryLabel="Talk to sales"
        secondaryHref="/contact?intent=industry"
      />
    </>
  );
}

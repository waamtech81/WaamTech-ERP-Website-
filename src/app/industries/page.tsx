import type { Metadata } from "next";
import { siteConfig } from "@/lib/data/site";
import { Container, Section } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { IndustriesGallery } from "@/components/sections/industries-gallery";
import { CTASection } from "@/components/shared/cta-section";

export const metadata: Metadata = {
  title: `Industries We Serve — ${siteConfig.name}`,
  description: `Explore ${siteConfig.name} industries loaded live from the WaamTech License Engine commercial catalog.`,
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
              Industries, business categories, and business profiles load dynamically from the License
              Engine — the Website never owns this catalog.
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
              Pick industry → category → profile → go live
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Choose your industry",
                text: "Select from the live License Engine industry catalog.",
              },
              {
                step: "02",
                title: "Pick a business category",
                text: "Categories load dynamically for the selected industry.",
              },
              {
                step: "03",
                title: "Select a business profile",
                text: "Profiles load for the selected category — then start registration.",
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
        description={`We'll map ${siteConfig.name} using License Engine commercial selections — then you start the free trial.`}
        primaryLabel="Start free trial"
        primaryHref="/signup"
        secondaryLabel="Talk to sales"
        secondaryHref="/contact?intent=industry"
      />
    </>
  );
}

import type { Metadata } from "next";
import { industriesServing } from "@/lib/data/industries";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { IndustriesGallery } from "@/components/sections/industries-gallery";
import { CTASection } from "@/components/shared/cta-section";
import { AnimateIn } from "@/components/shared/animate-in";

export const metadata: Metadata = {
  title: "Industries We Serve",
  description:
    "WaamTech serves 30+ business profiles from SaaS Core — retail, pharmacy, restaurant, manufacturing, wholesale, warehouse, property, and more.",
};

export default function IndustriesPage() {
  return (
    <>
      <Section className="relative !pb-8 !pt-12 md:!pt-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(37,99,235,0.08),transparent_70%)]" />
        <Container className="relative">
          <Breadcrumbs items={[{ label: "Industries" }]} />
          <AnimateIn>
            <div className="mx-auto max-w-3xl text-center mb-6">
              <p className="mb-3 text-sm font-medium tracking-wide text-primary uppercase">
                Industries we serve
              </p>
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#0b1f3a] text-balance">
                Built for the businesses inside our SaaS Core
              </h1>
              <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
                Every industry below is a real business profile from WaamTech SaaS Core — with modules,
                feature packs, workflows, and KPIs pre-mapped for how you operate.
              </p>
              <p className="mt-4 text-sm font-medium text-[#0b1f3a]">
                {industriesServing.length} industries · Retail to manufacturing · Services to supply chain
              </p>
            </div>
          </AnimateIn>
        </Container>
      </Section>

      <Section muted className="!pt-4">
        <Container>
          <IndustriesGallery />
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeader
            eyebrow="How it works"
            title="Pick a profile. Activate the right stack."
            description="When you choose an industry, WaamTech recommends modules, feature packs, POS layouts, dashboards, and automations — so go-live is faster and cleaner."
          />
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Choose your industry",
                text: "Select from 30+ SaaS Core business profiles — pharmacy, retail, restaurant, wholesale, and more.",
              },
              {
                step: "02",
                title: "Get the module map",
                text: "Inventory, POS, Sales, Finance, HR, Manufacturing — only what your profile needs.",
              },
              {
                step: "03",
                title: "Turn on feature packs",
                text: "Batch, expiry, kitchen, IMEI, route delivery, rentals — capability without custom chaos.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-3xl border border-border bg-white p-6 md:p-8 shadow-sm"
              >
                <p className="text-sm font-semibold text-primary">{item.step}</p>
                <h3 className="mt-3 text-xl font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <CTASection
        title="Ready for your industry profile?"
        description="We'll map WaamTech to your business type and show a clear path from pilot to production."
        primaryLabel="Talk to sales"
        primaryHref="/contact?intent=industry"
        secondaryLabel="Explore modules"
        secondaryHref="/products"
      />
    </>
  );
}

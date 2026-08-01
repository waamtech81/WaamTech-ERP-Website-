import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { siteConfig } from "@/lib/data/site";
import { heroImageUrl } from "@/lib/images";
import { Container, Section } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { IndustriesGallery } from "@/components/sections/industries-gallery";
import { CTASection } from "@/components/shared/cta-section";
import { AnimateIn } from "@/components/shared/animate-in";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: `Industries We Serve — ${siteConfig.name}`,
  description: `Explore ${siteConfig.name} industry solutions — choose your vertical and business type, then start a free trial with a setup that matches how you operate.`,
};

const HERO_IMAGE = heroImageUrl(
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fm=webp&fit=crop&w=1400&q=70",
  1400
);

const FLOW = [
  {
    step: "01",
    title: "Choose your industry",
    text: "Browse live industry options tailored to how your sector operates.",
  },
  {
    step: "02",
    title: "Pick a business type",
    text: "Business types for your industry recommend the right starting modules.",
  },
  {
    step: "03",
    title: "Start your free trial",
    text: "Continue to signup in minutes — then manage your account in Customer Portal.",
  },
] as const;

export default function IndustriesPage() {
  return (
    <>
      {/* Industries identity: full-bleed photo hero (distinct from Modules catalog intro) */}
      <section className="relative isolate min-h-[min(62vh,520px)] overflow-hidden">
        <Image
          src={HERO_IMAGE}
          alt="Business teams collaborating across retail, warehouse, and operations"
          fill
          priority
          quality={70}
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071528]/94 via-[#0b1f3a]/80 to-[#0b1f3a]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071528]/75 via-transparent to-transparent" />

        <Container className="relative z-10 flex min-h-[min(62vh,520px)] flex-col justify-end pb-10 pt-20 md:pb-14 md:pt-24">
          <Breadcrumbs
            items={[{ label: "Industries" }]}
            className="!mb-5 [&_a]:text-white/70 [&_a:hover]:text-white [&_span]:!text-white/90 [&_svg]:text-white/40"
          />
          <AnimateIn>
            <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-sky-300 uppercase">
              Industry solutions
            </p>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight !text-white text-balance sm:text-4xl md:text-5xl leading-[1.1]">
              Built for how your industry actually runs
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              Start with your industry, then your business type — so modules match the way you sell,
              stock, and serve.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Button asChild size="lg" className="rounded-full bg-white text-[#0b1f3a] hover:bg-white/90">
                <Link href="#industries-catalog">
                  Browse industries
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/signup">Start free trial</Link>
              </Button>
            </div>
          </AnimateIn>
        </Container>
      </section>

      <Section id="industries-catalog" className="!py-12 md:!py-16">
        <Container>
          <AnimateIn>
            <div className="mb-8 flex flex-col gap-2 border-b border-slate-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="mb-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
                  Live catalog
                </p>
                <h2 className="text-xl font-semibold tracking-tight text-[#0b1f3a] md:text-2xl text-balance">
                  Choose a vertical, then a business type
                </h2>
              </div>
              <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
                Each industry opens real categories. Pick one to configure your workspace.
              </p>
            </div>
          </AnimateIn>
          <IndustriesGallery />
        </Container>
      </Section>

      <Section muted className="!py-12 md:!py-14">
        <Container>
          <ol className="grid gap-6 sm:grid-cols-3 sm:gap-8">
            {FLOW.map((item, i) => (
              <AnimateIn key={item.step} delay={i * 0.06}>
                <li className="relative rounded-2xl border border-border/80 bg-white px-5 py-5 shadow-sm">
                  <p className="text-xs font-semibold tracking-wide text-primary">{item.step}</p>
                  <h3 className="mt-2 text-base font-semibold tracking-tight text-[#0b1f3a]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                </li>
              </AnimateIn>
            ))}
          </ol>
        </Container>
      </Section>

      <CTASection
        title="Ready for your industry profile?"
        description={`We'll map ${siteConfig.name} to your industry and category — then you start the free trial.`}
        primaryLabel="Start free trial"
        primaryHref="/signup"
        secondaryLabel="Talk to sales"
        secondaryHref="/contact?intent=industry"
      />
    </>
  );
}

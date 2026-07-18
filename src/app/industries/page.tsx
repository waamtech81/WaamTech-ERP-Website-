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
  description: `Explore ${siteConfig.name} industries loaded live from the WaamTech License Engine commercial catalog.`,
};

const HERO_IMAGE = heroImageUrl(
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fm=webp&fit=crop&w=1600&q=70",
  1600
);

const FLOW = [
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
] as const;

export default function IndustriesPage() {
  return (
    <>
      {/* Full-bleed hero — one composition */}
      <section className="relative isolate min-h-[min(78vh,640px)] overflow-hidden">
        <Image
          src={HERO_IMAGE}
          alt="Business teams collaborating across retail, warehouse, and operations"
          fill
          priority
          quality={70}
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071528]/92 via-[#0b1f3a]/78 to-[#0b1f3a]/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071528]/70 via-transparent to-transparent" />

        <Container className="relative z-10 flex min-h-[min(78vh,640px)] flex-col justify-end pb-12 pt-24 md:pb-16 md:pt-28">
          <Breadcrumbs
            items={[{ label: "Industries" }]}
            className="!mb-6 [&_a]:text-white/70 [&_a:hover]:text-white [&_span]:!text-white/90 [&_svg]:text-white/40"
          />
          <AnimateIn>
            <p className="mb-3 font-heading text-sm font-semibold tracking-[0.2em] text-sky-300 uppercase sm:text-base">
              {siteConfig.name}
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white text-balance sm:text-5xl md:text-6xl leading-[1.08]">
              Built for how your industry actually runs
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              Industry first, then your business category — live from License Engine so modules
              match the way you sell, stock, and serve.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
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

      <Section id="industries-catalog" className="!py-14 md:!py-20">
        <Container>
          <AnimateIn>
            <div className="mb-10 max-w-2xl">
              <p className="mb-2 text-sm font-medium tracking-wide text-primary uppercase">
                Industry catalog
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-[#0b1f3a] md:text-3xl text-balance">
                Find your vertical — then drill into categories
              </h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Each industry opens real business categories and profiles from License Engine.
                Pick one to configure your workspace and start the trial.
              </p>
            </div>
          </AnimateIn>
          <IndustriesGallery />
        </Container>
      </Section>

      <Section className="relative !py-16 md:!py-20 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_10%_20%,rgba(14,165,233,0.08),transparent_55%),radial-gradient(ellipse_50%_40%_at_90%_80%,rgba(37,99,235,0.07),transparent_50%)]" />
        <Container className="relative">
          <AnimateIn>
            <div className="mb-10 max-w-2xl">
              <p className="mb-2 text-sm font-medium tracking-wide text-primary uppercase">
                How it works
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-[#0b1f3a] md:text-3xl">
                Industry → category → profile → go live
              </h2>
            </div>
          </AnimateIn>
          <ol className="grid gap-8 md:grid-cols-3 md:gap-10">
            {FLOW.map((item, i) => (
              <AnimateIn key={item.step} delay={i * 0.08}>
                <li className="relative">
                  <p className="font-heading text-4xl font-semibold tracking-tight text-primary/25 md:text-5xl">
                    {item.step}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold tracking-tight text-[#0b1f3a]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                  {i < FLOW.length - 1 ? (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute top-6 right-0 hidden h-px w-10 translate-x-1/2 bg-gradient-to-r from-primary/30 to-transparent md:block"
                    />
                  ) : null}
                </li>
              </AnimateIn>
            ))}
          </ol>
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

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { siteConfig } from "@/lib/data/site";
import { Container, Section } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AnimateIn } from "@/components/shared/animate-in";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CTASection } from "@/components/shared/cta-section";
import { BuildYourOwnErpBuilder } from "@/components/sections/build-your-own-erp";

export const metadata: Metadata = {
  title: `Build your own ERP — ${siteConfig.name}`,
  description:
    "Design a custom ERP for your business: choose industry and business type, start from a recommended setup, adjust modules, feature packs, and limits, pick billing, then continue to signup with live pricing.",
  alternates: { canonical: "/build-your-own-erp" },
  openGraph: {
    title: `Build your own ERP — ${siteConfig.name}`,
    description:
      "Design a custom ERP for your business: choose industry and business type, start from a recommended setup, adjust modules, feature packs, and limits, pick billing, then continue to signup with live pricing.",
  },
};

export default function BuildYourOwnErpPage() {
  return (
    <>
      <Section className="relative !pb-6 !pt-12 md:!pt-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(37,99,235,0.08),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(248,250,252,0.6))]" />
        <Container className="relative">
          <Breadcrumbs items={[{ label: "Build your own custom ERP" }]} />
          <AnimateIn>
            <div className="mt-6 max-w-4xl">
              <Badge variant="accent" className="mb-3">
                Custom ERP
              </Badge>
              <p className="mb-2 font-heading text-sm font-semibold tracking-[0.18em] text-primary uppercase">
                {siteConfig.name}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-[#0b1f3a] text-balance sm:text-4xl md:text-5xl">
                Build the ERP that fits your business
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg text-pretty">
                Tell us your industry and business type. We recommend a clear starting setup —
                then you adjust modules, feature packs, limits, and billing with live pricing before signup.
              </p>
              <ol className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-muted-foreground sm:text-sm" aria-label="Builder journey">
                <li className="rounded-full border border-border bg-white px-3 py-1">1. Industry</li>
                <li className="rounded-full border border-border bg-white px-3 py-1">2. Recommended</li>
                <li className="rounded-full border border-border bg-white px-3 py-1">3. Customize</li>
                <li className="rounded-full border border-border bg-white px-3 py-1">4. Signup</li>
              </ol>
              <div className="mt-6 flex flex-nowrap items-stretch gap-2 overflow-x-auto pb-0.5 scrollbar-thin sm:flex-wrap sm:overflow-visible sm:gap-3">
                <Button asChild size="sm" className="h-9 shrink-0 rounded-full px-3 text-xs whitespace-nowrap sm:h-11 sm:px-6 sm:text-sm">
                  <Link href="#builder">
                    Start building
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="h-9 shrink-0 rounded-full px-3 text-xs whitespace-nowrap sm:h-11 sm:px-6 sm:text-sm">
                  <Link href="/modules">Browse modules</Link>
                </Button>
                <Button asChild size="sm" variant="ghost" className="h-9 shrink-0 rounded-full px-3 text-xs whitespace-nowrap sm:h-11 sm:px-6 sm:text-sm">
                  <Link href="/pricing">View fixed plans</Link>
                </Button>
              </div>
            </div>
          </AnimateIn>
        </Container>
      </Section>

      <div id="builder">
        <BuildYourOwnErpBuilder />
      </div>

      <CTASection
        title={`Prefer a ready-made ${siteConfig.name} plan?`}
        description="Starter, Business, Lifetime, and Enterprise remain unchanged — start a free trial anytime."
        primaryLabel="View pricing"
        primaryHref="/pricing"
        secondaryLabel="Start free trial"
        secondaryHref="/signup"
      />
    </>
  );
}

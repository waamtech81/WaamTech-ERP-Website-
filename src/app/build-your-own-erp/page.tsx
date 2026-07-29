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
  title: `Build your own custom ERP — ${siteConfig.name}`,
  description:
    "Build a custom ERP: choose industry and category, load recommended modules and feature packs, set tenant limits, pick billing, and continue to Signup with a live package total.",
  alternates: { canonical: "/build-your-own-erp" },
  openGraph: {
    title: `Build your own custom ERP — ${siteConfig.name}`,
    description:
      "Build a custom ERP: choose industry and category, load recommended modules and feature packs, set tenant limits, pick billing, and continue to Signup with a live package total.",
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
                Custom package
              </Badge>
              <p className="mb-2 font-heading text-sm font-semibold tracking-[0.18em] text-primary uppercase">
                {siteConfig.name}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-[#0b1f3a] text-balance sm:text-4xl md:text-5xl">
                Build your own custom ERP
              </h1>
              <p className="mt-4 max-w-4xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Select your industry and business category, start from the recommended modules and
                feature packs, tune seats and billing, and continue to Signup — with live pricing
                the whole way.
              </p>
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

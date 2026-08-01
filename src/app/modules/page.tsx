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
import { ModulesCatalog } from "@/components/sections/modules-catalog";

export const metadata: Metadata = {
  title: `All ERP Modules — ${siteConfig.name}`,
  description: `Browse the complete ${siteConfig.name} ERP module library — every module, category, and capability in one place.`,
  alternates: { canonical: "/modules" },
};

export default function AllModulesPage() {
  return (
    <>
      <Section className="relative !pb-6 !pt-12 md:!pt-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(37,99,235,0.08),transparent_70%)]" />
        <Container className="relative">
          <Breadcrumbs items={[{ label: "Modules" }]} />
          <AnimateIn>
            <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <Badge variant="accent" className="mb-3">
                  Module catalog
                </Badge>
                <h1 className="text-3xl font-semibold tracking-tight text-[#0b1f3a] text-balance sm:text-4xl md:text-5xl">
                  All ERP Modules
                </h1>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Explore every module in the {siteConfig.name} suite — what each one does, which
                  business area it belongs to, and how modules work together. Browse freely, then
                  assemble a custom package or start a trial.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full">
                  <Link href="/build-your-own-erp">
                    Build your own custom ERP
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full">
                  <Link href="/signup">Start free trial</Link>
                </Button>
              </div>
            </div>
          </AnimateIn>
        </Container>
      </Section>

      <ModulesCatalog groupBy="none" />

      <CTASection
        title="Compose only what you need"
        description="Use the builder to select modules, resolve dependencies, and request a custom package."
        primaryLabel="Build Your Own ERP"
        primaryHref="/build-your-own-erp"
        secondaryLabel="View pricing"
        secondaryHref="/pricing"
      />
    </>
  );
}

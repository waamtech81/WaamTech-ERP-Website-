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
  title: `ERP Modules by Industry — ${siteConfig.name}`,
  description: `Browse ${siteConfig.name} ERP modules grouped by industry — retail, manufacturing, distribution, and more.`,
  alternates: { canonical: "/modules/industry" },
};

export default function ModulesByIndustryPage() {
  return (
    <>
      <Section className="relative !pb-6 !pt-12 md:!pt-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_40%_0%,rgba(14,165,233,0.1),transparent_70%)]" />
        <Container className="relative">
          <Breadcrumbs
            items={[
              { label: "Modules", href: "/modules" },
              { label: "By industry" },
            ]}
          />
          <AnimateIn>
            <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <Badge variant="accent" className="mb-3">
                  By industry
                </Badge>
                <h1 className="text-3xl font-semibold tracking-tight text-[#0b1f3a] text-balance sm:text-4xl md:text-5xl">
                  Modules by Industry
                </h1>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Only industry packs (Pharmacy, Restaurant, Automotive, and more). Shared core
                  modules stay on All Modules and By Category.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full">
                  <Link href="/build-your-own-erp">
                    Build your own custom ERP
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </AnimateIn>
        </Container>
      </Section>

      <ModulesCatalog groupBy="industry" />

      <CTASection
        title="Ready to assemble your stack?"
        description="Select modules, confirm required dependencies, and submit a custom package request."
        primaryLabel="Build Your Own ERP"
        primaryHref="/build-your-own-erp"
        secondaryLabel="Browse categories"
        secondaryHref="/modules/category"
      />
    </>
  );
}

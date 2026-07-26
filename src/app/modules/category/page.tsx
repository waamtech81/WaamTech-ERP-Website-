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
  title: `ERP Modules by Category — ${siteConfig.name}`,
  description: `Browse ${siteConfig.name} ERP modules by category — Operations, Sales, Finance, People, Platform, and more.`,
  alternates: { canonical: "/modules/category" },
};

export default function ModulesByCategoryPage() {
  return (
    <>
      <Section className="relative !pb-6 !pt-12 md:!pt-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_60%_0%,rgba(37,99,235,0.1),transparent_70%)]" />
        <Container className="relative">
          <Breadcrumbs
            items={[
              { label: "Modules", href: "/modules" },
              { label: "By category" },
            ]}
          />
          <AnimateIn>
            <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <Badge variant="accent" className="mb-3">
                  By category
                </Badge>
                <h1 className="text-3xl font-semibold tracking-tight text-[#0b1f3a] text-balance sm:text-4xl md:text-5xl">
                  Modules by Category
                </h1>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Same catalog as All Modules, organized by function — Operations, Sales &amp; CRM,
                  Finance, People, Projects &amp; Service, Platform, and Industry packs.
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

      <ModulesCatalog groupBy="category" />

      <CTASection
        title="Mix categories into one package"
        description="The builder lets you combine modules across categories with live pricing."
        primaryLabel="Build Your Own ERP"
        primaryHref="/build-your-own-erp"
        secondaryLabel="All modules"
        secondaryHref="/modules"
      />
    </>
  );
}

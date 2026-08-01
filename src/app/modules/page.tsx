import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Boxes } from "lucide-react";
import { siteConfig } from "@/lib/data/site";
import { Container, Section } from "@/components/shared/section";
import { AnimateIn } from "@/components/shared/animate-in";
import { Button } from "@/components/ui/button";
import { CTASection } from "@/components/shared/cta-section";
import { ModulesCatalog } from "@/components/sections/modules-catalog";

export const metadata: Metadata = {
  title: `ERP Module Library — ${siteConfig.name}`,
  description: `Browse every purchasable ${siteConfig.name} ERP module — inventory, sales, finance, CRM, POS, manufacturing, and more. Compose a Custom ERP package with live pricing.`,
  keywords: [
    "ERP modules",
    "WAAMTO module library",
    "custom ERP modules",
    "inventory POS CRM modules",
  ],
  alternates: { canonical: "/modules" },
};

/** Modules identity: compact catalog intro (not homepage, not industries photo hero). */
export default function AllModulesPage() {
  return (
    <>
      <Section className="relative !pb-5 !pt-10 md:!pt-12 overflow-hidden border-b border-slate-100">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(ellipse_60%_80%_at_90%_20%,rgba(5,73,164,0.08),transparent_70%)]"
          aria-hidden
        />
        <Container className="relative">
          <AnimateIn>
            <div className="mt-2 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_auto] lg:items-end">
              <div className="max-w-2xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.04] px-3 py-1 text-xs font-semibold text-primary">
                  <Boxes className="h-3.5 w-3.5" aria-hidden />
                  Purchasable module library
                </div>
                <h1 className="text-balance text-3xl font-semibold tracking-tight text-[#0b1f3a] sm:text-4xl">
                  Every module you can add to your ERP
                </h1>
                <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Live catalog of modules and categories for Custom ERP and plan upgrades. For
                  platform capability stories and industry preinstalls, see{" "}
                  <Link href="/erp-features" className="font-medium text-primary hover:underline">
                    ERP Features
                  </Link>
                  .
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" className="h-10 rounded-full px-4">
                  <Link href="/build-your-own-erp">
                    Build your own ERP
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="h-10 rounded-full px-4">
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
        description="Use the builder to pick modules, review a recommended setup, and continue to signup with live pricing."
        primaryLabel="Build Your Own ERP"
        primaryHref="/build-your-own-erp"
        secondaryLabel="View pricing"
        secondaryHref="/pricing"
      />
    </>
  );
}

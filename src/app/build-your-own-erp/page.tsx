import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { siteConfig } from "@/lib/data/site";
import { Container, Section } from "@/components/shared/section";
import { AnimateIn } from "@/components/shared/animate-in";
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

/** Presentation chrome only — wizard/API untouched. */
export default function BuildYourOwnErpPage() {
  return (
    <>
      <Section className="relative !pb-4 !pt-8 md:!pb-5 md:!pt-10 overflow-hidden bg-[#0b1f3a]">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_15%_0%,rgba(5,73,164,0.45),transparent_60%),radial-gradient(ellipse_50%_40%_at_90%_100%,rgba(14,165,233,0.12),transparent_55%)]"
          aria-hidden
        />
        <Container className="relative">
          <AnimateIn>
            <div className="max-w-3xl">
              <p className="mb-1.5 text-xs font-semibold tracking-[0.14em] text-sky-300 uppercase">
                Custom ERP · {siteConfig.productLine}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-white text-balance sm:text-3xl md:text-4xl">
                Configure only what you will use
              </h1>
              <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
                Industry → business type → modules → feature packs → limits → billing. Live totals
                before signup. Fixed plans stay on Pricing.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  asChild
                  size="sm"
                  className="h-9 rounded-full bg-white px-4 text-[#0b1f3a] hover:bg-white/90"
                >
                  <Link href="#builder">
                    Start building
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-9 rounded-full border-white/30 bg-transparent px-4 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/pricing">Fixed plans</Link>
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

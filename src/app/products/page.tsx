import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { products, siteConfig } from "@/lib/data/site";
import { productShowcases } from "@/lib/data/product-showcase";
import { Container, Section } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CTASection } from "@/components/shared/cta-section";
import { ProductStack } from "@/components/sections/product-stack";

export const metadata: Metadata = {
  title: `ERP Products & Modules — ${siteConfig.name}`,
  description: `Explore ${siteConfig.name} modules: Inventory, POS, Sales, Purchasing, Finance, CRM, HR, Manufacturing, and AI Workspace — business outcomes and practical capabilities.`,
  keywords: [
    "WAAMTO modules",
    "ERP products",
    "inventory POS CRM",
    "cloud ERP modules",
    "manufacturing ERP",
  ],
  alternates: { canonical: "/products" },
};

export default function ProductsPage() {
  return (
    <>
      <Section className="relative !pb-8 !pt-12 md:!pt-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(37,99,235,0.08),transparent_70%)]" />
        <Container className="relative">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Badge variant="accent" className="mb-3">
                Modules & AI
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#0b1f3a] text-balance">
                Modules that grow with your business
              </h1>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
                One module at a time — what it does, who it&apos;s for, and the outcomes it unlocks.
                Includes AI Workspace for assistant help, document capture, and smarter decisions.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full">
                <Link href="/signup">
                  Start free trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link href="#inventory">Start exploring</Link>
              </Button>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {products.map((p, i) => (
              <a
                key={p.id}
                href={`#${p.slug}`}
                className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
              >
                {String(i + 1).padStart(2, "0")}. {p.name}
              </a>
            ))}
          </div>
        </Container>
      </Section>

      <ProductStack products={productShowcases} />

      <CTASection
        title={`Build your ${siteConfig.name} stack`}
        description="Start with the modules you need today and expand as your operations grow. Compare plan limits on Pricing."
        primaryLabel="Build Your Own ERP"
        primaryHref="/build-your-own-erp"
        secondaryLabel="Compare plans"
        secondaryHref="/pricing#compare"
      />
    </>
  );
}

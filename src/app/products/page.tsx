import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";
import { comparisonFeatures, products, siteConfig } from "@/lib/data/site";
import { productShowcases } from "@/lib/data/product-showcase";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CTASection } from "@/components/shared/cta-section";
import { ProductStack } from "@/components/sections/product-stack";

export const metadata: Metadata = {
  title: "Products",
  description: `Explore ${siteConfig.name} SaaS Core modules: Inventory, POS, Sales, Purchasing, Finance, CRM, HR, Manufacturing — one module per section with benefits, use cases, and live previews.`,
};

export default function ProductsPage() {
  return (
    <>
      <Section className="relative !pb-8 !pt-12 md:!pt-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(37,99,235,0.08),transparent_70%)]" />
        <Container className="relative">
          <Breadcrumbs items={[{ label: "Products" }]} />
          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Badge variant="accent" className="mb-3">
                SaaS Core modules
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#0b1f3a] text-balance">
                Products that stack as you scroll
              </h1>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
                One module at a time — what it is, who it&apos;s for, and why it helps. Scroll to
                stack each card; after the last product, the page scrolls normally again.
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

      <Section className="!pt-10">
        <Container>
          <SectionHeader
            eyebrow="Compare"
            title="Feature comparison across plans"
            description="See which capabilities unlock as you move from Starter to Enterprise."
          />
          <div className="overflow-x-auto overflow-y-hidden rounded-2xl border border-border bg-white scrollbar-thin">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/60">
                  <th className="px-5 py-4 text-left font-semibold">Capability</th>
                  {["Starter", "Professional", "Business", "Enterprise"].map((h) => (
                    <th key={h} className="px-5 py-4 text-center font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row) => (
                  <tr key={row.name} className="border-b border-border last:border-0">
                    <td className="px-5 py-4 font-medium">{row.name}</td>
                    {(["starter", "professional", "business", "enterprise"] as const).map((key) => {
                      const val = row[key];
                      return (
                        <td key={key} className="px-5 py-4 text-center text-muted-foreground">
                          {typeof val === "boolean" ? (
                            val ? (
                              <Check className="mx-auto h-4 w-4 text-accent" />
                            ) : (
                              <Minus className="mx-auto h-4 w-4 text-slate-300" />
                            )
                          ) : (
                            val
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Need a custom package?{" "}
            <Link href="/contact?intent=enterprise" className="text-primary hover:underline">
              Contact sales
            </Link>
          </p>
        </Container>
      </Section>

      <CTASection
        title={`Build your ${siteConfig.name} stack`}
        description="Start with the modules you need today and expand as your operations grow."
      />
    </>
  );
}

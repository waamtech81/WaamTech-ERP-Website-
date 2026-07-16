import type { Metadata } from "next";
import Link from "next/link";
import { products, comparisonFeatures } from "@/lib/data/site";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ProductCard } from "@/components/shared/cards";
import { AnimateIn } from "@/components/shared/animate-in";
import { Badge } from "@/components/ui/badge";
import { CTASection } from "@/components/shared/cta-section";
import { Check, Minus } from "lucide-react";

export const metadata: Metadata = {
  title: "Products",
  description: "Explore WaamTech ERP, Inventory, POS, CRM, Finance, HR, Property, Pharmacy, Warehouse, Maps, WhatsApp, and future products.",
};

export default function ProductsPage() {
  const available = products.filter((p) => p.status === "available");
  const future = products.filter((p) => p.status === "coming-soon");

  return (
    <>
      <Section className="!pb-10 !pt-12 md:!pt-16">
        <Container>
          <Breadcrumbs items={[{ label: "Products" }]} />
          <SectionHeader
            align="left"
            eyebrow="Products"
            title="The WaamTech product suite"
            description="Enterprise-grade modules that share one design system, one data model, and one operational truth."
            className="mb-0 max-w-3xl"
          />
        </Container>
      </Section>

      <Section muted className="!pt-10">
        <Container>
          <div className="mb-8 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold tracking-tight">All products</h2>
            <Badge variant="outline">{available.length} available</Badge>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {available.map((p, i) => (
              <div key={p.id} id={p.slug}>
                <AnimateIn delay={i * 0.04}>
                  <ProductCard
                    name={p.name}
                    tagline={p.tagline}
                    description={p.description}
                    icon={p.icon}
                    href={`/products#${p.slug}`}
                    status={p.status}
                    features={p.features}
                  />
                </AnimateIn>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeader
            eyebrow="Roadmap"
            title="Future products"
            description="We're expanding the platform with intelligence layers that help leaders anticipate demand and risk."
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {future.map((p, i) => (
              <div key={p.id} id={p.slug}>
                <AnimateIn delay={i * 0.04}>
                  <ProductCard
                    name={p.name}
                    tagline={p.tagline}
                    description={p.description}
                    icon={p.icon}
                    href={`/products#${p.slug}`}
                    status={p.status}
                    features={p.features}
                  />
                </AnimateIn>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section muted>
        <Container>
          <SectionHeader
            eyebrow="Compare"
            title="Feature comparison across plans"
            description="See which capabilities unlock as you move from Starter to Enterprise."
          />
          <div className="overflow-x-auto rounded-2xl border border-border bg-white">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/60">
                  <th className="px-5 py-4 text-left font-semibold">Capability</th>
                  {["Starter", "Professional", "Business", "Enterprise"].map((h) => (
                    <th key={h} className="px-5 py-4 text-center font-semibold">{h}</th>
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
        title="Build your WaamTech stack"
        description="Start with the modules you need today and expand as your operations grow."
      />
    </>
  );
}

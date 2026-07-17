import type { Metadata } from "next";
import Link from "next/link";
import { coreModules } from "@/lib/data/core";
import { comparisonFeatures } from "@/lib/data/site";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AnimateIn } from "@/components/shared/animate-in";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CTASection } from "@/components/shared/cta-section";
import { getIcon } from "@/lib/icons";
import { Check, Minus } from "lucide-react";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Explore WAAMTO SaaS Core modules: Inventory, POS, Sales, Purchasing, Finance, CRM, HR, Manufacturing, and more.",
};

export default function ProductsPage() {
  return (
    <>
      <Section className="!pb-10 !pt-12 md:!pt-16">
        <Container>
          <Breadcrumbs items={[{ label: "Products" }]} />
          <SectionHeader
            align="left"
            eyebrow="SaaS Core modules"
            title="The WAAMTO core suite"
            description="Installable business modules on a clean platform core — Inventory, POS, Sales, Purchasing, Finance, CRM, HR & Payroll, and Manufacturing."
            className="mb-0 max-w-3xl"
          />
        </Container>
      </Section>

      <Section muted className="!pt-10">
        <Container>
          <div className="mb-8 md:mb-10 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold tracking-tight">Core modules</h2>
            <Badge variant="outline">{coreModules.length} modules</Badge>
          </div>
          <div className="grid gap-5 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {coreModules.map((m, i) => {
              const Icon = getIcon(m.icon);
              return (
                <div key={m.id} id={m.id}>
                  <AnimateIn delay={i * 0.04}>
                    <Card className="h-full hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(15,23,42,0.08)] hover:border-primary/20">
                      <CardHeader>
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <CardTitle>{m.name}</CardTitle>
                        <p className="text-sm font-medium text-foreground/70">{m.tagline}</p>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">{m.description}</p>
                        <ul className="mt-5 flex flex-wrap gap-2">
                          {m.highlights.map((h) => (
                            <li key={h}>
                              <Badge variant="muted">{h}</Badge>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </AnimateIn>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section>
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
        title="Build your WAAMTO stack"
        description="Start with the modules you need today and expand as your operations grow."
      />
    </>
  );
}

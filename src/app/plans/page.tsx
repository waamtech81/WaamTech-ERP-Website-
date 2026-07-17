import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { pricingPlans, comparisonFeatures, deploymentOptions } from "@/lib/data/site";
import { getIcon } from "@/lib/icons";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AnimateIn } from "@/components/shared/animate-in";
import { CTASection } from "@/components/shared/cta-section";
import { LaunchDiscountBanner, PricingCards } from "@/components/sections/pricing-cards";
import { PriceNote } from "@/components/shared/price-note";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Subscription Plans",
  description: "Compare WaamTech Starter, Professional, Business, Lifetime, and Enterprise plans with launch discount pricing.",
};

export default function PlansPage() {
  return (
    <>
      <Section className="!pb-10 !pt-12 md:!pt-16">
        <Container>
          <Breadcrumbs items={[{ label: "Subscription Plans" }]} />
          <SectionHeader
            align="left"
            eyebrow="Subscription plans"
            title="Choose the plan that matches your stage"
            description="Starter to Enterprise — plus lifetime license and custom deployment for own server, whitelabel & local setup."
            className="mb-0 max-w-3xl"
          />
        </Container>
      </Section>

      <Section muted className="!pt-6">
        <Container>
          <LaunchDiscountBanner />
          <PriceNote className="mb-6 text-center text-xs text-muted-foreground" />
          <PricingCards plans={pricingPlans} yearly={true} columns="md:grid-cols-2 xl:grid-cols-3" />
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeader eyebrow="Deployment" title="Beyond cloud SaaS" />
          <div className="grid gap-5 md:grid-cols-2">
            {deploymentOptions.filter((d) => !d.featured).map((opt, i) => {
              const Icon = getIcon(opt.icon);
              return (
                <AnimateIn key={opt.id} delay={i * 0.06}>
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 text-primary">
                          <Icon className="h-5 w-5" />
                        </span>
                        <CardTitle className="text-lg">{opt.title}</CardTitle>
                      </div>
                      <p className="text-sm text-muted-foreground">{opt.description}</p>
                    </CardHeader>
                    <CardContent>
                      <Button asChild variant="outline" className="rounded-full">
                        <Link href={opt.href}>{opt.cta}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </AnimateIn>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section muted>
        <Container>
          <SectionHeader eyebrow="Feature comparison" title="Detailed plan matrix" />
          <div className="overflow-x-auto rounded-2xl border border-border bg-white">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/60">
                  <th className="px-5 py-4 text-left font-semibold">Feature</th>
                  {pricingPlans.map((p) => (
                    <th key={p.id} className="px-4 py-4 text-center font-semibold text-xs">{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row) => (
                  <tr key={row.name} className="border-b border-border last:border-0">
                    <td className="px-5 py-4 font-medium">{row.name}</td>
                    {(["starter", "professional", "business", "lifetime", "enterprise"] as const).map((key) => {
                      const val = row[key];
                      return (
                        <td key={key} className="px-4 py-4 text-center text-muted-foreground text-xs">
                          {typeof val === "boolean" ? (
                            val ? <Check className="mx-auto h-4 w-4 text-accent" /> : <Minus className="mx-auto h-4 w-4 text-slate-300" />
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
        </Container>
      </Section>

      <CTASection />
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { pricingPlans, comparisonFeatures } from "@/lib/data/site";
import { formatCurrency } from "@/lib/utils";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AnimateIn } from "@/components/shared/animate-in";
import { CTASection } from "@/components/shared/cta-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Subscription Plans",
  description: "Compare WaamTech Starter, Professional, Business, and Enterprise subscription plans.",
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
            description="Starter, Professional, Business, and Enterprise — each designed for a clear operational maturity level."
            className="mb-0 max-w-3xl"
          />
        </Container>
      </Section>

      <Section muted className="!pt-10">
        <Container>
          <div className="grid gap-6 md:grid-cols-2">
            {pricingPlans.map((plan, i) => (
              <AnimateIn key={plan.id} delay={i * 0.06}>
                <Card className={`h-full ${plan.popular ? "border-primary" : ""}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      {plan.popular ? <Badge>Recommended</Badge> : null}
                    </div>
                    <p className="text-muted-foreground">{plan.description}</p>
                    <p className="pt-2 text-3xl font-semibold tracking-tight">
                      {plan.yearlyPrice !== null ? (
                        <>
                          {formatCurrency(plan.yearlyPrice)}
                          <span className="text-sm font-normal text-muted-foreground"> /user/mo billed yearly</span>
                        </>
                      ) : (
                        "Talk to sales"
                      )}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2.5 mb-6">
                      {plan.features.map((f) => (
                        <li key={f} className="flex gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button asChild className="w-full" variant={plan.popular ? "default" : "outline"}>
                      <Link href={plan.href}>{plan.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              </AnimateIn>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeader eyebrow="Feature comparison" title="Detailed plan matrix" />
          <div className="overflow-x-auto rounded-2xl border border-border bg-white">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/60">
                  <th className="px-5 py-4 text-left font-semibold">Feature</th>
                  {pricingPlans.map((p) => (
                    <th key={p.id} className="px-5 py-4 text-center font-semibold">{p.name}</th>
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

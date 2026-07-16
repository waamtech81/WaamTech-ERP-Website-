"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { pricingPlans, comparisonFeatures, faqs } from "@/lib/data/site";
import { formatCurrency } from "@/lib/utils";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AnimateIn } from "@/components/shared/animate-in";
import { CTASection } from "@/components/shared/cta-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function PricingPage() {
  const [yearly, setYearly] = useState(true);
  const billingFaqs = faqs.filter((f) => f.category === "Billing" || f.category === "Product").slice(0, 5);

  return (
    <>
      <Section className="!pb-6 !pt-12 md:!pt-16">
        <Container>
          <Breadcrumbs items={[{ label: "Pricing" }]} />
          <SectionHeader
            eyebrow="Pricing"
            title="Simple, transparent plans"
            description="Choose monthly or yearly billing. Upgrade anytime as your teams and locations grow."
          />
          <div className="mb-12 flex items-center justify-center gap-3">
            <Label htmlFor="billing" className={!yearly ? "text-foreground" : "text-muted-foreground"}>
              Monthly
            </Label>
            <Switch id="billing" checked={yearly} onCheckedChange={setYearly} />
            <Label htmlFor="billing" className={yearly ? "text-foreground" : "text-muted-foreground"}>
              Yearly
            </Label>
            <Badge variant="accent">Save up to 20%</Badge>
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            {pricingPlans.map((plan, i) => {
              const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
              return (
                <AnimateIn key={plan.id} delay={i * 0.06}>
                  <Card
                    className={`h-full flex flex-col ${
                      plan.popular
                        ? "border-primary shadow-[0_16px_48px_rgba(37,99,235,0.1)] relative"
                        : ""
                    }`}
                  >
                    {plan.popular ? (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge>Most popular</Badge>
                      </div>
                    ) : null}
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      <p className="text-sm text-muted-foreground min-h-[40px]">{plan.description}</p>
                      <div className="pt-3">
                        {price !== null ? (
                          <>
                            <span className="text-4xl font-semibold tracking-tight">{formatCurrency(price)}</span>
                            <span className="text-sm text-muted-foreground"> /user/mo</span>
                          </>
                        ) : (
                          <span className="text-4xl font-semibold tracking-tight">Custom</span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col">
                      <ul className="space-y-2.5 mb-8 flex-1">
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
              );
            })}
          </div>
        </Container>
      </Section>

      <Section muted>
        <Container>
          <SectionHeader
            eyebrow="Compare plans"
            title="Everything included, side by side"
          />
          <div className="overflow-x-auto rounded-2xl border border-border bg-white">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/60">
                  <th className="px-5 py-4 text-left font-semibold">Feature</th>
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

      <Section>
        <Container className="max-w-3xl">
          <SectionHeader eyebrow="FAQ" title="Pricing questions, answered" />
          <Accordion type="single" collapsible className="w-full">
            {billingFaqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            More questions? Visit our{" "}
            <Link href="/faqs" className="text-primary hover:underline">
              full FAQ
            </Link>
            .
          </p>
        </Container>
      </Section>

      <CTASection
        title="Need an Enterprise quote?"
        description="We'll design a package around users, modules, security, and support SLAs."
        primaryLabel="Contact sales"
        primaryHref="/contact?intent=enterprise"
        secondaryLabel="View plans"
        secondaryHref="/plans"
      />
    </>
  );
}

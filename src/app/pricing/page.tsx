"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { pricingPlans, comparisonFeatures, deploymentOptions, faqs } from "@/lib/data/site";
import { getIcon } from "@/lib/icons";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AnimateIn } from "@/components/shared/animate-in";
import { CTASection } from "@/components/shared/cta-section";
import { LaunchDiscountBanner, PricingCards } from "@/components/sections/pricing-cards";
import { PriceNote } from "@/components/shared/price-note";
import { useLocale } from "@/components/providers/locale-provider";
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
  const { t } = useLocale();
  const billingFaqs = faqs.filter((f) => f.category === "Billing" || f.category === "Product").slice(0, 6);
  const planNames = pricingPlans.map((p) => p.name);

  return (
    <>
      <Section className="!pb-6 !pt-12 md:!pt-16">
        <Container>
          <Breadcrumbs items={[{ label: "Pricing" }]} />
          <SectionHeader
            eyebrow="Pricing"
            title="Affordable ERP — launch pricing"
            description="Market-aligned plans with 50% launch discount. Cloud SaaS, lifetime license, own server, whitelabel & local deployment available."
          />

          <LaunchDiscountBanner />

          <div className="mb-4 flex flex-wrap items-center justify-center gap-3 notranslate" translate="no">
            <Label htmlFor="billing" className={!yearly ? "text-foreground" : "text-muted-foreground"}>
              {t("pricing.monthly", "Monthly")}
            </Label>
            <Switch id="billing" checked={yearly} onCheckedChange={setYearly} />
            <Label htmlFor="billing" className={yearly ? "text-foreground" : "text-muted-foreground"}>
              {t("pricing.yearly", "Yearly")}
            </Label>
            <Badge variant="accent">{t("pricing.extraYearly", "Extra 20% off yearly")}</Badge>
          </div>

          <PriceNote className="mb-8 text-center text-xs text-muted-foreground" />

          <PricingCards plans={pricingPlans} yearly={yearly} columns="sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5" />

          <div className="mt-10 rounded-2xl border border-border bg-muted/40 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
              <div>
                <p className="font-semibold text-[#0b1f3a]">Responsive web + native mobile app</p>
                <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                  Every plan includes the full responsive web app on desktop, tablet, and phone.
                  Native mobile app is included for Professional+ and is required for field profiles
                  like Distribution, Warehouse, Field Service, Water delivery, and Property — shown
                  when you pick your business type at signup.
                </p>
              </div>
              <Button asChild variant="outline" className="rounded-full shrink-0">
                <Link href="/mobile-app">Mobile access details</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      <Section muted>
        <Container>
          <SectionHeader
            eyebrow="Deployment options"
            title="How you want to run WaamTech"
            description="Cloud SaaS for quick start — or contact us for own cloud server, whitelabel, and local on-premise deployment."
          />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {deploymentOptions.map((opt, i) => {
              const Icon = getIcon(opt.icon);
              return (
                <AnimateIn key={opt.id} delay={i * 0.06}>
                  <Card className={`h-full ${opt.featured ? "border-primary ring-1 ring-primary/15" : ""}`}>
                    <CardHeader>
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg">{opt.title}</CardTitle>
                      <p className="text-sm text-muted-foreground leading-relaxed">{opt.description}</p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1.5 mb-5">
                        {opt.highlights.map((h) => (
                          <li key={h} className="flex gap-2 text-xs text-muted-foreground">
                            <Check className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                            {h}
                          </li>
                        ))}
                      </ul>
                      <Button asChild variant={opt.featured ? "default" : "outline"} className="w-full rounded-full" size="sm">
                        <Link href={opt.href}>{opt.cta}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </AnimateIn>
              );
            })}
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Need ERP on a <strong>local server</strong> or <strong>your own cloud</strong>?{" "}
            <Link href="/contact?intent=local-server" className="text-primary hover:underline">
              Contact us
            </Link>{" "}
            for a custom deployment quote.
          </p>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeader eyebrow="Compare plans" title="Everything included, side by side" />
          <div className="overflow-x-auto rounded-2xl border border-border bg-white">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/60">
                  <th className="px-5 py-4 text-left font-semibold">Feature</th>
                  {planNames.map((h) => (
                    <th key={h} className="px-4 py-4 text-center font-semibold text-xs">{h}</th>
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

      <Section muted>
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
            <Link href="/faqs" className="text-primary hover:underline">full FAQ</Link>.
          </p>
        </Container>
      </Section>

      <CTASection
        title="Need own server, whitelabel, or local deployment?"
        description="We'll design a package for your infrastructure, branding, and support requirements."
        primaryLabel="Contact sales"
        primaryHref="/contact?intent=enterprise"
        secondaryLabel="View servers"
        secondaryHref="/servers"
      />
    </>
  );
}

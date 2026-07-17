"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { deploymentOptions, faqs } from "@/lib/data/site";
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
import { TrustBadgesBand } from "@/components/sections/trust-badges-band";
import { useCatalogBundle } from "@/hooks/use-commercial";
import {
  CatalogEmptyState,
  CatalogErrorState,
  CatalogSkeleton,
} from "@/components/commercial/catalog-states";
import { buildDynamicComparison, cardPlans, enterprisePlan } from "@/lib/commercial/mappers";

export default function PricingPage() {
  const [yearly, setYearly] = useState(true);
  const { t } = useLocale();
  const catalog = useCatalogBundle();
  const billingFaqs = faqs.filter((f) => f.category === "Billing" || f.category === "Product").slice(0, 6);

  const pricingPlans = catalog.data.pricingPlans || [];
  const displayCardPlans = useMemo(
    () => cardPlans(pricingPlans).filter((p) => !/enterprise/i.test(p.id)),
    [pricingPlans]
  );
  const enterprise = useMemo(
    () => catalog.data.enterprise || enterprisePlan(pricingPlans),
    [catalog.data.enterprise, pricingPlans]
  );
  const comparisonRows = useMemo(() => buildDynamicComparison(pricingPlans), [pricingPlans]);
  const planColumns = pricingPlans;

  return (
    <>
      <Section className="!pb-6 !pt-12 md:!pt-16">
        <Container>
          <Breadcrumbs items={[{ label: "Pricing" }]} />
          <SectionHeader
            eyebrow="Pricing"
            title="Plans from the License Engine"
            description="Starter, Business, Lifetime, and Enterprise — loaded live from WaamTech commercial catalog. Enterprise is always custom pricing."
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

          {catalog.loading ? <CatalogSkeleton rows={3} /> : null}
          {catalog.error ? (
            <CatalogErrorState message={catalog.error} onRetry={catalog.retry} />
          ) : null}
          {!catalog.loading && !catalog.error && displayCardPlans.length === 0 ? (
            <CatalogEmptyState message="No public plans are published yet." />
          ) : null}
          {!catalog.loading && !catalog.error && displayCardPlans.length > 0 ? (
            <PricingCards
              plans={displayCardPlans}
              yearly={yearly}
              columns="sm:grid-cols-2 xl:grid-cols-3"
            />
          ) : null}

          {enterprise ? (
            <div className="mt-10 rounded-2xl border border-border bg-[#0b1f3a] px-6 py-8 md:px-10 md:py-10 text-white">
              <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
                <div className="max-w-2xl">
                  <p className="text-sm font-semibold uppercase tracking-wide text-sky-200/90">
                    Enterprise
                  </p>
                  <h3 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight">
                    Custom Pricing — Contact Sales
                  </h3>
                  <p className="mt-3 text-sm md:text-base text-white/70 leading-relaxed">
                    {enterprise.description ||
                      "Need own server, whitelabel, or custom scale? Request a quote — we never publish fixed Enterprise pricing."}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full bg-white text-[#0b1f3a] hover:bg-slate-100"
                  >
                    <Link href={enterprise.href || "/contact?intent=enterprise"}>Contact Sales</Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-full border-white/30 bg-transparent text-white hover:bg-white/10"
                  >
                    <Link href="/contact?intent=quote">Request a Quote</Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
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
          {catalog.loading ? <CatalogSkeleton rows={2} className="xl:grid-cols-1" /> : null}
          {!catalog.loading && planColumns.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-border bg-white">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50/80">
                    <th className="px-4 py-3 text-left font-semibold text-[#0b1f3a]">Feature</th>
                    {planColumns.map((p) => (
                      <th key={p.id} className="px-4 py-3 text-center font-semibold text-[#0b1f3a]">
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={String(row.name)} className="border-b border-border/70 last:border-0">
                      <td className="px-4 py-3 font-medium text-[#0b1f3a]">{row.name}</td>
                      {planColumns.map((p) => {
                        const val = row[p.id];
                        return (
                          <td key={p.id} className="px-4 py-3 text-center text-muted-foreground">
                            {typeof val === "boolean" ? (
                              val ? (
                                <Check className="mx-auto h-4 w-4 text-accent" />
                              ) : (
                                <Minus className="mx-auto h-4 w-4 text-slate-300" />
                              )
                            ) : (
                              String(val ?? "—")
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr>
                    <td className="px-4 py-3 font-medium text-[#0b1f3a]">Description</td>
                    {planColumns.map((p) => (
                      <td key={p.id} className="px-4 py-3 text-center text-xs text-muted-foreground">
                        {p.description}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : null}
        </Container>
      </Section>

      <Section muted>
        <Container>
          <SectionHeader eyebrow="FAQ" title="Billing questions" />
          <Accordion type="single" collapsible className="mx-auto max-w-3xl">
            {billingFaqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Container>
      </Section>

      <TrustBadgesBand />
      <CTASection
        title="Ready to start?"
        description="Pick a plan from the live catalog and begin your free trial."
        primaryLabel="Start free trial"
        primaryHref="/signup"
        secondaryLabel="Talk to sales"
        secondaryHref="/contact?intent=pricing"
      />
    </>
  );
}

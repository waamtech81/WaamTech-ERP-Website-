"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { deploymentOptions, faqs } from "@/lib/data/site";
import { getIcon } from "@/lib/icons";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AnimateIn } from "@/components/shared/animate-in";
import { CTASection } from "@/components/shared/cta-section";
import { LaunchDiscountBanner, PricingCards } from "@/components/sections/pricing-cards";
import { PricingComparisonTable } from "@/components/sections/pricing-comparison-table";
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
import {
  buildDynamicComparison,
  cardPlans,
  enterprisePlan,
  launchPromoFromPlans,
  publicMarketingPlans,
} from "@/lib/commercial/mappers";

export default function PricingPage() {
  const [yearly, setYearly] = useState(true);
  const [, startTransition] = useTransition();
  const { t, formatPrice } = useLocale();
  const catalog = useCatalogBundle();
  const billingFaqs = faqs.filter((f) => f.category === "Billing" || f.category === "Product").slice(0, 6);

  const pricingPlans = useMemo(
    () => publicMarketingPlans(catalog.data.pricingPlans || []),
    [catalog.data.pricingPlans]
  );
  const displayCardPlans = useMemo(
    () => cardPlans(pricingPlans).filter((p) => !/enterprise/i.test(p.id)),
    [pricingPlans]
  );
  const enterprise = useMemo(
    () => catalog.data.enterprise || enterprisePlan(pricingPlans),
    [catalog.data.enterprise, pricingPlans]
  );
  const comparisonRows = useMemo(
    () => buildDynamicComparison(pricingPlans, catalog.data.comparison),
    [pricingPlans, catalog.data.comparison]
  );
  const planColumns = pricingPlans;
  const promo = useMemo(() => launchPromoFromPlans(pricingPlans), [pricingPlans]);

  const yearlySavingsHint = useMemo(() => {
    const withSavings = displayCardPlans
      .map((p) => p.yearlySavingsAmount)
      .filter((n): n is number => n != null && n > 0);
    if (!withSavings.length) return null;
    return Math.max(...withSavings);
  }, [displayCardPlans]);

  function onBillingChange(nextYearly: boolean) {
    startTransition(() => {
      setYearly(nextYearly);
    });
    // Soft-refresh catalog so cycle display always uses latest Engine prices.
    catalog.retry();
  }

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

          {promo ? (
            <LaunchDiscountBanner
              campaign={promo.campaign}
              badge={promo.badge}
              maxDiscount={promo.maxDiscount}
              maxSavings={promo.maxSavings}
            />
          ) : null}

          <div className="mb-4 flex flex-wrap items-center justify-center gap-3 notranslate" translate="no">
            <Label
              htmlFor="billing"
              className={!yearly ? "text-foreground" : "text-muted-foreground"}
            >
              {t("pricing.monthly", "Monthly")}
            </Label>
            <Switch id="billing" checked={yearly} onCheckedChange={onBillingChange} />
            <Label
              htmlFor="billing"
              className={yearly ? "text-foreground" : "text-muted-foreground"}
            >
              {t("pricing.yearly", "Yearly")}
            </Label>
            {yearly && yearlySavingsHint ? (
              <Badge variant="accent">
                Save up to <span translate="no">{formatPrice(yearlySavingsHint)}</span>/yr
              </Badge>
            ) : null}
          </div>

          <PriceNote className="mb-8 text-center text-xs text-muted-foreground" />

          {catalog.loading ? <CatalogSkeleton rows={3} /> : null}
          {catalog.error && displayCardPlans.length === 0 ? (
            <CatalogErrorState
              message={catalog.error}
              onRetry={catalog.retry}
              offline={catalog.offline}
            />
          ) : null}
          {catalog.error && displayCardPlans.length > 0 ? (
            <div
              className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950"
              role="status"
            >
              Showing last known plans — live catalog refresh failed.{" "}
              <button
                type="button"
                className="font-medium underline underline-offset-2"
                onClick={catalog.retry}
              >
                Retry
              </button>
            </div>
          ) : null}
          {!catalog.loading && !catalog.error && displayCardPlans.length === 0 ? (
            <CatalogEmptyState message="No Plans Available" />
          ) : null}
          {!catalog.loading && displayCardPlans.length > 0 ? (
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
                    {enterprise.ribbon || enterprise.badge || "Enterprise"}
                  </p>
                  <h3 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight">
                    {enterprise.subtitle || "Custom Pricing — Contact Sales"}
                  </h3>
                  <p className="mt-3 text-sm md:text-base text-white/70 leading-relaxed">
                    {enterprise.marketingSummary ||
                      enterprise.description ||
                      "Need own server, whitelabel, or custom scale? Request a quote — we never publish fixed Enterprise pricing."}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full bg-white text-[#0b1f3a] hover:bg-slate-100"
                  >
                    <Link href={enterprise.href || "/contact?intent=enterprise"}>
                      {enterprise.cta || "Contact Sales"}
                    </Link>
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
                <AnimateIn key={opt.id} delay={i * 0.06} className="h-full">
                  <Card className={`h-full flex flex-col ${opt.featured ? "border-primary ring-1 ring-primary/15" : ""}`}>
                    <CardHeader>
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg">{opt.title}</CardTitle>
                      <p className="text-sm text-muted-foreground leading-relaxed">{opt.description}</p>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col">
                      <ul className="space-y-1.5 mb-5 flex-1">
                        {opt.highlights.map((h) => (
                          <li key={h} className="flex gap-2 text-xs text-muted-foreground">
                            <Check className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                            {h}
                          </li>
                        ))}
                      </ul>
                      <Button asChild variant={opt.featured ? "default" : "outline"} className="mt-auto w-full rounded-full" size="sm">
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
          <PricingComparisonTable
            plans={planColumns}
            rows={comparisonRows}
            loading={catalog.loading}
          />
          {!catalog.loading && planColumns.length === 0 ? (
            <CatalogEmptyState message="No Plans Available" />
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

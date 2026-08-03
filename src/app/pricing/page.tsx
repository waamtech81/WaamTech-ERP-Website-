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
import { FaqAccordionList } from "@/components/sections/faq-accordion-list";
import { TrustBadgesBand } from "@/components/sections/trust-badges-band";
import { useCatalogBundle } from "@/hooks/use-commercial";
import {
  CatalogEmptyState,
  CatalogErrorState,
  CatalogComparisonUnavailable,
  CatalogSkeleton,
} from "@/components/commercial/catalog-states";
import {
  buildDynamicComparison,
  cardPlans,
  comparisonHierarchyNote,
  launchPromoFromPlans,
  publicMarketingPlans,
} from "@/lib/commercial/mappers";
import {
  comparisonNoteFromRegistry,
  customErpPricingCopy,
  orderComparisonPlans,
  plansForCommercialComparison,
  pricingGuideFromRegistry,
  resolveManualPricingCards,
} from "@/lib/commercial/commercial-experience";
import type { PublicCommercialRegistry } from "@/lib/commercial/types";
import { isEngineComparisonUsable } from "@/lib/commercial/catalog-revision";

export default function PricingPage() {
  const [yearly, setYearly] = useState(true);
  const [, startTransition] = useTransition();
  const { t, formatPrice } = useLocale();
  const catalog = useCatalogBundle();

  const registry = catalog.data.commercial_registry as
    | PublicCommercialRegistry
    | null
    | undefined;

  const pricingPlans = useMemo(
    () => publicMarketingPlans(catalog.data.pricingPlans || []),
    [catalog.data.pricingPlans]
  );
  const displayCardPlans = useMemo(() => cardPlans(pricingPlans), [pricingPlans]);
  const manuals = useMemo(
    () =>
      resolveManualPricingCards({
        plans: pricingPlans,
        registry: registry || catalog.data.commercial_registry,
      }),
    [pricingPlans, registry, catalog.data.commercial_registry]
  );
  const enterprise = useMemo(
    () => catalog.data.enterprise || manuals.enterprise,
    [catalog.data.enterprise, manuals.enterprise]
  );
  const whiteLabel = useMemo(
    () => catalog.data.whiteLabel || manuals.whiteLabel,
    [catalog.data.whiteLabel, manuals.whiteLabel]
  );
  const fullRegistry = useMemo(() => {
    const r = registry || catalog.data.commercial_registry;
    if (r && "plan_entitlements" in r && Array.isArray(r.plan_entitlements)) {
      return r as PublicCommercialRegistry;
    }
    return null;
  }, [registry, catalog.data.commercial_registry]);
  const compareSourcePlans = useMemo(
    () =>
      plansForCommercialComparison({
        plans: pricingPlans,
        registry: registry || catalog.data.commercial_registry,
      }),
    [pricingPlans, registry, catalog.data.commercial_registry]
  );
  const comparisonRows = useMemo(
    () =>
      buildDynamicComparison(
        compareSourcePlans,
        catalog.data.comparison,
        fullRegistry?.predefined_hierarchy ||
          registry?.predefined_hierarchy ||
          (catalog.data.commercial_registry as { predefined_hierarchy?: string[] } | null)
            ?.predefined_hierarchy,
        fullRegistry
      ),
    [
      compareSourcePlans,
      catalog.data.comparison,
      fullRegistry,
      registry,
      catalog.data.commercial_registry,
    ]
  );
  const comparisonAvailable = useMemo(() => {
    if (comparisonRows.length > 0) return true;
    const metaAvailable = catalog.data.meta?.comparisonAvailable;
    if (metaAvailable === false && !fullRegistry?.plan_entitlements?.length) return false;
    return isEngineComparisonUsable(catalog.data.comparison) && comparisonRows.length > 0;
  }, [
    catalog.data.meta?.comparisonAvailable,
    catalog.data.comparison,
    comparisonRows.length,
    fullRegistry?.plan_entitlements?.length,
  ]);
  const hierarchyNote = useMemo(() => {
    const engineNote = comparisonHierarchyNote(
      catalog.data.comparison,
      catalog.data.commercial_registry
    );
    return comparisonNoteFromRegistry(catalog.data.commercial_registry, engineNote);
  }, [catalog.data.comparison, catalog.data.commercial_registry]);
  const planColumns = useMemo(
    () =>
      orderComparisonPlans(
        compareSourcePlans,
        registry || catalog.data.commercial_registry
      ),
    [compareSourcePlans, registry, catalog.data.commercial_registry]
  );
  const customErpCopy = useMemo(
    () => customErpPricingCopy(fullRegistry),
    [fullRegistry]
  );
  const promo = useMemo(() => launchPromoFromPlans(pricingPlans), [pricingPlans]);
  const guideItems = useMemo(
    () => pricingGuideFromRegistry(registry || null, pricingPlans),
    [registry, pricingPlans]
  );

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
  }

  return (
    <>
      <Section className="!pb-6 !pt-12 md:!pt-16">
        <Container>
          <Breadcrumbs items={[{ label: "Pricing" }]} />
          <SectionHeader
            eyebrow="Pricing"
            as="h1"
            title="Choose the plan that fits how you grow"
            description="Live License Engine catalog (registry v1.2 FINAL): self-serve Starter, Business, and Lifetime with Basic / Full / Advanced module capabilities; independent Custom ERP; Enterprise and White Label via Contact Sales. Industry modules stay outside predefined plans."
          />

          {guideItems.length > 0 ? (
            <div className="mb-8 grid gap-3 rounded-2xl border border-border/80 bg-slate-50/80 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 sm:p-5">
              {guideItems.map((item) => (
                <div key={item.code} className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {item.name}
                  </p>
                  <p className="mt-1 text-sm leading-snug text-muted-foreground line-clamp-3">
                    {item.line ||
                      (item.mode === "manual"
                        ? "Contact sales"
                        : item.mode === "custom"
                          ? "Configure modules and packs"
                          : "Self-serve predefined plan")}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {promo ? (
            <LaunchDiscountBanner
              campaign={promo.campaign}
              badge={promo.badge}
              maxDiscount={promo.maxDiscount}
              maxSavings={promo.maxSavings}
            />
          ) : null}

          <div className="mb-4 flex min-h-9 flex-wrap items-center justify-center gap-3 notranslate" translate="no">
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

          {catalog.loading && displayCardPlans.length === 0 ? <CatalogSkeleton rows={3} /> : null}
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
              Showing last known plans - live catalog refresh failed.{" "}
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
          {displayCardPlans.length > 0 ? (
            <PricingCards
              plans={displayCardPlans}
              yearly={yearly}
              compact
              columns="sm:grid-cols-2 xl:grid-cols-3"
            />
          ) : null}

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="flex flex-col rounded-2xl border border-border bg-white px-6 py-8 shadow-[0_12px_40px_rgba(15,23,42,0.08)] md:px-8">
              <div className="flex-1">
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                  {customErpCopy.title}
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#0b1f3a]">
                  Build Your Own ERP
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {customErpCopy.body}
                </p>
              </div>
              <Button asChild size="lg" className="mt-6 shrink-0 self-start rounded-full">
                <Link href="/build-your-own-erp">Build your own custom ERP</Link>
              </Button>
            </div>

            {enterprise ? (
              <div className="flex flex-col rounded-2xl border border-border bg-white px-6 py-8 shadow-[0_12px_40px_rgba(15,23,42,0.08)] md:px-8">
                <div className="flex-1">
                  <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                    {enterprise.ribbon || enterprise.badge || "Enterprise"}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#0b1f3a]">
                    {enterprise.subtitle || enterprise.name || "Enterprise"}
                  </h3>
                  <p className="mt-2 text-sm font-medium text-[#0b1f3a]">
                    Manual commercial product — Contact Sales (not a self-serve upgrade).
                  </p>
                  {(enterprise.marketingSummary || enterprise.description) ? (
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                      {enterprise.marketingSummary || enterprise.description}
                    </p>
                  ) : null}
                </div>
                <Button asChild size="lg" variant="outline" className="mt-6 self-start rounded-full">
                  <Link href={enterprise.href || "/contact?intent=enterprise"}>
                    {enterprise.cta || "Contact Sales"}
                  </Link>
                </Button>
              </div>
            ) : null}

            {whiteLabel ? (
              <div className="flex flex-col rounded-2xl border border-border bg-white px-6 py-8 shadow-[0_12px_40px_rgba(15,23,42,0.08)] md:px-8">
                <div className="flex-1">
                  <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                    {whiteLabel.ribbon || "White Label"}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#0b1f3a]">
                    {whiteLabel.name || "White Label"}
                  </h3>
                  <p className="mt-2 text-sm font-medium text-[#0b1f3a]">
                    Manual branded deployment — Contact Sales only.
                  </p>
                  {(whiteLabel.marketingSummary || whiteLabel.description) ? (
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                      {whiteLabel.marketingSummary || whiteLabel.description}
                    </p>
                  ) : null}
                </div>
                <Button asChild size="lg" variant="outline" className="mt-6 self-start rounded-full">
                  <Link href={whiteLabel.href || "/contact?intent=white-label"}>
                    {whiteLabel.cta || "Contact Sales"}
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
        </Container>
      </Section>

      <Section muted>
        <Container>
          <SectionHeader
            eyebrow="Deployment options"
            title="How you want to run WaamTech"
            description="Cloud SaaS for quick start - or contact us for own cloud server, whitelabel, and local on-premise deployment."
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

      <Section id="compare">
        <Container>
          <SectionHeader
            eyebrow="Compare plans"
            title="What you get - side by side"
            description={hierarchyNote}
          />
          {catalog.loading && !comparisonAvailable ? (
            <CatalogSkeleton rows={2} className="xl:grid-cols-1" />
          ) : null}
          {!catalog.loading && !comparisonAvailable && planColumns.length > 0 ? (
            <CatalogComparisonUnavailable onRetry={catalog.retry} />
          ) : null}
          {comparisonAvailable ? (
            <PricingComparisonTable
              plans={planColumns}
              rows={comparisonRows}
              hierarchyNote={hierarchyNote}
              loading={false}
            />
          ) : null}
          {!catalog.loading && planColumns.length === 0 ? (
            <CatalogEmptyState message="No Plans Available" />
          ) : null}
        </Container>
      </Section>

      <Section muted>
        <Container>
          <SectionHeader eyebrow="FAQ" title="Frequently asked questions" />
          <FaqAccordionList
            items={faqs}
            className="mx-auto max-w-3xl rounded-2xl border border-border bg-white px-5"
          />
        </Container>
      </Section>

      <TrustBadgesBand />
      <CTASection
        title="Ready to start?"
        description="Pick a self-serve plan from the live catalog, or build Custom ERP independently."
        primaryLabel="Start free trial"
        primaryHref="/signup"
        secondaryLabel="Talk to sales"
        secondaryHref="/contact?intent=pricing"
      />
    </>
  );
}

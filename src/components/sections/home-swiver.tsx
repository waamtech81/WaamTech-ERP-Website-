"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { ArrowRight, Star } from "lucide-react";
import { coreCapabilities } from "@/lib/data/core";
import {
  getIndustryLucideIcon,
  getIndustryMedia,
} from "@/lib/data/business-hierarchy";
import { getIcon } from "@/lib/icons";
import { Container, Section } from "@/components/shared/section";
import { AnimateIn } from "@/components/shared/animate-in";
import { Counter } from "@/components/shared/counter";
import { Price } from "@/components/shared/price";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLocale } from "@/components/providers/locale-provider";
import { testimonials, siteConfig } from "@/lib/data/site";
import { authConfig } from "@/lib/auth/config";
import { PricingCards } from "@/components/sections/pricing-cards";
import {
  useCatalogAllBusinessCategories,
  useCatalogBundle,
} from "@/hooks/use-commercial";
import {
  CatalogEmptyState,
  CatalogErrorState,
  CatalogSkeleton,
} from "@/components/commercial/catalog-states";
import { industryDisplayIcon } from "@/lib/commercial/mappers";
import type { CatalogIndustry } from "@/lib/commercial/types";

export function StatsBand() {
  const catalog = useCatalogBundle();
  const industryCount = catalog.data.industries?.length || 0;
  const stats = [
    { label: "Working since", value: 2010, suffix: "" },
    { label: "Industries", value: industryCount || 0, suffix: "" },
    { label: "Catalog products", value: catalog.data.products?.length || 0, suffix: "" },
    { label: "Public plans", value: catalog.data.pricingPlans?.length || 0, suffix: "" },
  ];

  return (
    <Section muted className="!py-12 md:!py-14 border-y border-border/80">
      <Container>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8 lg:divide-x lg:divide-border">
          {stats.map((stat, i) => (
            <AnimateIn key={stat.label} delay={i * 0.05}>
              <div className={cnStatPad(i)}>
                <p className="font-heading text-[2rem] md:text-[2.35rem] font-semibold tracking-tight text-[#0b1220] tabular-nums leading-none">
                  {catalog.loading && i > 0 ? (
                    <span className="inline-block h-8 w-14 animate-pulse rounded-md bg-border/80" />
                  ) : (
                    <Counter value={stat.value} suffix={stat.suffix} />
                  )}
                </p>
                <p className="mt-3 text-[13px] font-medium text-muted-foreground tracking-wide">
                  {stat.label}
                </p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </Container>
    </Section>
  );
}

function cnStatPad(i: number) {
  return i === 0 ? "text-center lg:pr-6" : "text-center lg:px-6";
}

export function FeaturedProductsSection() {
  const catalog = useCatalogBundle();
  const products = catalog.data.featuredProducts || [];

  return (
    <Section>
      <Container>
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="mb-3 text-sm font-medium text-primary tracking-wide uppercase">
            Featured products
          </p>
          <h2 className="font-heading text-section font-semibold tracking-tight text-[#0b1220]">
            From the License Engine catalog
          </h2>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
            Product listings are loaded live — the Website never owns commercial product data.
          </p>
        </div>
        {catalog.loading ? <CatalogSkeleton rows={3} /> : null}
        {catalog.error ? (
          <CatalogErrorState
            message={catalog.error}
            onRetry={catalog.retry}
            offline={catalog.offline}
          />
        ) : null}
        {!catalog.loading && !catalog.error && products.length === 0 ? (
          <CatalogEmptyState message="No public products are published yet." />
        ) : null}
        {!catalog.loading && products.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product, i) => {
              const Icon = getIcon(product.icon || "Boxes");
              return (
                <AnimateIn key={product.id} delay={i * 0.05}>
                  <Card className="h-full hover:border-primary/20 hover:shadow-[var(--shadow-md)]">
                    <CardHeader>
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {product.tagline}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <Button asChild variant="outline" size="sm" className="rounded-full">
                        <Link href={`/signup?product=${encodeURIComponent(product.slug)}`}>
                          Start with {product.name}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </AnimateIn>
              );
            })}
          </div>
        ) : null}
      </Container>
    </Section>
  );
}

export function CapabilitiesSection() {
  return (
    <Section>
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 items-end mb-12 md:mb-14">
          <div>
            <p className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              Platform
            </p>
            <h2 className="font-heading text-section font-semibold tracking-tight text-[#0b1220] text-balance">
              Built for how real businesses work
            </h2>
          </div>
          <p className="text-muted-foreground text-[1.0625rem] leading-relaxed text-pretty lg:pb-1">
            Choose your industry, unlock the right modules and feature packs, and grow into AI-assisted
            operations — without messy custom rebuilds.
          </p>
        </div>

        <div className="divide-y divide-border border-y border-border">
          {coreCapabilities.map((item, i) => {
            const Icon = getIcon(item.icon);
            return (
              <AnimateIn key={item.title} delay={i * 0.04}>
                <div className="grid gap-4 py-7 md:grid-cols-[3rem_minmax(0,14rem)_1fr] md:items-start md:gap-8">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/[0.08] text-primary ring-1 ring-primary/10">
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <h3 className="font-heading text-[1.0625rem] font-semibold tracking-tight text-[#0b1220]">
                    {item.title}
                  </h3>
                  <p className="text-[0.9375rem] text-muted-foreground leading-relaxed text-pretty md:pt-0.5">
                    {item.description}
                  </p>
                </div>
              </AnimateIn>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

function IndustryHomeCard({ industry, index }: { industry: CatalogIndustry; index: number }) {
  const Icon = getIcon(
    industryDisplayIcon(industry) || getIndustryLucideIcon({ icon: industry.icon || "store" })
  );
  const media = getIndustryMedia(
    industry.code || industry.slug || industry.id
  );

  return (
    <AnimateIn delay={(index % 4) * 0.04}>
      <Link href={`/industries/${industry.slug || industry.id}`} className="group block h-full">
        <Card className="h-full overflow-hidden border-border/80 shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-md)] hover:border-primary/20">
          <div
            className={`relative aspect-[16/10] overflow-hidden ${
              [
                "bg-[#e8f5ef]",
                "bg-[#eaf1fb]",
                "bg-[#f3eef8]",
                "bg-[#fff4e8]",
                "bg-[#eef7fb]",
                "bg-[#f5efe8]",
                "bg-[#eef5f2]",
                "bg-[#f0eef8]",
              ][index % 8]
            }`}
          >
            <Image
              src={media.image}
              alt={media.imageAlt}
              fill
              quality={70}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover mix-blend-multiply opacity-90 transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-[var(--shadow-xs)]">
              <Icon className="h-4 w-4" />
            </div>
            <Badge className="absolute right-3 top-3 bg-white/95 text-[#213242] hover:bg-white text-[10px] border-0 shadow-[var(--shadow-xs)]">
              Featured
            </Badge>
            <p className="absolute bottom-3 left-3 right-3 text-sm font-bold tracking-tight text-[#213242] drop-shadow-sm">
              {industry.name}
            </p>
          </div>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {industry.description || `Explore ${industry.name} business categories.`}
            </p>
          </CardContent>
        </Card>
      </Link>
    </AnimateIn>
  );
}

export function BusinessesSection() {
  const catalog = useCatalogBundle();
  const allCategories = useCatalogAllBusinessCategories();
  const industries = (catalog.data.industries || []).slice(0, 8);
  const industryCount = (catalog.data.industries || []).length;
  const categoryCount = allCategories.data.length;

  return (
    <Section muted>
      <Container>
        <div className="mx-auto mb-10 md:mb-12 max-w-2xl text-center lg:mx-0 lg:text-left">
          <p className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            Industries we serve
          </p>
          <h2 className="font-heading text-section font-semibold tracking-tight text-[#0b1220] text-balance">
            {industryCount} industries · {categoryCount}+ business categories
          </h2>
          <p className="mt-4 text-muted-foreground text-[1.0625rem] leading-relaxed text-pretty">
            Industry → business category → business profile — then start your free trial. Loaded
            live from License Engine for signup and provisioning.
          </p>
        </div>
        {catalog.loading ? <CatalogSkeleton rows={4} /> : null}
        {catalog.error ? (
          <CatalogErrorState
            message={catalog.error}
            onRetry={catalog.retry}
            offline={catalog.offline}
          />
        ) : null}
        {!catalog.loading && !catalog.error && industries.length === 0 ? (
          <CatalogEmptyState message="No industries are published yet." />
        ) : null}
        {!catalog.loading && industries.length > 0 ? (
          <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {industries.map((industry, i) => (
              <IndustryHomeCard key={industry.id} industry={industry} index={i} />
            ))}
          </div>
        ) : null}
        <div className="mt-8 md:mt-10 text-center">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/industries">
              Explore all industries
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

export function SocialProofSection() {
  const [featured, ...rest] = testimonials;

  return (
    <Section className="bg-[var(--surface-subtle)]">
      <Container>
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            Customer voices
          </p>
          <h2 className="font-heading text-section font-semibold tracking-tight text-[#0b1220]">
            Operators trust {siteConfig.name} for clarity
          </h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-10">
          {featured ? (
            <AnimateIn className="h-full">
              <div className="flex h-full flex-col rounded-2xl border border-border bg-white p-8 md:p-10 shadow-[var(--shadow-xs)]">
                <div
                  className="mb-5 flex items-center gap-0.5"
                  role="img"
                  aria-label={`${featured.rating} out of 5 stars`}
                >
                  {Array.from({ length: 5 }).map((_, starIndex) => {
                    const filled = featured.rating >= starIndex + 1;
                    const half = !filled && featured.rating >= starIndex + 0.5;
                    return (
                      <Star
                        key={starIndex}
                        className={`h-4 w-4 ${
                          filled
                            ? "fill-amber-400 text-amber-400"
                            : half
                              ? "fill-amber-400/45 text-amber-400"
                              : "fill-transparent text-muted-foreground/35"
                        }`}
                      />
                    );
                  })}
                </div>
                <p className="font-heading text-xl md:text-2xl font-medium tracking-tight text-[#0b1220] leading-snug text-pretty">
                  {`\u201C${featured.quote}\u201D`}
                </p>
                <div className="mt-auto flex items-center gap-3 border-t border-border pt-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {featured.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                  <div>
                    <p className="font-semibold text-sm text-[#0b1220]">{featured.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {featured.role}, {featured.company}
                    </p>
                  </div>
                </div>
              </div>
            </AnimateIn>
          ) : null}

          <div className="flex flex-col gap-4">
            {rest.map((t, i) => (
              <AnimateIn key={t.id} delay={i * 0.06} className="h-full">
                <div className="rounded-xl border border-border bg-white p-5 shadow-[var(--shadow-xs)] h-full">
                  <p className="text-[0.9375rem] leading-relaxed text-[#0b1220] text-pretty">
                    {`\u201C${t.quote}\u201D`}
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                      {t.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                    <div>
                      <p className="font-semibold text-xs text-[#0b1220]">{t.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {t.role}, {t.company}
                      </p>
                    </div>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

export function PricingTeaser() {
  const [yearly, setYearly] = useState(true);
  const [, startTransition] = useTransition();
  const { t, formatPrice } = useLocale();
  const catalog = useCatalogBundle();
  const plans = catalog.data.popularPlans?.length
    ? catalog.data.popularPlans
    : (catalog.data.cardPlans || []).slice(0, 3);
  const enterprise = catalog.data.enterprise;
  const prices = plans
    .map((p) => (yearly ? p.yearlyPrice : p.monthlyPrice) ?? p.yearlyPrice ?? p.monthlyPrice)
    .filter((v): v is number => typeof v === "number" && v > 0);
  const fromUsd = prices.length ? Math.min(...prices) : null;
  const yearlySavingsHint = useMemo(() => {
    const withSavings = plans
      .map((p) => p.yearlySavingsAmount)
      .filter((n): n is number => n != null && n > 0);
    if (!withSavings.length) return null;
    return Math.max(...withSavings);
  }, [plans]);

  function onBillingChange(nextYearly: boolean) {
    startTransition(() => {
      setYearly(nextYearly);
    });
  }

  return (
    <Section muted>
      <Container>
        <div className="mb-10 md:mb-12 max-w-2xl">
          <Badge variant="accent" className="mb-3">
            Popular plans
          </Badge>
          <h2 className="font-heading text-section font-semibold tracking-tight text-[#0b1220]">
            {fromUsd != null ? (
              <>
                Affordable ERP from <Price usd={fromUsd} />/mo
              </>
            ) : (
              "Plans & pricing from License Engine"
            )}
          </h2>
          <p className="mt-3 font-sans text-sm font-semibold tracking-tight text-primary">
            No card required · Start your {authConfig.trialDays}-day free trial
          </p>
          <p className="mt-3 text-muted-foreground leading-relaxed text-pretty">
            Sign up directly — no payment upfront. Pricing and billing cycles load live. Enterprise is
            always Contact Sales.
          </p>
        </div>
        {catalog.loading ? <CatalogSkeleton rows={3} /> : null}
        {catalog.error ? (
          <CatalogErrorState
            message={catalog.error}
            onRetry={catalog.retry}
            offline={catalog.offline}
          />
        ) : null}
        {!catalog.loading && !catalog.error && plans.length === 0 ? (
          <CatalogEmptyState message="No public plans are available yet." />
        ) : null}
        {!catalog.loading && plans.length > 0 ? (
          <>
            <div className="mb-4 flex min-h-9 flex-wrap items-center justify-start gap-3 notranslate" translate="no">
              <Label
                htmlFor="home-billing"
                className={!yearly ? "text-foreground" : "text-muted-foreground"}
              >
                {t("pricing.monthly", "Monthly")}
              </Label>
              <Switch id="home-billing" checked={yearly} onCheckedChange={onBillingChange} />
              <Label
                htmlFor="home-billing"
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
            <PricingCards plans={plans} yearly={yearly} compact columns="sm:grid-cols-2 xl:grid-cols-3" />
          </>
        ) : null}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-primary/25 bg-[var(--brand-dark)] px-6 py-6 text-white flex flex-col">
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-200/90">
                Build your own custom ERP
              </p>
              <p className="mt-2 font-semibold tracking-tight text-[1.0625rem]">
                Assemble modules instead of a fixed plan
              </p>
              <p className="mt-2 text-sm text-white/75 leading-relaxed">
                Pick CRM, Inventory, POS, and more — live prices, auto dependencies.
              </p>
            </div>
            <Button
              asChild
              className="mt-5 self-start rounded-full bg-white text-[#0b1220] hover:bg-slate-100"
            >
              <Link href="/build-your-own-erp">Build your own custom ERP</Link>
            </Button>
          </div>
          {enterprise ? (
            <div className="rounded-xl border border-border bg-[#0b1220] px-6 py-6 text-white flex flex-col">
              <div className="flex-1">
                <p className="text-sm font-semibold uppercase tracking-wide text-sky-200/90">
                  {enterprise.ribbon || enterprise.badge || "Enterprise"}
                </p>
                <p className="mt-1.5 font-semibold tracking-tight">
                  {enterprise.name || "Enterprise"}
                  {enterprise.subtitle ? ` — ${enterprise.subtitle}` : ""}
                </p>
                {(enterprise.marketingSummary || enterprise.description) ? (
                  <p className="mt-1 text-sm text-white/70">
                    {enterprise.marketingSummary || enterprise.description}
                  </p>
                ) : null}
              </div>
              <Button
                asChild
                className="mt-4 self-start rounded-full bg-white text-[#0b1220] hover:bg-slate-100"
              >
                <Link href={enterprise.href || "/contact?intent=enterprise"}>
                  {enterprise.cta || "Contact Sales"}
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
        <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild variant="link">
            <Link href="/pricing#compare">Compare all plans →</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full" size="sm">
            <Link href="/servers">Servers & deployment</Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

export function SoftCTA() {
  return (
    <Section className="!pb-20">
      <Container>
        <AnimateIn>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#071526] px-8 py-14 md:px-16 md:py-20 text-center text-white shadow-[var(--shadow-lg)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(5,73,164,0.35),transparent_65%)]" />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="font-heading text-cta font-semibold tracking-tight text-balance">
                Ready to run your business on {siteConfig.name}?
              </h2>
              <p className="mt-5 font-sans text-[0.9375rem] sm:text-base text-white/70 leading-relaxed">
                <span className="font-medium text-white">No card. No payment.</span>{" "}
                {authConfig.trialDays}-day free trial signup — start instantly
              </p>
              <p className="mt-3 text-white/50 text-sm max-w-md mx-auto leading-relaxed">
                Pick product, plan, industry, and profile in minutes.
              </p>
              <div className="mt-9 flex flex-col sm:flex-row justify-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-white text-[#0b1220] hover:bg-slate-100"
                >
                  <Link href="/signup">
                    Start {authConfig.trialDays}-day free trial
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/contact">Talk to sales</Link>
                </Button>
              </div>
            </div>
          </div>
        </AnimateIn>
      </Container>
    </Section>
  );
}

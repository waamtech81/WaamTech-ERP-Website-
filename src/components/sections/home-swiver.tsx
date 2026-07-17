"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { coreCapabilities } from "@/lib/data/core";
import { getIndustryLucideIcon, getIndustryMedia } from "@/lib/data/business-hierarchy";
import { getIcon } from "@/lib/icons";
import { Container, Section } from "@/components/shared/section";
import { AnimateIn } from "@/components/shared/animate-in";
import { Counter } from "@/components/shared/counter";
import { Price } from "@/components/shared/price";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { testimonials, siteConfig } from "@/lib/data/site";
import { PricingCards } from "@/components/sections/pricing-cards";
import { useCatalogBundle } from "@/hooks/use-commercial";
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
    { label: "Working since", value: 2012, suffix: "" },
    { label: "Industries", value: industryCount || 0, suffix: "" },
    { label: "Catalog products", value: catalog.data.products?.length || 0, suffix: "" },
    { label: "Public plans", value: catalog.data.pricingPlans?.length || 0, suffix: "" },
  ];

  return (
    <Section muted className="!py-14 md:!py-16">
      <Container>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <AnimateIn key={stat.label} delay={i * 0.05}>
              <div className="text-center">
                <p className="font-[family-name:var(--font-poppins)] text-3xl md:text-4xl font-semibold tracking-tight text-[#0b1f3a]">
                  {catalog.loading && i > 0 ? (
                    <span className="inline-block h-9 w-16 animate-pulse rounded bg-slate-200" />
                  ) : (
                    <Counter value={stat.value} suffix={stat.suffix} />
                  )}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </Container>
    </Section>
  );
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
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#0b1f3a]">
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
                  <Card className="h-full hover:-translate-y-1 hover:shadow-md transition-all">
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
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-3 text-sm font-medium text-primary tracking-wide uppercase">Platform</p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#0b1f3a] text-balance">
            Built for how real businesses work
          </h2>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
            Choose your industry, unlock the right modules and feature packs, and grow into AI-assisted
            operations — without messy custom rebuilds.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {coreCapabilities.map((item, i) => {
            const Icon = getIcon(item.icon);
            return (
              <AnimateIn key={item.title} delay={i * 0.06}>
                <Card className="h-full group hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)] hover:border-primary/20">
                  <CardHeader>
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 text-primary transition-transform duration-300 group-hover:scale-110">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
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
  const media = getIndustryMedia(industry.slug || industry.id);

  return (
    <AnimateIn delay={(index % 4) * 0.04}>
      <Link href={`/industries/${industry.slug || industry.id}`} className="group block h-full">
        <Card className="h-full overflow-hidden hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)] hover:border-primary/20 transition-all duration-500">
          <div className="relative aspect-[16/10] overflow-hidden">
            <Image
              src={media.image}
              alt={media.imageAlt}
              fill
              quality={70}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1f3a]/70 to-transparent" />
            <div className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/90 text-white">
              <Icon className="h-4 w-4" />
            </div>
            <Badge className="absolute right-3 top-3 bg-white/90 text-[#0b1f3a] hover:bg-white text-[10px]">
              Featured
            </Badge>
            <p className="absolute bottom-3 left-3 right-3 text-sm font-semibold text-white">
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
  const industries = (catalog.data.industries || []).slice(0, 8);

  return (
    <Section muted>
      <Container>
        <div className="mx-auto mb-10 md:mb-12 max-w-3xl text-center">
          <p className="mb-3 text-sm font-medium text-primary tracking-wide uppercase">
            Industries we serve
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#0b1f3a] text-balance">
            Live industries from License Engine
          </h2>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
            Industry → business category → business profile — loaded dynamically for signup and
            provisioning.
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
  return (
    <Section>
      <Container>
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#0b1f3a]">
            Operators trust {siteConfig.name} for clarity
          </h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <AnimateIn key={t.id} delay={i * 0.08}>
              <Card className="h-full border-border/80 shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-base leading-relaxed text-[#0b1f3a]">
                    {`\u201C${t.quote}\u201D`}
                  </p>
                  <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {t.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.role}, {t.company}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimateIn>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export function PricingTeaser() {
  const catalog = useCatalogBundle();
  const plans = catalog.data.popularPlans?.length
    ? catalog.data.popularPlans
    : (catalog.data.cardPlans || []).slice(0, 3);
  const enterprise = catalog.data.enterprise;
  const prices = plans
    .map((p) => p.yearlyPrice ?? p.monthlyPrice)
    .filter((v): v is number => typeof v === "number" && v > 0);
  const fromUsd = prices.length ? Math.min(...prices) : null;

  return (
    <Section muted>
      <Container>
        <div className="mx-auto mb-8 md:mb-10 max-w-3xl text-center">
          <Badge variant="accent" className="mb-3">
            Popular plans
          </Badge>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#0b1f3a]">
            {fromUsd != null ? (
              <>
                Affordable ERP from <Price usd={fromUsd} />/mo
              </>
            ) : (
              "Plans & pricing from License Engine"
            )}
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Pricing, trials, and billing cycles load live. Enterprise is always Contact Sales — never
            a fixed price.
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
          <PricingCards plans={plans} yearly={true} compact columns="sm:grid-cols-2 xl:grid-cols-3" />
        ) : null}
        {enterprise ? (
          <div className="mt-8 rounded-2xl border border-border bg-white px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-[#0b1f3a]">Enterprise — Custom Pricing</p>
              <p className="text-sm text-muted-foreground mt-1">
                Contact Sales or Request a Quote. No fixed Enterprise amount is published.
              </p>
            </div>
            <Button asChild className="rounded-full shrink-0">
              <Link href={enterprise.href || "/contact?intent=enterprise"}>Contact Sales</Link>
            </Button>
          </div>
        ) : null}
        <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild variant="link">
            <Link href="/pricing">Compare all plans →</Link>
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
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-[#0b1f3a] px-8 py-14 md:px-16 md:py-16 text-center text-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_70%_20%,rgba(37,99,235,0.35),transparent_60%)]" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-balance">
                Ready to run your business on {siteConfig.name}?
              </h2>
              <p className="mt-4 text-white/70 text-lg max-w-xl mx-auto">
                Start free, pick product, plan, industry, category, and profile — all from License
                Engine.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-white text-[#0b1f3a] hover:bg-slate-100"
                >
                  <Link href="/signup">
                    Start free trial
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
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

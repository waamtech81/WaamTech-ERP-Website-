"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { coreCapabilities, homeStats } from "@/lib/data/core";
import {
  getCategoriesForIndustry,
  getFeaturedIndustries,
  getIndustryLucideIcon,
  getIndustryMedia,
  hierarchyStats,
} from "@/lib/data/business-hierarchy";
import { getIcon } from "@/lib/icons";
import { Container, Section } from "@/components/shared/section";
import { AnimateIn } from "@/components/shared/animate-in";
import { Counter } from "@/components/shared/counter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { testimonials, pricingPlans, siteConfig } from "@/lib/data/site";
import { PricingCards } from "@/components/sections/pricing-cards";
import { useLocale } from "@/components/providers/locale-provider";

export function StatsBand() {
  return (
    <Section muted className="!py-14 md:!py-16">
      <Container>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {homeStats.map((stat, i) => (
            <AnimateIn key={stat.label} delay={i * 0.05}>
              <div className="text-center">
                <p className="font-[family-name:var(--font-poppins)] text-3xl md:text-4xl font-semibold tracking-tight text-[#0b1f3a]">
                  <Counter value={stat.value} suffix={stat.suffix} />
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

export function CapabilitiesSection() {
  return (
    <Section>
      <Container>
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-3 text-sm font-medium text-primary tracking-wide uppercase">Platform</p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#0b1f3a] text-balance">
            Built from a clean SaaS Core
          </h2>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
            Business profiles, feature packs, and installable modules — the architecture that makes
            {siteConfig.name} adaptable without becoming messy.
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

export function BusinessesSection() {
  const featured = getFeaturedIndustries().featured;

  return (
    <Section muted>
      <Container>
        <div className="mx-auto mb-10 md:mb-12 max-w-3xl text-center">
          <p className="mb-3 text-sm font-medium text-primary tracking-wide uppercase">
            Industries we serve
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#0b1f3a] text-balance">
            {hierarchyStats.industries} industries · {hierarchyStats.categories}+ business categories
          </h2>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
            Click an industry to explore its business categories — the same hierarchy used in SaaS
            Core signup and provisioning.
          </p>
        </div>
        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((biz, i) => {
            const Icon = getIcon(getIndustryLucideIcon(biz));
            const media = getIndustryMedia(biz.id);
            const count = getCategoriesForIndustry(biz.id).length;
            return (
              <AnimateIn key={biz.id} delay={(i % 4) * 0.04}>
                <Link href={`/industries/${biz.id}`} className="group block h-full">
                  <Card className="h-full overflow-hidden hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)] hover:border-primary/20 transition-all duration-500">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={media.image}
                        alt={media.imageAlt}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0b1f3a]/70 to-transparent" />
                      <div
                        className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl text-white"
                        style={{ backgroundColor: `${biz.color}dd` }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <Badge className="absolute right-3 top-3 bg-white/90 text-[#0b1f3a] hover:bg-white text-[10px]">
                        Featured
                      </Badge>
                      <p className="absolute bottom-3 left-3 right-3 text-sm font-semibold text-white">
                        {biz.name}
                      </p>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-xs font-medium text-primary mb-1">{count} categories</p>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {biz.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </AnimateIn>
            );
          })}
        </div>
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
  const { formatPrice } = useLocale();
  const plans = pricingPlans.filter((p) => p.id !== "enterprise").slice(0, 4);
  const fromUsd = Math.min(
    ...pricingPlans
      .map((p) => p.yearlyPrice ?? p.monthlyPrice)
      .filter((v): v is number => typeof v === "number" && v > 0)
  );

  return (
    <Section muted>
      <Container>
        <div className="mx-auto mb-8 md:mb-10 max-w-3xl text-center">
          <Badge variant="accent" className="mb-3">50% Launch Discount</Badge>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#0b1f3a]">
            Affordable ERP from <span translate="no">{formatPrice(fromUsd)}</span>/mo
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Market-aligned pricing with lifetime license & deployment options. Start your 14-day free trial.
          </p>
        </div>
        <PricingCards
          plans={plans}
          yearly={true}
          compact
          columns="sm:grid-cols-2 xl:grid-cols-4"
        />
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
                Start free, pick your industry and business category, and activate only the modules you need.
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

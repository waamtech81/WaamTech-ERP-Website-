import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Smartphone } from "lucide-react";
import {
  getIndustryMobileApp,
  mobileAppLevelCopy,
  mobileAppPage,
  mobileAppRecommendedIds,
  mobileAppRequiredIds,
} from "@/lib/data/mobile-app";
import { industriesServing } from "@/lib/data/industries";
import { getIcon } from "@/lib/icons";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AnimateIn } from "@/components/shared/animate-in";
import { CTASection } from "@/components/shared/cta-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Mobile App & Responsive Web Access",
  description:
    "Use WaamTech on desktop, tablet, and phone — full responsive web app anytime. Native mobile app included for field businesses based on your business profile.",
};

export default function MobileAppPage() {
  const requiredProfiles = industriesServing.filter((i) =>
    mobileAppRequiredIds.includes(i.id)
  );
  const recommendedProfiles = industriesServing.filter((i) =>
    mobileAppRecommendedIds.includes(i.id)
  );

  return (
    <>
      <Section className="!pb-0 !pt-12 md:!pt-16 overflow-hidden">
        <Container>
          <Breadcrumbs items={[{ label: "Mobile App" }]} />
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center pb-16">
            <AnimateIn>
              <Badge variant="accent" className="mb-4">
                <Smartphone className="h-3 w-3 mr-1" />
                {mobileAppPage.hero.eyebrow}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#0b1f3a] text-balance">
                {mobileAppPage.hero.title}
              </h1>
              <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-xl">
                {mobileAppPage.hero.description}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full">
                  <Link href="/signup">
                    Start free trial
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full">
                  <Link href="/pricing">See plans & mobile access</Link>
                </Button>
              </div>
            </AnimateIn>
            <AnimateIn delay={0.1}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-border shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
                <Image
                  src={mobileAppPage.hero.image}
                  alt={mobileAppPage.hero.imageAlt}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b1f3a]/55 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 flex flex-wrap gap-2">
                  <Badge className="bg-white/95 text-[#0b1f3a] hover:bg-white">Desktop</Badge>
                  <Badge className="bg-white/95 text-[#0b1f3a] hover:bg-white">Tablet</Badge>
                  <Badge className="bg-white/95 text-[#0b1f3a] hover:bg-white">Mobile web</Badge>
                  <Badge className="bg-primary text-white hover:bg-primary">Native app</Badge>
                </div>
              </div>
            </AnimateIn>
          </div>
        </Container>
      </Section>

      <Section muted className="!py-12">
        <Container>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {mobileAppPage.devices.map((d, i) => {
              const Icon = getIcon(d.icon);
              return (
                <AnimateIn key={d.title} delay={i * 0.05}>
                  <Card className="h-full text-center">
                    <CardHeader>
                      <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg">{d.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">{d.text}</p>
                    </CardContent>
                  </Card>
                </AnimateIn>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeader
            eyebrow="Two ways to work"
            title="Responsive web for everyone. Native app where the field needs it."
            description="These are different products working on the same data — pick what your team actually uses day to day."
          />
          <div className="grid gap-8 lg:grid-cols-2">
            {mobileAppPage.dual.map((block, i) => (
              <AnimateIn key={block.id} delay={i * 0.08}>
                <Card className="h-full overflow-hidden">
                  <div className="relative aspect-[16/10]">
                    <Image
                      src={block.image}
                      alt={block.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                  <CardHeader>
                    <Badge variant={block.id === "native" ? "accent" : "default"} className="w-fit">
                      {block.subtitle}
                    </Badge>
                    <CardTitle className="text-2xl">{block.title}</CardTitle>
                    <p className="text-sm text-muted-foreground leading-relaxed">{block.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2.5">
                      {block.points.map((p) => (
                        <li key={p} className="flex gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </AnimateIn>
            ))}
          </div>
        </Container>
      </Section>

      <Section muted>
        <Container>
          <SectionHeader
            eyebrow="By business profile"
            title="Mobile app depends on how you work"
            description="When you select a business type at signup, we show whether the native mobile app is required, recommended, or available — so there are no surprises."
          />

          <div className="mb-10 rounded-2xl border border-rose-200 bg-rose-50/60 p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge className="bg-rose-600 text-white hover:bg-rose-600">
                {mobileAppLevelCopy.required.title}
              </Badge>
              <p className="text-sm text-rose-900/80">{mobileAppLevelCopy.required.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {requiredProfiles.map((ind) => {
                const info = getIndustryMobileApp(ind.id);
                return (
                  <Link
                    key={ind.id}
                    href={`/industries/${ind.id}`}
                    className="rounded-xl border border-rose-100 bg-white px-4 py-3 hover:border-rose-300 transition-colors"
                  >
                    <p className="font-medium text-[#0b1f3a]">{ind.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{info.note}</p>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge className="bg-amber-600 text-white hover:bg-amber-600">
                {mobileAppLevelCopy.recommended.title}
              </Badge>
              <p className="text-sm text-amber-950/80">{mobileAppLevelCopy.recommended.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recommendedProfiles.map((ind) => (
                <Link
                  key={ind.id}
                  href={`/industries/${ind.id}`}
                  className="rounded-xl border border-amber-100 bg-white px-4 py-3 hover:border-amber-300 transition-colors"
                >
                  <p className="font-medium text-[#0b1f3a]">{ind.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {getIndustryMobileApp(ind.id).note}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            All other profiles get full <strong>responsive web</strong> on every device. Native app can still be enabled when you need field access.{" "}
            <Link href="/industries" className="text-primary hover:underline">
              Browse all industries →
            </Link>
          </p>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeader
            eyebrow="Pricing"
            title={mobileAppPage.pricingNote.title}
            description="Mobile access is part of how you subscribe — not a surprise add-on after go-live."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {mobileAppPage.pricingNote.items.map((item, i) => (
              <AnimateIn key={item.plan} delay={i * 0.05}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">{item.plan}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                  </CardContent>
                </Card>
              </AnimateIn>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild className="rounded-full">
              <Link href="/pricing">Compare pricing plans</Link>
            </Button>
          </div>
        </Container>
      </Section>

      <CTASection
        title="Pick your business — we’ll show mobile access"
        description="At signup, select your industry profile. If the native mobile app is required or recommended, you’ll see it instantly — and get it with your workspace."
        primaryLabel="Create account"
        primaryHref="/signup"
        secondaryLabel="Talk to sales"
        secondaryHref="/contact?intent=mobile-app"
      />
    </>
  );
}

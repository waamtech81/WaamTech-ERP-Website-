import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Smartphone } from "lucide-react";
import {
  buildMobilePlanPricingCards,
  groupMobileProfileCards,
  mobileAppLevelCopy,
  mobileAppPage,
  mobileProfileSectionMeta,
  type MobileProfileSectionKey,
} from "@/lib/data/mobile-app";
import { industriesServing } from "@/lib/data/industries";
import { getIcon } from "@/lib/icons";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AnimateIn } from "@/components/shared/animate-in";
import { CTASection } from "@/components/shared/cta-section";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  fetchPublicBusinessCategories,
  fetchPublicPlans,
} from "@/lib/commercial/client";
import { buildAbsoluteSiteUrl } from "@/lib/urls";
import { siteConfig } from "@/lib/data/site";

const SECTION_ORDER: MobileProfileSectionKey[] = [
  "required",
  "recommended",
  "optional",
  "not_required",
];

function ProfileCardRow({
  sectionKey,
  items,
}: {
  sectionKey: MobileProfileSectionKey;
  items: Array<{ id: string; name: string; info: { badge: string; note: string; level: string } }>;
}) {
  if (!items.length) return null;
  const meta = mobileProfileSectionMeta[sectionKey];
  const copy = mobileAppLevelCopy[
    sectionKey === "not_required"
      ? "not_included"
      : sectionKey === "optional"
        ? "optional"
        : sectionKey
  ];

  return (
    <div className={`rounded-2xl border p-4 md:p-6 ${meta.panelClass}`}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge className={meta.badgeClass}>{meta.title}</Badge>
        <p className="text-sm text-muted-foreground max-w-3xl">{copy.description}</p>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-thin">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/industries/${item.id}`}
            className="min-w-[11.5rem] max-w-[14rem] shrink-0 snap-start rounded-xl border border-white/80 bg-white px-3 py-3 shadow-sm transition-colors hover:border-primary/30"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">
              {item.info.badge}
            </p>
            <p className="mt-1 font-medium text-[#0b1f3a] text-sm leading-snug">{item.name}</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground line-clamp-3">
              {item.info.note}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default async function MobileAppPage() {
  const [categoriesRes, plansRes] = await Promise.all([
    fetchPublicBusinessCategories(),
    fetchPublicPlans("waamto-erp"),
  ]);

  const catalogCategories = (categoriesRes.data || []).filter(
    (c) => c.is_public !== false && String(c.status || "active") === "active"
  );

  const profileSource =
    catalogCategories.length > 0
      ? catalogCategories.map((c) => ({
          id: c.slug || c.code,
          name: c.name,
          code: c.code,
          mobileRequirement: c.mobile_requirement ?? c.mobile_mode ?? null,
        }))
      : industriesServing.map((p) => ({
          id: p.id,
          name: p.name,
          code: p.id,
          mobileRequirement: null as string | null,
        }));

  const groupedProfiles = groupMobileProfileCards(profileSource);
  const pricingCards = buildMobilePlanPricingCards(plansRes.data || []);

  const pageUrl = buildAbsoluteSiteUrl("/mobile-app");
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "WAAMTO Mobile ERP App — Android & Responsive Web",
        description:
          "Native Android ERP app and responsive web access for WAAMTO. Mobile requirements vary by business profile.",
        url: pageUrl,
        isPartOf: { "@type": "WebSite", name: siteConfig.name, url: buildAbsoluteSiteUrl("/") },
      },
      {
        "@type": "SoftwareApplication",
        name: "WAAMTO ERP Mobile",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Android, Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: "Included with WAAMTO ERP plans based on business profile",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: mobileAppPage.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />

      <Section className="!pb-0 !pt-12 md:!pt-16 overflow-hidden">
        <Container>
          <Breadcrumbs items={[{ label: "Mobile App" }]} />
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center pb-16">
            <AnimateIn>
              <Badge variant="accent" className="mb-4">
                <Smartphone className="h-3 w-3 mr-1" aria-hidden />
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
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full">
                  <Link href="/pricing">See plans &amp; mobile access</Link>
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
                  quality={70}
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
                        <Icon className="h-5 w-5" aria-hidden />
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
            description="Same live ERP data — choose browser access, native Android, or both depending on how your team works."
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
                      quality={70}
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
                          <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" aria-hidden />
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
            title="Mobile app requirement by industry"
            description={
              catalogCategories.length > 0
                ? "Live from WaamTech commercial catalog — each business category shows whether the native mobile app is required, recommended, optional, or not required."
                : "When you select a business type at signup, we show whether the native mobile app is required, recommended, or optional."
            }
          />

          <div className="space-y-6">
            {SECTION_ORDER.map((key) => (
              <ProfileCardRow key={key} sectionKey={key} items={groupedProfiles[key]} />
            ))}
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Every profile includes full <strong>responsive web</strong> on desktop, tablet, and phone.{" "}
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
            title="Mobile access on every WAAMTO plan"
            description="Responsive web is always included. Native Android app follows your business profile — not a hidden add-on."
          />
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-4">
            {pricingCards.map((item, i) => (
              <AnimateIn key={item.plan} delay={i * 0.04}>
                <Card className="h-full min-w-[13rem] shrink-0 snap-start md:min-w-0">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{item.plan}</CardTitle>
                      {item.badge ? (
                        <Badge variant="muted" className="shrink-0 text-[10px]">
                          {item.badge}
                        </Badge>
                      ) : null}
                    </div>
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
              <Link href="/pricing">Compare live pricing plans</Link>
            </Button>
          </div>
        </Container>
      </Section>

      <Section muted>
        <Container className="max-w-3xl">
          <SectionHeader
            eyebrow="FAQ"
            title="Mobile ERP app questions"
            description="Quick answers about WAAMTO responsive web and native Android access."
          />
          <div className="space-y-3">
            {mobileAppPage.faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl border border-border bg-card px-4 py-3 open:shadow-sm"
              >
                <summary className="cursor-pointer list-none font-medium text-[#0b1f3a] marker:content-none [&::-webkit-details-marker]:hidden">
                  {faq.q}
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </details>
            ))}
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

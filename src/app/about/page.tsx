import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { AnimateIn } from "@/components/shared/animate-in";
import { CTASection } from "@/components/shared/cta-section";
import { JourneyTimeline } from "@/components/about/journey-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/lib/data/site";
import { TrustBadgeGrid } from "@/components/trust-badges";

export const metadata: Metadata = {
  title: `About ${siteConfig.name} — Cloud ERP by WaamTech`,
  description:
    "Since 2010, WaamTech has built software and ERP for growing businesses. Meet WAAMTO — modular cloud ERP, Custom ERP builder, License Engine billing, and secure customer portal.",
  keywords: [
    "about WAAMTO",
    "WaamTech ERP",
    "cloud ERP company",
    "modular ERP platform",
  ],
  alternates: { canonical: "/about" },
};

const timeline = [
  {
    year: "2010",
    title: "WaamTech journey begins",
    text: "Started building web, software, and digital solutions for businesses — helping clients grow their online presence and operations.",
  },
  {
    year: "2015",
    title: "SaaS & enterprise apps",
    text: "Expanded into custom application development and SaaS products for mid to large organizations across the globe.",
  },
  {
    year: "2018",
    title: "ERP platform vision",
    text: "Began unified ERP development — inventory, finance, sales, and operations in one modular platform.",
  },
  {
    year: "2022",
    title: "Modular ERP platform",
    text: "Launched a modular ERP with industry profiles, installable modules, and optional feature packs.",
  },
  {
    year: "2024",
    title: "Connected ecosystem",
    text: "Added integrations, WaamHost cloud hosting, and deeper multi-branch / multi-warehouse operations.",
  },
  {
    year: "2026",
    title: "WAAMTO cloud ecosystem",
    text: "Predefined plans, Build Your Own Custom ERP, License Engine commercial SSOT, customer portal, Documentation Portal, and secure production cloud — ERP that scales with you.",
  },
];

const stats = [
  { value: "2010", label: "Working since" },
  { value: "17", label: "Industries" },
  { value: "100+", label: "Business categories" },
  { value: "24/7", label: "Support available" },
];

const leaders = [
  { name: "WaamTech Leadership", role: "Founding Team", bio: "Experienced technology leaders focused on enterprise clarity, modular design, and customer success since 2010." },
  { name: "Product & Engineering", role: "Core Team", bio: "Building secure, scalable ERP platforms that teams actually love using every day." },
  { name: "Customer Success", role: "Support Team", bio: "24×7 availability to answer queries, onboard clients, and maintain high satisfaction levels." },
];

export default function AboutPage() {
  return (
    <>
      <Section className="!pb-0 !pt-12 md:!pt-16 overflow-hidden">
        <Container>
          <div className="grid gap-10 pb-16 lg:grid-cols-2 lg:items-center">
            <AnimateIn>
              <Badge className="mb-4 border-primary/20 bg-primary/10 text-primary hover:bg-primary/10">
                Since 2010
              </Badge>
              <h1 className="text-balance text-4xl font-semibold tracking-tight text-[#0b1f3a] md:text-5xl">
                {siteConfig.fullName} — built by WaamTech
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Since <strong>2010</strong> we have delivered software, ERP, and cloud infrastructure
                worldwide. Today WAAMTO is our next-generation ERP cloud: modular apps, Custom ERP
                builder, secure licensing, and a customer portal for billing and entitlements.
              </p>
              <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
                Run on managed cloud,{" "}
                <Link href="/servers" className="text-primary hover:underline">
                  WaamHost
                </Link>
                , your own cloud, or local server — with docs at{" "}
                <a
                  href="https://doc.waamto.com"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  doc.waamto.com
                </a>
                .
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild className="rounded-full">
                  <Link href="/signup">Start free trial</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <a href="https://waamtech.com/about-us/" target="_blank" rel="noopener noreferrer">
                    Visit waamtech.com
                  </a>
                </Button>
              </div>
            </AnimateIn>
            <AnimateIn delay={0.1}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-border shadow-[0_24px_80px_rgba(15,23,42,0.1)]">
                <Image
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fm=webp&fit=crop&w=1400&q=70"
                  alt="WaamTech team collaboration"
                  fill
                  className="object-cover"
                  priority
                  quality={70}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </AnimateIn>
          </div>
        </Container>
      </Section>

      <Section muted className="!py-12">
        <Container>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <AnimateIn key={stat.label} delay={i * 0.05}>
                <div className="text-center">
                  <p className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-primary">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="!pt-10">
        <Container>
          <div className="grid gap-6 md:grid-cols-2">
            <AnimateIn>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Mission</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    Make enterprise operations software feel clear, trustworthy, and affordable — so teams across Pakistan and worldwide can focus on growth instead of fighting tools.
                  </p>
                </CardContent>
              </Card>
            </AnimateIn>
            <AnimateIn delay={0.08}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Vision</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    Become the operating system for ambitious businesses — predefined plans, Custom
                    ERP, lifetime licenses, white-label, and on-premise when you need full control.
                  </p>
                </CardContent>
              </Card>
            </AnimateIn>
          </div>
        </Container>
      </Section>

      <Section muted>
        <Container>
          <SectionHeader
            eyebrow="Our journey"
            title="Building since 2010"
            description="Scroll through the milestones that shaped WAAMTO — from early software projects to today’s modular cloud ERP ecosystem."
          />
          <JourneyTimeline items={timeline} />
        </Container>
      </Section>

      <Section id="leadership">
        <Container>
          <SectionHeader eyebrow="Our team" title="People behind the platform" />
          <div className="grid gap-6 md:grid-cols-3">
            {leaders.map((person, i) => (
              <AnimateIn key={person.name} delay={i * 0.06}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary font-semibold text-lg">
                      WT
                    </div>
                    <CardTitle className="text-lg">{person.name}</CardTitle>
                    <p className="text-sm text-primary font-medium">{person.role}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{person.bio}</p>
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
            eyebrow="Technology"
            title="Built for performance, security, and scale"
            description="Modern cloud architecture, role-based access, auditability, and APIs — plus own-server and local deployment when you need full control."
          />
          <TrustBadgeGrid set="about" tone="light" size="sm" columns="full" className="max-w-5xl mx-auto" />
        </Container>
      </Section>

      <CTASection />
    </>
  );
}

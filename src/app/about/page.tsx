import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AnimateIn } from "@/components/shared/animate-in";
import { CTASection } from "@/components/shared/cta-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/lib/data/site";
import { TrustBadgeGrid } from "@/components/trust-badges";

export const metadata: Metadata = {
  title: "About",
  description: "WaamTech Technologies — delivering software, ERP, and digital solutions since 2012.",
};

const timeline = [
  { year: "2012", title: "WaamTech journey begins", text: "Started building web, software, and digital solutions for businesses — helping clients grow their online presence and operations." },
  { year: "2015", title: "SaaS & enterprise apps", text: "Expanded into custom application development and SaaS products for mid to large organizations across the globe." },
  { year: "2018", title: "ERP platform vision", text: "Began unified ERP development — inventory, finance, sales, and operations in one modular platform." },
  { year: "2022", title: "WaamTech SaaS Core", text: "Launched modular SaaS Core with Industry → Business Category hierarchy, installable modules, and industry-specific feature packs." },
  { year: "2024", title: "Connected ecosystem", text: "Added WhatsApp, Maps, API integrations, and WaamHost cloud hosting for complete infrastructure solutions." },
  { year: "2026", title: "ERP for everyone", text: "Launching affordable ERP with lifetime licenses, whitelabel, own-server, and local deployment options worldwide." },
];

const stats = [
  { value: "2012", label: "Working since" },
  { value: "17", label: "Industries" },
  { value: "100+", label: "Business categories" },
  { value: "24/7", label: "Support available" },
];

const leaders = [
  { name: "WaamTech Leadership", role: "Founding Team", bio: "Experienced technology leaders focused on enterprise clarity, modular design, and customer success since 2012." },
  { name: "Product & Engineering", role: "Core Team", bio: "Building secure, scalable SaaS Core platforms that teams actually love using every day." },
  { name: "Customer Success", role: "Support Team", bio: "24×7 availability to answer queries, onboard clients, and maintain high satisfaction levels." },
];

export default function AboutPage() {
  return (
    <>
      <Section className="!pb-0 !pt-12 md:!pt-16 overflow-hidden">
        <Container>
          <Breadcrumbs items={[{ label: "About" }]} />
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center pb-16">
            <AnimateIn>
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                Since 2012
              </Badge>
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#0b1f3a] text-balance">
                {siteConfig.fullName}
              </h1>
              <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-xl">
                We have been building software, ERP systems, web solutions, and cloud infrastructure for businesses worldwide since <strong>2012</strong>. From responsive websites to full enterprise platforms — WaamTech delivers results-driven technology.
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed max-w-xl">
                Our passion is helping businesses through innovative technologies — modular ERP, managed hosting via{" "}
                <Link href="/servers" className="text-primary hover:underline">WaamHost</Link>, and custom deployment on your own cloud or local server.
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
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fm=webp&fit=crop&w=1600&q=70"
                  alt="WaamTech team collaboration"
                  fill
                  className="object-cover"
                  priority
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
                    Become the operating system for ambitious businesses — cloud SaaS, lifetime licenses, whitelabel, and on-premise deployment for every need.
                  </p>
                </CardContent>
              </Card>
            </AnimateIn>
          </div>
        </Container>
      </Section>

      <Section muted>
        <Container>
          <SectionHeader eyebrow="Our journey" title="Building since 2012" />
          <div className="relative mx-auto max-w-3xl space-y-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-border">
            {timeline.map((item, i) => (
              <AnimateIn key={item.year} delay={i * 0.05}>
                <div className="relative pl-10">
                  <span className="absolute left-0 top-2 h-3.5 w-3.5 rounded-full border-2 border-primary bg-white" />
                  <p className="text-sm font-medium text-primary">{item.year}</p>
                  <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
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

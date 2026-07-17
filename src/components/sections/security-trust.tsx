"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Cloud,
  Database,
  Eye,
  Fingerprint,
  Globe,
  HardDrive,
  KeyRound,
  Layers,
  Lock,
  RefreshCw,
  ScrollText,
  Server,
  Shield,
  ShieldCheck,
  TrendingUp,
  UserCog,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { securityPage } from "@/lib/data/security";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { CTASection } from "@/components/shared/cta-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TrustBadgeGrid } from "@/components/trust-badges";

const iconMap: Record<string, LucideIcon> = {
  ShieldCheck,
  Lock,
  KeyRound,
  UserCog,
  Fingerprint,
  Layers,
  Cloud,
  HardDrive,
  ScrollText,
  BadgeCheck,
  RefreshCw,
  Globe,
  Database,
  Users,
  Eye,
  TrendingUp,
  Zap,
  Server,
};

function Icon({ name, className }: { name: string; className?: string }) {
  const Comp = iconMap[name] ?? ShieldCheck;
  return <Comp className={className} />;
}

const fadeUp = (reduce: boolean | null, delay = 0) =>
  reduce
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-40px" },
        transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
      };

export function SecurityTrustPage() {
  const reduce = useReducedMotion();
  const { hero, highlights, dataProtection, reliability, faqs } =
    securityPage;

  return (
    <>
      {/* Hero */}
      <Section className="!pb-0 !pt-12 md:!pt-16 overflow-hidden relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(5,73,164,0.1),transparent_65%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-soft-grid opacity-40"
        />
        <Container className="relative">
          <Breadcrumbs items={[{ label: "Security & Trust" }]} />
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center pb-16 md:pb-20">
            <div>
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
              >
                <Badge
                  variant="accent"
                  className="mb-4 border border-primary/15 bg-primary/8 text-primary"
                >
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                  {hero.eyebrow}
                </Badge>
              </motion.div>
              <motion.h1
                initial={reduce ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.05 }}
                className="text-4xl md:text-5xl font-semibold tracking-tight text-[#0b1f3a] text-balance"
              >
                {hero.title}
              </motion.h1>
              <motion.p
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12 }}
                className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-xl"
              >
                {hero.description}
              </motion.p>
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.18 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                <Button asChild size="lg" className="rounded-full">
                  <Link href="/signup">
                    Start Free Trial
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full">
                  <Link href="/contact?intent=security">Contact Sales</Link>
                </Button>
              </motion.div>
            </div>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="absolute -inset-3 rounded-[2.25rem] bg-gradient-to-br from-primary/15 via-primary/5 to-transparent blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-gradient-to-br from-white via-slate-50 to-[#eef5ff] p-8 md:p-10 shadow-[0_24px_80px_rgba(15,23,42,0.1)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(5,73,164,0.08),transparent_45%)]" />
                <div className="relative flex flex-col items-center text-center">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl scale-125" />
                    <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-white/80 bg-white/70 shadow-lg backdrop-blur-md">
                      <Shield className="h-12 w-12 text-primary" strokeWidth={1.5} />
                    </div>
                    <motion.div
                      animate={reduce ? undefined : { y: [0, -6, 0] }}
                      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -right-2 -top-1 flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-white/90 shadow-md backdrop-blur"
                    >
                      <Lock className="h-4 w-4 text-primary" />
                    </motion.div>
                    <motion.div
                      animate={reduce ? undefined : { y: [0, 5, 0] }}
                      transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                      className="absolute -bottom-1 -left-3 flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-white/90 shadow-md backdrop-blur"
                    >
                      <Fingerprint className="h-4 w-4 text-primary" />
                    </motion.div>
                  </div>
                  <p className="text-sm font-medium tracking-wide text-primary uppercase">
                    WAAMTO Platform
                  </p>
                  <p className="mt-2 text-xl font-semibold tracking-tight text-[#0b1f3a]">
                    Security built into every layer
                  </p>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
                    Authentication, access control, isolation, and continuous updates — designed for serious businesses.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {["RBAC", "OTP", "TLS", "Audit"].map((label) => (
                      <span
                        key={label}
                        className="rounded-full border border-primary/15 bg-white/80 px-3 py-1 text-xs font-medium text-[#0b1f3a] backdrop-blur"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* Security Highlights */}
      <Section muted>
        <Container>
          <SectionHeader
            eyebrow="Security highlights"
            title="Everything that protects your workspace"
            description="Practical security features already built into WAAMTO — focused on real platform controls, not certification claims."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((item, i) => (
              <motion.div key={item.title} {...fadeUp(reduce, i * 0.04)}>
                <Card className="h-full border-border/80 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_16px_48px_rgba(15,23,42,0.08)]">
                  <CardHeader>
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                      <Icon name={item.icon} className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg leading-snug">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Data Protection */}
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <motion.div {...fadeUp(reduce)}>
              <p className="mb-3 text-sm font-medium tracking-wide text-primary uppercase">
                Data protection
              </p>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-balance text-[#0b1f3a]">
                Your business data stays yours
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed text-lg">
                WAAMTO is designed with clear boundaries, encrypted connections, and privacy-minded access controls so your organization can operate with confidence.
              </p>
            </motion.div>
            <div className="space-y-4">
              {dataProtection.map((item, i) => (
                <motion.div
                  key={item.title}
                  {...fadeUp(reduce, i * 0.06)}
                  className="group flex gap-4 rounded-2xl border border-border/80 bg-gradient-to-r from-white to-slate-50/80 p-5 transition-all duration-300 hover:border-primary/20 hover:shadow-[0_12px_40px_rgba(15,23,42,0.06)]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <Icon name={item.icon} className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0b1f3a]">{item.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Platform Reliability */}
      <Section muted>
        <Container>
          <SectionHeader
            eyebrow="Platform reliability"
            title="Built to stay available and current"
            description="Security works best on infrastructure that is resilient, scalable, and continuously improved."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {reliability.map((item, i) => (
              <motion.div key={item.title} {...fadeUp(reduce, i * 0.05)}>
                <Card className="h-full text-center border-border/80 bg-white/70 backdrop-blur-sm transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/12 to-primary/5 text-primary">
                      <Icon name={item.icon} className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Customer Trust Badges */}
      <Section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgba(5,73,164,0.06),transparent_70%)]"
        />
        <Container className="relative">
          <SectionHeader
            eyebrow="Customer trust"
            title="WaamTech trust badges"
            description="Original WaamTech feature seals that highlight real platform capabilities — not third-party certification logos."
          />
          <TrustBadgeGrid set="all" tone="light" size="lg" href={false} columns="full" />
          <p className="mt-8 text-center text-xs text-muted-foreground max-w-xl mx-auto leading-relaxed">
            These badges describe built-in WAAMTO security and reliability features. They are not SOC 2, ISO, GDPR, PCI, or HIPAA certification marks.
          </p>
        </Container>
      </Section>

      {/* FAQ */}
      <Section muted>
        <Container className="max-w-3xl">
          <SectionHeader
            eyebrow="FAQ"
            title="Security questions, answered"
            description="Clear answers about how WAAMTO protects accounts, sessions, data, and subscriptions."
          />
          <motion.div {...fadeUp(reduce)}>
            <div className="rounded-2xl border border-border/80 bg-white px-5 md:px-8 shadow-[0_8px_40px_rgba(15,23,42,0.04)]">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, i) => (
                  <AccordionItem key={faq.question} value={`faq-${i}`}>
                    <AccordionTrigger className="text-[#0b1f3a]">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </motion.div>
        </Container>
      </Section>

      <CTASection
        title="Ready to secure your business?"
        description="Start a free trial or speak with our team about how WAAMTO protects your operations with enterprise-grade platform security."
        primaryLabel="Start Free Trial"
        primaryHref="/signup"
        secondaryLabel="Contact Sales"
        secondaryHref="/contact?intent=security"
      />
    </>
  );
}

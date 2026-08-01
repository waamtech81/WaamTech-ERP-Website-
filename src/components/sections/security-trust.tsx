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
  ShieldCheck,
  TrendingUp,
  UserCog,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { securityPage } from "@/lib/data/security";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { CTASection } from "@/components/shared/cta-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const pillars = [
  { title: "Access control", text: "RBAC, OTP, and secure sessions keep the right people in — and everyone else out." },
  { title: "Tenant isolation", text: "Each business workspace is separated so company data never crosses boundaries." },
  { title: "Always current", text: "Encrypted transport, backups, audit trails, and continuous platform updates." },
];

export function SecurityTrustPage() {
  const reduce = useReducedMotion();
  const { hero, highlights, dataProtection, reliability, faqs } = securityPage;

  return (
    <>
      <Section className="relative overflow-hidden !pb-12 !pt-12 md:!pt-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(5,73,164,0.09),transparent_60%)]"
        />
        <Container className="relative max-w-3xl text-center">
          <Badge variant="accent" className="mb-4 border border-primary/15 bg-primary/8 text-primary">
            <ShieldCheck className="mr-1 h-3.5 w-3.5" />
            {hero.eyebrow}
          </Badge>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-[#0b1f3a] md:text-5xl">
            {hero.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {hero.description}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link href="/contact?intent=security">Talk to security</Link>
            </Button>
          </div>
        </Container>
      </Section>

      <Section muted className="!py-12">
        <Container>
          <div className="grid gap-4 md:grid-cols-3">
            {pillars.map((p, i) => (
              <motion.div
                key={p.title}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
                className="rounded-2xl border border-border bg-white p-6 text-center shadow-[0_10px_36px_rgba(15,23,42,0.06)]"
              >
                <p className="text-sm font-semibold uppercase tracking-wide text-primary">{p.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.text}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeader
            eyebrow="Platform controls"
            title="Security built into every layer"
            description="Practical protections already running in WAAMTO — authentication, isolation, licensing, and auditability."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((item, i) => (
              <motion.div
                key={item.title}
                initial={reduce ? false : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.03, 0.24) }}
                className="rounded-2xl border border-border bg-white p-5 shadow-sm transition-shadow hover:shadow-[0_12px_36px_rgba(15,23,42,0.08)]"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 text-primary">
                  <Icon name={item.icon} className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-[#0b1f3a]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      <Section muted>
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="mb-3 text-sm font-medium uppercase tracking-wide text-primary">
                Data protection
              </p>
              <h2 className="text-balance text-3xl font-semibold tracking-tight text-[#0b1f3a] md:text-4xl">
                Your business data stays yours
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Clear tenant boundaries, encrypted connections, and privacy-minded access so your
                organization can operate with confidence.
              </p>
            </div>
            <ul className="space-y-3">
              {dataProtection.map((item) => (
                <li
                  key={item.title}
                  className="flex gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                    <Icon name={item.icon} className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0b1f3a]">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeader
            eyebrow="Reliability"
            title="Available, backed up, continuously improved"
            description="Security works best on infrastructure that stays resilient and current."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reliability.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-white p-6 text-center shadow-sm"
              >
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 text-primary">
                  <Icon name={item.icon} className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-[#0b1f3a]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section muted>
        <Container>
          <SectionHeader
            eyebrow="Customer trust"
            title="Built-in trust signals"
            description="WAAMTO feature seals that describe real platform capabilities — not third-party certification logos."
          />
          <TrustBadgeGrid set="all" tone="light" size="lg" href={false} columns="full" />
          <p className="mx-auto mt-8 max-w-xl text-center text-xs leading-relaxed text-muted-foreground">
            These badges describe built-in WAAMTO security and reliability features. They are not
            SOC 2, ISO, GDPR, PCI, or HIPAA certification marks.
          </p>
        </Container>
      </Section>

      <Section>
        <Container className="max-w-3xl">
          <SectionHeader
            eyebrow="FAQ"
            title="Security questions, answered"
            description="How WAAMTO protects accounts, sessions, data, and subscriptions."
          />
          <div className="rounded-2xl border border-border bg-white px-5 shadow-sm md:px-8">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={faq.question} value={`faq-${i}`}>
                  <AccordionTrigger className="text-[#0b1f3a]">{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Container>
      </Section>

      <CTASection
        title="Ready to secure your business?"
        description="Start a free trial or speak with our team about how WAAMTO protects your operations."
        primaryLabel="Start Free Trial"
        primaryHref="/signup"
        secondaryLabel="Contact Sales"
        secondaryHref="/contact?intent=security"
      />
    </>
  );
}

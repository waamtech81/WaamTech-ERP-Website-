import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import {
  erpFeatureGroups,
  erpFeatureStats,
  erpPreinstallExamples,
  erpPreinstallSteps,
} from "@/lib/data/site";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { FeatureCard } from "@/components/shared/cards";
import { AnimateIn } from "@/components/shared/animate-in";
import { CTASection } from "@/components/shared/cta-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getIcon } from "@/lib/icons";

export const metadata: Metadata = {
  title: "ERP Features",
  description:
    "Explore WAAMTO ERP features — 12+ modules, AI Workspace, industry-ready business profiles, and preinstalled workflows for retail, pharmacy, restaurant, manufacturing, and more.",
};

export default function ErpFeaturesPage() {
  return (
    <>
      <Section className="relative overflow-hidden !pb-10 !pt-12 md:!pt-16">
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <Container className="relative">
          <Breadcrumbs items={[{ label: "ERP Features" }]} />
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <Badge variant="accent" className="mb-4">
                Everything in one ERP platform
              </Badge>
              <SectionHeader
                align="left"
                eyebrow="ERP Features"
                title="So many features — ready before you even start"
                description="WAAMTO is not a blank system. Choose your business profile and the common modules, workflows, KPIs, and feature packs for that business arrive preinstalled. Then add AI Assistant, mobile, finance, and more as you grow."
                className="mb-0 max-w-3xl"
              />
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full">
                  <Link href="/signup">
                    Start free trial
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full">
                  <Link href="/contact?intent=demo">Book a demo</Link>
                </Button>
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="grid grid-cols-2 gap-3">
                {erpFeatureStats.map((stat, i) => (
                  <AnimateIn key={stat.label} delay={i * 0.05}>
                    <div className="rounded-2xl border border-border bg-white px-5 py-4 shadow-[0_8px_32px_rgba(15,23,42,0.04)]">
                      <p className="text-2xl font-semibold tracking-tight text-primary">{stat.value}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </AnimateIn>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section muted className="!py-14 md:!py-16">
        <Container>
          <SectionHeader
            eyebrow="Industry-ready setup"
            title="Choose your business — common features come preinstalled"
            description="Retail, pharmacy, restaurant, manufacturing, wholesale, and 100+ business profiles each bring the modules and workflows that business type actually uses."
            className="mb-10"
          />
          <div className="grid gap-5 md:grid-cols-3">
            {erpPreinstallSteps.map((step, i) => {
              const Icon = getIcon(step.icon);
              return (
                <AnimateIn key={step.title} delay={i * 0.06}>
                  <div className="h-full rounded-2xl border border-border bg-white p-6 shadow-[0_8px_32px_rgba(15,23,42,0.04)]">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight">{step.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </AnimateIn>
              );
            })}
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {erpPreinstallExamples.map((example, i) => (
              <AnimateIn key={example.name} delay={(i % 3) * 0.05}>
                <div className="rounded-2xl border border-border bg-white p-5">
                  <p className="font-semibold text-foreground">{example.name}</p>
                  <ul className="mt-3 space-y-2">
                    {example.modules.map((mod) => (
                      <li key={mod} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                        {mod}
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimateIn>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="!py-14 md:!py-16">
        <Container>
          <SectionHeader
            eyebrow="Full capability map"
            title="Every department. One connected platform."
            description="From operations and finance to AI Workspace, analytics, automation, and integrations — explore what WAAMTO includes out of the box."
            className="mb-10"
          />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {erpFeatureGroups.map((group, i) => (
              <div key={group.id} id={group.id}>
                <AnimateIn delay={(i % 3) * 0.05}>
                  <FeatureCard
                    title={group.title}
                    description={group.description}
                    icon={group.icon}
                    features={group.features}
                  />
                </AnimateIn>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <CTASection
        title="See your business profile live in WAAMTO"
        description="Pick your industry, explore preinstalled modules, and start a 14-day free trial — or book a demo and we'll map WAAMTO to your workflow."
        primaryLabel="Start free trial"
        primaryHref="/signup"
        secondaryLabel="Book a demo"
        secondaryHref="/contact?intent=demo"
      />
    </>
  );
}

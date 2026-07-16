import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import {
  getIndustry,
  industriesServing,
  industryCategories,
} from "@/lib/data/industries";
import { getIndustryDetails } from "@/lib/data/industry-details";
import { getIcon } from "@/lib/icons";
import { Container, Section } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AnimateIn } from "@/components/shared/animate-in";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authConfig } from "@/lib/auth/config";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return industriesServing.map((i) => ({ slug: i.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const industry = getIndustry(slug);
  if (!industry) return { title: "Industry" };
  return {
    title: `${industry.name} ERP Software`,
    description: industry.description,
  };
}

export default async function IndustryDetailPage({ params }: Props) {
  const { slug } = await params;
  const industry = getIndustry(slug);
  if (!industry) notFound();

  const Icon = getIcon(industry.icon);
  const details = getIndustryDetails(industry.id);
  const categoryLabel =
    industryCategories.find((c) => c.id === industry.category)?.label ?? industry.category;
  const related = industriesServing
    .filter((i) => i.category === industry.category && i.id !== industry.id)
    .slice(0, 3);
  const trialDays = authConfig.trialDays;

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={industry.image}
            alt={industry.imageAlt}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b1f3a]/92 via-[#0b1f3a]/75 to-[#0b1f3a]/40" />
        </div>
        <Container className="relative py-16 md:py-24 text-white">
          <Breadcrumbs
            className="mb-8 [&_a]:text-white/70 [&_a:hover]:text-white [&_span]:text-white [&_svg]:text-white/50"
            items={[
              { label: "Industries", href: "/industries" },
              { label: industry.name },
            ]}
          />
          <AnimateIn>
            <div className="max-w-3xl">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg"
                  style={{ backgroundColor: industry.color }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <Badge className="bg-white/15 text-white hover:bg-white/20 border-0">
                  {categoryLabel}
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-balance">
                {industry.name}
              </h1>
              <p className="mt-4 text-xl md:text-2xl text-white/90 font-medium text-balance">
                {industry.headline}
              </p>
              <p className="mt-5 text-base md:text-lg text-white/70 leading-relaxed max-w-2xl">
                {industry.description}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="rounded-full bg-white text-[#0b1f3a] hover:bg-slate-100">
                  <Link href={`/signup?profile=${industry.id}`}>
                    Start {trialDays}-day free trial
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/contact?intent=industry">Talk to sales</Link>
                </Button>
              </div>
            </div>
          </AnimateIn>
        </Container>
      </section>

      <Section>
        <Container>
          <div className="grid gap-6 lg:grid-cols-3">
            <AnimateIn className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-2xl">Why {industry.name} teams choose WaamTech</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Simple tools that match how your business actually works.
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {industry.highlights.map((h) => (
                      <li
                        key={h}
                        className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm"
                      >
                        <span
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white"
                          style={{ backgroundColor: industry.color }}
                        >
                          <Check className="h-3 w-3" />
                        </span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </AnimateIn>

            <AnimateIn delay={0.08}>
              <Card className="h-full" style={{ borderColor: `${industry.color}33` }}>
                <CardHeader>
                  <CardTitle>At a glance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Category</p>
                    <p className="font-medium">{categoryLabel}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Modules</p>
                    <p className="font-medium">{industry.modules.length} recommended</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Feature packs</p>
                    <p className="font-medium">{industry.featurePacks.length} capability packs</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Free trial</p>
                    <p className="font-medium">{trialDays} days included</p>
                  </div>
                </CardContent>
              </Card>
            </AnimateIn>
          </div>
        </Container>
      </Section>

      <Section muted>
        <Container>
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-medium text-primary uppercase tracking-wide mb-2">Features</p>
            <h2 className="text-3xl font-semibold tracking-tight text-[#0b1f3a]">
              Everything {industry.name} needs — without the clutter
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Built from our SaaS Core profile for {industry.name.toLowerCase()}. Clear features your team
              can use from day one.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {details.features.map((feature, i) => (
              <div
                key={feature}
                className="rounded-2xl border border-border bg-white p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-300"
              >
                <span
                  className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: industry.color }}
                >
                  {i + 1}
                </span>
                <p className="text-sm font-medium text-[#0b1f3a] leading-relaxed">{feature}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-medium text-primary uppercase tracking-wide mb-2">Results</p>
            <h2 className="text-3xl font-semibold tracking-tight text-[#0b1f3a]">
              What you get in practice
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {details.outcomes.map((outcome) => (
              <Card key={outcome} className="h-full border-border/80">
                <CardContent className="pt-6">
                  <div
                    className="mb-4 h-1.5 w-10 rounded-full"
                    style={{ backgroundColor: industry.color }}
                  />
                  <p className="text-base font-medium text-[#0b1f3a] leading-relaxed">{outcome}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section muted>
        <Container>
          <div className="grid gap-8 lg:grid-cols-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight mb-4">Recommended modules</h2>
              <div className="flex flex-wrap gap-2">
                {industry.modules.map((m) => (
                  <Badge key={m} variant="outline" className="bg-white px-3 py-1.5">
                    {m}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight mb-4">Feature packs</h2>
              <div className="flex flex-wrap gap-2">
                {industry.featurePacks.map((f) => (
                  <Badge key={f} className="px-3 py-1.5 text-white" style={{ backgroundColor: industry.color }}>
                    {f}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight mb-4">Key KPIs</h2>
              <ul className="space-y-2">
                {industry.kpis.map((k) => (
                  <li key={k} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: industry.color }} />
                    {k}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <h2 className="text-2xl font-semibold tracking-tight mb-6">Core workflows</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {industry.workflows.map((w, i) => (
              <div
                key={w}
                className="rounded-2xl border border-border bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-semibold text-primary mb-2">Step {i + 1}</p>
                <p className="font-medium text-[#0b1f3a]">{w}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {related.length > 0 ? (
        <Section muted>
          <Container>
            <div className="mb-8 flex items-end justify-between gap-4">
              <h2 className="text-2xl font-semibold tracking-tight">Related industries</h2>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/industries">View all</Link>
              </Button>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {related.map((r) => (
                <Link key={r.id} href={`/industries/${r.id}`} className="group block">
                  <Card className="overflow-hidden hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)] transition-all">
                    <div className="relative aspect-[16/9]">
                      <Image src={r.image} alt={r.imageAlt} fill className="object-cover" sizes="33vw" />
                    </div>
                    <CardHeader>
                      <CardTitle className="group-hover:text-primary transition-colors">{r.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{r.short}</p>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      <Section className="!pb-20">
        <Container>
          <div
            className="rounded-[2rem] px-8 py-12 md:px-14 md:py-16 text-center text-white"
            style={{
              background: `linear-gradient(135deg, ${industry.color} 0%, #0b1f3a 100%)`,
            }}
          >
            <h2 className="text-3xl font-semibold tracking-tight">
              Launch {industry.name} on WaamTech
            </h2>
            <p className="mt-3 text-white/75 max-w-xl mx-auto">
              Start with this SaaS Core profile and activate only the modules and feature packs you need.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
              <Button asChild size="lg" className="rounded-full bg-white text-[#0b1f3a] hover:bg-slate-100">
                <Link href={`/signup?profile=${industry.id}`}>
                  Start {trialDays}-day free trial
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/products">Browse modules</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

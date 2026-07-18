import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, Check, Layers, Monitor, ShoppingCart, Smartphone } from "lucide-react";
import {
  businessIndustries,
  getBusinessCategory,
  getBusinessIndustry,
  getCategoriesForIndustry,
  getFeaturedIndustries,
  getIndustryForCategory,
  getIndustryLucideIcon,
  getIndustryMedia,
  hierarchyStats,
  isHotCategory,
  resolveBusinessCategoryId,
} from "@/lib/data/business-hierarchy";
import { getIndustry as getLegacyIndustry, industriesServing } from "@/lib/data/industries";
import { getIcon } from "@/lib/icons";
import { siteConfig } from "@/lib/data/site";
import { buildAbsoluteSiteUrl } from "@/lib/urls";
import { Container, Section } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AnimateIn } from "@/components/shared/animate-in";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildSignupPath } from "@/lib/urls";
import { normalizePermalinkSlug } from "@/lib/signup/permalinks";
import { authConfig } from "@/lib/auth/config";

type Props = { params: Promise<{ slug: string }> };

function resolveIndustrySlug(slug: string) {
  const direct = getBusinessIndustry(slug);
  if (direct) return { industry: direct, highlightCategoryId: null as string | null };

  const categoryId = resolveBusinessCategoryId(slug);
  const category = getBusinessCategory(categoryId);
  if (category) {
    const industry = getIndustryForCategory(category.id);
    if (industry) return { industry, highlightCategoryId: category.id };
  }

  // Legacy marketing profile → parent industry if possible
  const legacy = getLegacyIndustry(slug);
  if (legacy) {
    const mapped = resolveBusinessCategoryId(slug);
    const industry = getIndustryForCategory(mapped);
    if (industry) return { industry, highlightCategoryId: mapped };
  }

  return null;
}

export function generateStaticParams() {
  const industryParams = businessIndustries.map((i) => ({ slug: i.id }));
  const legacyParams = industriesServing.map((i) => ({ slug: i.id }));
  const seen = new Set<string>();
  return [...industryParams, ...legacyParams].filter((p) => {
    if (seen.has(p.slug)) return false;
    seen.add(p.slug);
    return true;
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const resolved = resolveIndustrySlug(slug);
  if (!resolved) return { title: "Industry" };

  const { industry } = resolved;
  const media = getIndustryMedia(industry.id);
  const categories = getCategoriesForIndustry(industry.id);
  const title = `${industry.name} ERP Software — ${categories.length} Business Categories`;
  const description = `${industry.description} Configure ${siteConfig.name} with ${categories.length} business categories under ${industry.name}.`;
  const url = buildAbsoluteSiteUrl(`/industries/${industry.id}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: [{ url: media.image, alt: media.imageAlt }],
    },
  };
}

export default async function IndustryDetailPage({ params }: Props) {
  const { slug } = await params;
  const resolved = resolveIndustrySlug(slug);
  if (!resolved) notFound();

  const { industry, highlightCategoryId } = resolved;
  const Icon = getIcon(getIndustryLucideIcon(industry));
  const media = getIndustryMedia(industry.id);
  const categories = getCategoriesForIndustry(industry.id);
  const related = getFeaturedIndustries()
    .all.filter((i) => i.id !== industry.id)
    .slice(0, 4);
  const trialDays = authConfig.trialDays;

  const posEnabledCount = categories.filter((c) => c.pos_mode !== "disabled").length;
  const mobileCount = categories.filter((c) => c.mobile_mode === "required").length;
  const suiteLabel = industry.suite
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());

  return (
    <>
      <Section className="relative !pb-10 !pt-10 md:!pt-14 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(37,99,235,0.08),transparent_70%)]" />
        <Container className="relative">
          <Breadcrumbs
            items={[
              { label: "Industries", href: "/industries" },
              { label: industry.name },
            ]}
          />
          <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-center">
            <AnimateIn>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="accent">Industry suite</Badge>
                <Badge variant="outline">{suiteLabel}</Badge>
              </div>
              <div className="flex items-start gap-3 mb-4">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
                  style={{ backgroundColor: industry.color }}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#0b1f3a] text-balance">
                    {industry.name}
                  </h1>
                </div>
              </div>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
                {industry.description} Pick a business category below — {siteConfig.name} provisions
                modules, POS, and mobile settings from SaaS Core.
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3 max-w-md">
                {[
                  { icon: Layers, label: "Categories", value: categories.length },
                  { icon: ShoppingCart, label: "POS ready", value: posEnabledCount },
                  { icon: Smartphone, label: "Mobile", value: mobileCount },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-border bg-white px-3 py-3 text-center shadow-sm"
                  >
                    <stat.icon className="mx-auto mb-1.5 h-4 w-4 text-primary" />
                    <p className="text-xl font-semibold tracking-tight text-[#0b1f3a] tabular-nums">
                      {stat.value}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full">
                  <Link
                    href={buildSignupPath({
                      industrySlug: normalizePermalinkSlug(industry.id),
                    })}
                  >
                    Start {trialDays}-day free trial
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full">
                  <Link href="/industries">All industries</Link>
                </Button>
              </div>
            </AnimateIn>
            <AnimateIn delay={0.08}>
              <div className="relative aspect-[16/11] overflow-hidden rounded-3xl border border-border shadow-lg">
                <Image
                  src={media.image}
                  alt={media.imageAlt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b1f3a]/50 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2.5 rounded-2xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: industry.color }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0b1f3a] truncate">{industry.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {categories.length} ready-to-provision categories
                    </p>
                  </div>
                </div>
              </div>
            </AnimateIn>
          </div>
        </Container>
      </Section>

      <Section muted className="!pt-4">
        <Container>
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-primary uppercase tracking-wide mb-2">
                Business categories
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0b1f3a]">
                {categories.length} categories in {industry.name}
              </h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Each category is a SaaS Core profile with its own modules, POS mode, and mobile
                settings. Click any card to start signup with it pre-selected.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => {
              const highlight = highlightCategoryId === cat.id;
              const posEnabled = cat.pos_mode !== "disabled";
              return (
                <Link
                  key={cat.id}
                  href={buildSignupPath({
                    industrySlug: normalizePermalinkSlug(industry.id),
                    categorySlug: normalizePermalinkSlug(cat.id),
                  })}
                  className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)] ${
                    highlight
                      ? "border-primary ring-2 ring-primary/15 shadow-md"
                      : "border-border hover:border-primary/25"
                  }`}
                >
                  <div
                    className="absolute inset-x-0 top-0 h-1 opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ backgroundColor: industry.color }}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition-transform group-hover:scale-105"
                      style={{ backgroundColor: industry.color }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>

                  <p className="mt-3 flex items-center gap-2 font-semibold text-[#0b1f3a] leading-snug">
                    <span>{cat.name}</span>
                    {isHotCategory(cat.id) ? (
                      <span className="shrink-0 rounded bg-orange-500/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white leading-none">
                        Hot
                      </span>
                    ) : null}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        posEnabled
                          ? "bg-primary/8 text-primary"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {posEnabled ? (
                        <ShoppingCart className="h-3 w-3" />
                      ) : (
                        <Monitor className="h-3 w-3" />
                      )}
                      POS {cat.pos_mode}
                    </span>
                    {cat.mobile_mode === "required" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-600">
                        <Smartphone className="h-3 w-3" />
                        Mobile
                      </span>
                    ) : null}
                  </div>

                  {highlight ? (
                    <p className="mt-3 text-xs font-medium text-primary">Matched from your link</p>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-4 md:grid-cols-3 mb-12">
            {[
              {
                title: "Industry first",
                text: "Choose the parent industry that matches your market.",
              },
              {
                title: "Then category",
                text: "Select the exact business type — retail store, chain pharmacy, dealership, and more.",
              },
              {
                title: "Auto-provisioned",
                text: "Modules, feature packs, POS, and mobile follow the SaaS Core category manifest.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-white p-5 sm:p-6">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-[#0b1f3a]">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight mb-5">
              More industries ({hierarchyStats.industries} total)
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((rel) => {
                const RelIcon = getIcon(getIndustryLucideIcon(rel));
                return (
                  <Link
                    key={rel.id}
                    href={`/industries/${rel.id}`}
                    className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 hover:border-primary/30 transition-colors"
                  >
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                      style={{ backgroundColor: rel.color }}
                    >
                      <RelIcon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium truncate">{rel.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {getCategoriesForIndustry(rel.id).length} categories
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

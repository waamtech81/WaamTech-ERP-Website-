"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, ShoppingCart, Smartphone } from "lucide-react";
import { products, siteConfig } from "@/lib/data/site";
import { coreModules } from "@/lib/data/core";
import {
  getCategoriesForIndustry,
  getFeaturedIndustries,
  getIndustryLucideIcon,
  hierarchyStats,
  type BusinessCategory,
  type BusinessIndustry,
} from "@/lib/data/business-hierarchy";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Container, Section } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ShowcaseMode = "products" | "industries" | "categories";

const modes: { id: ShowcaseMode; label: string; count: string }[] = [
  { id: "products", label: "Products", count: `${products.length}` },
  { id: "industries", label: "Industries", count: `${hierarchyStats.industries}` },
  { id: "categories", label: "Categories", count: `${hierarchyStats.categories}+` },
];

export function ModuleShowcase() {
  const [mode, setMode] = useState<ShowcaseMode>("products");
  const [productIndex, setProductIndex] = useState(0);
  const [industryIndex, setIndustryIndex] = useState(0);
  const reduce = useReducedMotion();

  const industries = getFeaturedIndustries().all;
  const activeIndustry = industries[industryIndex] ?? industries[0];
  const industryCategories = activeIndustry
    ? getCategoriesForIndustry(activeIndustry.id)
    : [];

  const module = coreModules[productIndex] ?? coreModules[0];
  const ProductIcon = getIcon(module.icon);

  return (
    <Section className="!pt-10 md:!pt-14 bg-white">
      <Container>
        <div className="mx-auto mb-8 md:mb-10 max-w-3xl text-center">
          <h2 className="font-[family-name:var(--font-poppins)] text-3xl md:text-4xl font-semibold tracking-tight text-[#0b1f3a] text-balance">
            One solution to manage everything, in one place
          </h2>
          <p className="mt-3 md:mt-4 text-muted-foreground text-base md:text-lg leading-relaxed">
            {siteConfig.name} brings products, industries, and business categories together — the same
            hierarchy used in SaaS Core provisioning.
          </p>
        </div>

        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-2xl border border-border bg-slate-50 p-1.5 gap-1">
            {modes.map((m) => {
              const selected = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                    selected
                      ? "bg-white text-primary shadow-sm"
                      : "text-muted-foreground hover:text-[#0b1f3a]"
                  )}
                >
                  {m.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                      selected ? "bg-primary/10 text-primary" : "bg-slate-200/80 text-slate-500"
                    )}
                  >
                    {m.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {mode === "products" ? (
            <motion.div
              key="products"
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6 md:mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-none justify-start md:justify-center">
                {coreModules.map((m, i) => {
                  const TabIcon = getIcon(m.icon);
                  const selected = i === productIndex;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setProductIndex(i)}
                      className={cn(
                        "group flex min-w-[88px] flex-col items-center gap-2 rounded-2xl px-3 py-3 transition-all duration-300",
                        selected ? "bg-transparent" : "hover:bg-slate-50"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-300",
                          selected
                            ? "border-primary bg-primary text-white shadow-lg shadow-primary/25 scale-105"
                            : "border-border bg-white text-slate-500 group-hover:border-primary/30 group-hover:text-primary"
                        )}
                      >
                        <TabIcon className="h-5 w-5" />
                      </span>
                      <span
                        className={cn(
                          "text-xs font-medium whitespace-nowrap",
                          selected ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        {m.short}
                      </span>
                    </button>
                  );
                })}
              </div>

              <ShowcasePanel>
                <div className="grid lg:grid-cols-[1fr_1.35fr]">
                  <div className="border-b lg:border-b-0 lg:border-r border-border p-6 md:p-8">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <ProductIcon className="h-5 w-5" />
                    </div>
                    <h3 className="text-2xl font-semibold tracking-tight text-[#0b1f3a]">
                      {module.name}
                    </h3>
                    <p className="mt-2 text-sm font-medium text-primary">{module.tagline}</p>
                    <p className="mt-4 text-muted-foreground leading-relaxed">{module.description}</p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {module.highlights.map((h) => (
                        <Badge key={h} variant="muted">
                          {h}
                        </Badge>
                      ))}
                    </div>
                    <Button asChild variant="link" className="mt-4 px-0">
                      <Link href={`/products#${module.id}`}>
                        Explore module <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>

                  <div className="bg-[#f4f7fb] p-5 md:p-7">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-semibold text-[#0b1f3a]">{module.preview.title}</p>
                      <Badge variant="accent">Live preview</Badge>
                    </div>
                    <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      {module.preview.kpis.map((kpi) => (
                        <div
                          key={kpi.label}
                          className="rounded-xl border border-border bg-white p-3 shadow-sm"
                        >
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            {kpi.label}
                          </p>
                          <p
                            className={cn(
                              "mt-1 text-base font-semibold tracking-tight",
                              kpi.tone === "good" && "text-emerald-600",
                              kpi.tone === "warn" && "text-amber-600",
                              kpi.tone === "bad" && "text-rose-600",
                              kpi.tone === "neutral" && "text-[#0b1f3a]"
                            )}
                          >
                            {kpi.value}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
                      {module.preview.rows.map((row) => (
                        <div
                          key={row.ref}
                          className="flex items-center justify-between gap-3 border-b border-border last:border-0 px-4 py-3 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-[#0b1f3a] truncate">{row.name}</p>
                            <p className="text-xs text-muted-foreground">{row.ref}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-medium">{row.qty}</p>
                            <p className="text-xs text-muted-foreground">{row.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ShowcasePanel>
            </motion.div>
          ) : null}

          {mode === "industries" && activeIndustry ? (
            <motion.div
              key="industries"
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <ShowcasePanel>
                <div className="grid lg:grid-cols-[240px_1fr] xl:grid-cols-[260px_1fr] min-w-0 overflow-hidden">
                  <IndustrySidebar
                    industries={industries}
                    activeIndex={industryIndex}
                    onSelect={setIndustryIndex}
                  />
                  <IndustryDetailPanel
                    industry={activeIndustry}
                    categories={industryCategories}
                    embedded
                  />
                </div>
              </ShowcasePanel>
            </motion.div>
          ) : null}

          {mode === "categories" && activeIndustry ? (
            <motion.div
              key="categories"
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <ShowcasePanel>
                <div className="grid lg:grid-cols-[240px_1fr] xl:grid-cols-[260px_1fr] min-w-0 overflow-hidden">
                  <IndustrySidebar
                    industries={industries}
                    activeIndex={industryIndex}
                    onSelect={setIndustryIndex}
                  />
                  <div className="flex min-w-0 flex-col overflow-hidden max-h-[280px] sm:max-h-[360px] lg:max-h-[520px]">
                    <div className="shrink-0 p-5 md:p-7 pb-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-primary uppercase tracking-wide">
                            Business categories
                          </p>
                          <h3 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight text-[#0b1f3a]">
                            {industryCategories.length} in {activeIndustry.name}
                          </h3>
                        </div>
                        <Button asChild variant="outline" size="sm" className="rounded-full shrink-0">
                          <Link href={`/industries/${activeIndustry.id}`}>
                            View industry
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin px-5 md:px-7 pb-5 md:pb-7">
                      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                        {industryCategories.map((cat) => (
                          <CategoryCard
                            key={cat.id}
                            category={cat}
                            industry={activeIndustry}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </ShowcasePanel>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Container>
    </Section>
  );
}

function IndustrySidebar({
  industries,
  activeIndex,
  onSelect,
}: {
  industries: BusinessIndustry[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="border-b lg:border-b-0 lg:border-r border-border bg-slate-50/80 p-3 min-w-0 shrink-0 overflow-x-hidden max-h-[280px] sm:max-h-[360px] lg:max-h-[520px] overflow-y-auto scrollbar-thin">
      <p className="px-2 mb-2 text-[11px] font-bold uppercase tracking-widest text-primary/70">
        Industries
      </p>
      <ul className="space-y-0.5">
        {industries.map((ind, i) => {
          const TabIcon = getIcon(getIndustryLucideIcon(ind));
          const selected = i === activeIndex;
          const count = getCategoriesForIndustry(ind.id).length;
          return (
            <li key={ind.id}>
              <button
                type="button"
                onClick={() => onSelect(i)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-all",
                  selected
                    ? "bg-white shadow-sm ring-1 ring-border"
                    : "hover:bg-white/70"
                )}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: ind.color }}
                >
                  <TabIcon className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-xs font-semibold truncate",
                      selected ? "text-[#0b1f3a]" : "text-muted-foreground"
                    )}
                  >
                    {ind.name}
                  </span>
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                    selected ? "bg-primary/10 text-primary" : "bg-slate-200/80 text-slate-500"
                  )}
                >
                  {count}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CategoryCard({
  category,
  industry,
}: {
  category: BusinessCategory;
  industry: BusinessIndustry;
}) {
  const CatIcon = getIcon(getIndustryLucideIcon(industry));
  const posEnabled = category.pos_mode !== "disabled";

  return (
    <Link
      href={`/signup?industry=${category.industry_id}&profile=${category.id}`}
      className="group flex items-start gap-3 rounded-2xl border border-border bg-white p-3.5 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)] min-w-0"
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition-transform group-hover:scale-105"
        style={{ backgroundColor: industry.color }}
      >
        <CatIcon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-[#0b1f3a] leading-snug line-clamp-2">
            {category.name}
          </p>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
              posEnabled ? "bg-primary/8 text-primary" : "bg-slate-100 text-slate-500"
            )}
          >
            <ShoppingCart className="h-3 w-3" />
            POS {category.pos_mode}
          </span>
          {category.mobile_mode === "required" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-600">
              <Smartphone className="h-3 w-3" />
              Mobile
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function ShowcasePanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-b from-sky-50 via-blue-50/40 to-transparent" />
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.1)]">
        {children}
      </div>
    </div>
  );
}

function IndustryDetailPanel({
  industry,
  categories,
  embedded = false,
}: {
  industry: BusinessIndustry;
  categories: ReturnType<typeof getCategoriesForIndustry>;
  embedded?: boolean;
}) {
  const Icon = getIcon(getIndustryLucideIcon(industry));
  const previewCats = categories.slice(0, 6);
  const posCount = categories.filter((c) => c.pos_mode !== "disabled").length;
  const mobileCount = categories.filter((c) => c.mobile_mode === "required").length;

  const content = (
    <div className={cn("grid min-w-0 overflow-hidden", embedded ? "lg:grid-cols-1 xl:grid-cols-[1fr_1.15fr]" : "lg:grid-cols-[1fr_1.35fr]")}>
      <div className="border-b xl:border-b-0 xl:border-r border-border p-6 md:p-8 min-w-0 overflow-x-hidden">
        <div
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-white"
          style={{ backgroundColor: industry.color }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-2xl font-semibold tracking-tight text-[#0b1f3a]">{industry.name}</h3>
        <p className="mt-2 text-sm font-medium text-primary">
          {categories.length} business categories
        </p>
        <p className="mt-4 text-muted-foreground leading-relaxed">{industry.description}</p>

        <div className="mt-6 grid grid-cols-3 gap-2.5">
          {[
            { label: "Categories", value: categories.length },
            { label: "POS ready", value: posCount },
            { label: "Mobile", value: mobileCount },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-slate-50 px-3 py-2.5 text-center"
            >
              <p className="text-lg font-semibold tabular-nums text-[#0b1f3a]">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <Button asChild className="mt-6 rounded-full" size="sm">
          <Link href={`/industries/${industry.id}`}>
            Explore industry
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="bg-[#f4f7fb] p-5 md:p-7 min-w-0 overflow-x-hidden flex flex-col max-h-[280px] sm:max-h-[360px] lg:max-h-none">
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <p className="text-sm font-semibold text-[#0b1f3a]">Categories in this industry</p>
          <Badge variant="accent">{categories.length} total</Badge>
        </div>
        <div className="space-y-2 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin pr-0.5">
          {previewCats.map((cat) => (
            <Link
              key={cat.id}
              href={`/signup?industry=${industry.id}&profile=${cat.id}`}
              className="group flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-2.5 text-sm transition-all hover:border-primary/25 hover:shadow-sm min-w-0"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                style={{ backgroundColor: industry.color }}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[#0b1f3a] truncate">{cat.name}</p>
                <p className="text-xs text-muted-foreground">
                  POS {cat.pos_mode}
                  {cat.mobile_mode === "required" ? " · Mobile" : ""}
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          ))}
        </div>
        {categories.length > 6 ? (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            +{categories.length - 6} more — open the industry page to see all
          </p>
        ) : null}
      </div>
    </div>
  );

  if (embedded) return content;
  return <ShowcasePanel>{content}</ShowcasePanel>;
}

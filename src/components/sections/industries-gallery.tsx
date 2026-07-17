"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronDown, Smartphone } from "lucide-react";
import {
  featuredIndustryIds,
  getCategoriesForIndustry,
  getFeaturedIndustries,
  getIndustryLucideIcon,
  getIndustryMedia,
  hierarchyStats,
  type BusinessIndustry,
} from "@/lib/data/business-hierarchy";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AnimateIn } from "@/components/shared/animate-in";

type Filter = "featured" | "all";

export function IndustriesGallery() {
  const [filter, setFilter] = useState<Filter>("featured");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { featured, all } = useMemo(() => getFeaturedIndustries(), []);
  const items = filter === "featured" ? featured : all;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {items.length} of {hierarchyStats.industries} industries ·{" "}
          {hierarchyStats.categories} business categories
        </p>
        <div className="inline-flex rounded-full border border-border bg-white p-1 shadow-sm">
          {(
            [
              { id: "featured" as const, label: "Featured" },
              { id: "all" as const, label: "All industries" },
            ] as const
          ).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setFilter(c.id);
                setExpandedId(null);
              }}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                filter === c.id
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((industry, i) => (
          <AnimateIn key={industry.id} delay={(i % 6) * 0.04}>
            <IndustryCard
              industry={industry}
              expanded={expandedId === industry.id}
              onToggle={() =>
                setExpandedId((prev) => (prev === industry.id ? null : industry.id))
              }
              featured={featuredIndustryIds.includes(
                industry.id as (typeof featuredIndustryIds)[number]
              )}
            />
          </AnimateIn>
        ))}
      </div>
    </div>
  );
}

function IndustryCard({
  industry,
  expanded,
  onToggle,
  featured,
}: {
  industry: BusinessIndustry;
  expanded: boolean;
  onToggle: () => void;
  featured: boolean;
}) {
  const Icon = getIcon(getIndustryLucideIcon(industry));
  const media = getIndustryMedia(industry.id);
  const categories = getCategoriesForIndustry(industry.id);
  const preview = categories.slice(0, 6);

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow",
        expanded
          ? "border-primary/25 shadow-[0_12px_40px_rgba(15,23,42,0.1)]"
          : "border-border hover:border-primary/20 hover:shadow-md"
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={media.image}
          alt={media.imageAlt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1f3a]/90 via-[#0b1f3a]/35 to-transparent" />
        <div
          className="absolute left-3.5 top-3.5 flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md"
          style={{ backgroundColor: industry.color }}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="absolute right-3.5 top-3.5 flex flex-col items-end gap-1.5">
          {featured ? (
            <Badge className="bg-accent text-white hover:bg-accent text-[10px] px-2 py-0.5">
              Featured
            </Badge>
          ) : null}
          <Badge className="bg-white/95 text-[#0b1f3a] hover:bg-white text-[10px] px-2 py-0.5">
            {categories.length}
          </Badge>
        </div>
        <div className="absolute bottom-3.5 left-3.5 right-3.5">
          <h3 className="text-lg font-semibold tracking-tight text-white">{industry.name}</h3>
          <p className="mt-0.5 text-sm text-white/75 line-clamp-2">{industry.description}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-slate-50/80 px-3 py-2.5 text-left transition-colors hover:border-primary/25 hover:bg-white"
          aria-expanded={expanded}
        >
          <span className="text-sm font-medium text-[#0b1f3a]">
            {expanded ? "Hide categories" : "Show categories"}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              expanded && "rotate-180"
            )}
          />
        </button>

        {expanded ? (
          <div className="mt-3 space-y-2">
            <div className="grid gap-2">
              {preview.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/signup?industry=${industry.id}&profile=${cat.id}`}
                  className="rounded-xl border border-border px-3 py-2.5 hover:border-primary/30 hover:bg-primary/[0.03] transition-colors"
                >
                  <span className="block text-sm font-medium text-[#0b1f3a]">{cat.name}</span>
                  <span className="mt-0.5 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                    <span>POS {cat.pos_mode}</span>
                    {cat.mobile_mode === "required" ? (
                      <span className="inline-flex items-center gap-0.5 text-rose-600">
                        <Smartphone className="h-3 w-3" />
                        Mobile
                      </span>
                    ) : null}
                  </span>
                </Link>
              ))}
            </div>
            {categories.length > preview.length ? (
              <p className="text-xs text-muted-foreground px-0.5">
                +{categories.length - preview.length} more on the industry page
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3 mt-3">
          <Link
            href={`/industries/${industry.id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Details
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={`/signup?industry=${industry.id}`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
            aria-label={`Start trial for ${industry.name}`}
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";
import { getIndustryMedia } from "@/lib/data/business-hierarchy";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AnimateIn } from "@/components/shared/animate-in";
import {
  useCatalogBusinessCategories,
  useCatalogBusinessProfiles,
  useCatalogIndustries,
} from "@/hooks/use-commercial";
import {
  CatalogEmptyState,
  CatalogErrorState,
  CatalogSkeleton,
} from "@/components/commercial/catalog-states";
import { industryDisplayIcon } from "@/lib/commercial/mappers";
import type { CatalogIndustry } from "@/lib/commercial/types";

type Filter = "featured" | "all";

function IndustryCard({
  industry,
  expanded,
  onToggle,
  featured,
}: {
  industry: CatalogIndustry;
  expanded: boolean;
  onToggle: () => void;
  featured?: boolean;
}) {
  const categories = useCatalogBusinessCategories(expanded ? industry.id : null);
  const Icon = getIcon(industryDisplayIcon(industry));
  const media = getIndustryMedia(industry.slug || industry.id);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left"
        aria-expanded={expanded}
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={media.image}
            alt={media.imageAlt}
            fill
            quality={70}
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1f3a]/75 to-transparent" />
          <div className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          {featured ? (
            <Badge className="absolute right-3 top-3 bg-white/90 text-[#0b1f3a] hover:bg-white text-[10px]">
              Featured
            </Badge>
          ) : null}
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
            <p className="text-base font-semibold text-white">{industry.name}</p>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-white/80 transition-transform",
                expanded && "rotate-180"
              )}
            />
          </div>
        </div>
      </button>
      <div className="p-4">
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {industry.description || `Business categories for ${industry.name}.`}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/industries/${industry.slug || industry.id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View industry <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={`/signup?industry=${encodeURIComponent(industry.id)}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary"
          >
            Start trial <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
      {expanded ? (
        <div className="border-t border-border bg-slate-50/70 px-4 py-4">
          {categories.loading ? (
            <p className="text-sm text-muted-foreground">Loading categories…</p>
          ) : null}
          {categories.error ? (
            <CatalogErrorState message={categories.error} onRetry={categories.retry} />
          ) : null}
          {!categories.loading && !categories.error && categories.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No public categories for this industry.</p>
          ) : null}
          <div className="grid gap-2">
            {categories.data.map((cat) => (
              <CategoryRow key={cat.id} categoryId={cat.id} name={cat.name} industryId={industry.id} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CategoryRow({
  categoryId,
  name,
  industryId,
}: {
  categoryId: string;
  name: string;
  industryId: string;
}) {
  const profiles = useCatalogBusinessProfiles(categoryId);
  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-[#0b1f3a]">{name}</p>
        <Link
          href={`/signup?industry=${encodeURIComponent(industryId)}&category=${encodeURIComponent(categoryId)}`}
          className="text-xs font-medium text-primary hover:underline"
        >
          Select
        </Link>
      </div>
      {profiles.loading ? (
        <p className="mt-1 text-xs text-muted-foreground">Loading profiles…</p>
      ) : null}
      {profiles.data.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {profiles.data.map((p) => (
            <li key={p.id}>
              <Link
                href={`/signup?industry=${encodeURIComponent(industryId)}&category=${encodeURIComponent(categoryId)}&profile=${encodeURIComponent(p.id)}`}
                className="inline-flex rounded-full bg-primary/8 px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/15"
              >
                {p.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function IndustriesGallery() {
  const [filter, setFilter] = useState<Filter>("featured");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const industriesQuery = useCatalogIndustries();

  const all = industriesQuery.data;
  const featured = useMemo(() => all.slice(0, 8), [all]);
  const items = filter === "featured" ? featured : all;

  if (industriesQuery.loading) return <CatalogSkeleton rows={6} />;
  if (industriesQuery.error) {
    return (
      <CatalogErrorState message={industriesQuery.error} onRetry={industriesQuery.retry} />
    );
  }
  if (all.length === 0) {
    return <CatalogEmptyState message="No industries are published in License Engine yet." />;
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {items.length} of {all.length} industries from License Engine
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
              featured={featured.some((f) => f.id === industry.id)}
            />
          </AnimateIn>
        ))}
      </div>
    </div>
  );
}

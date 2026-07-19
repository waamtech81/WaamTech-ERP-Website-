"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";
import { getIndustryMedia, isHotCategory } from "@/lib/data/business-hierarchy";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
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
import { normalizePermalinkSlug } from "@/lib/signup/permalinks";

type Filter = "featured" | "all";

function IndustryCard({
  industry,
  expanded,
  onToggle,
  featured,
  large,
}: {
  industry: CatalogIndustry;
  expanded: boolean;
  onToggle: () => void;
  featured?: boolean;
  large?: boolean;
}) {
  const categories = useCatalogBusinessCategories(expanded ? industry.id : null);
  const Icon = getIcon(industryDisplayIcon(industry));
  const media = getIndustryMedia(
    industry.code || industry.slug || industry.id,
    large ? 900 : 640
  );

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-[1.35rem] bg-[#0b1f3a] ring-1 ring-black/5 transition-[transform,box-shadow] duration-300",
        "hover:-translate-y-1 hover:shadow-[0_28px_60px_-28px_rgba(11,31,58,0.55)]",
        expanded && "ring-primary/30"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="relative block w-full text-left"
        aria-expanded={expanded}
      >
        <div
          className={cn(
            "relative overflow-hidden",
            large ? "aspect-[16/10] sm:aspect-[21/11]" : "aspect-[5/4] sm:aspect-[4/3]"
          )}
        >
          <Image
            src={media.image}
            alt={media.imageAlt}
            fill
            quality={70}
            sizes={
              large
                ? "(max-width: 768px) 100vw, 66vw"
                : "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            }
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071528] via-[#071528]/45 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          <div className="absolute left-4 top-4 flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-primary shadow-sm backdrop-blur">
              <Icon className="h-4 w-4" />
            </span>
            {featured ? (
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#0b1f3a]">
                Featured
              </span>
            ) : null}
          </div>

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <h3
                  className={cn(
                    "font-semibold tracking-tight text-white text-balance",
                    large ? "text-xl sm:text-2xl" : "text-lg"
                  )}
                >
                  {industry.name}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-sm text-white/70 leading-relaxed">
                  {industry.description || `Business categories for ${industry.name}.`}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition-transform",
                  expanded && "rotate-180"
                )}
              >
                <ChevronDown className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </button>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 bg-[#0b1f3a] px-4 py-3 sm:px-5">
        <Link
          href={`/industries/${industry.slug || industry.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-sky-300 hover:text-white"
        >
          View industry <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          href={
            industry.slug
              ? `/signup/${encodeURIComponent(industry.slug)}`
              : "/signup"
          }
          className="inline-flex items-center gap-1 text-sm font-medium text-white/65 hover:text-white"
        >
          Start trial <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {expanded ? (
        <div className="border-t border-white/10 bg-slate-50 px-4 py-4 sm:px-5">
          {categories.loading ? (
            <p className="text-sm text-muted-foreground">Loading categories…</p>
          ) : null}
          {categories.error ? (
            <CatalogErrorState
              message={categories.error}
              onRetry={categories.retry}
              offline={categories.offline}
            />
          ) : null}
          {!categories.loading && !categories.error && categories.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No public categories for this industry.</p>
          ) : null}
          <div className="grid gap-2">
            {categories.data.map((cat) => (
              <CategoryRow
                key={cat.id}
                categoryId={cat.id}
                name={cat.name}
                industrySlug={industry.slug || normalizePermalinkSlug(industry.code) || ""}
                slug={cat.slug}
                code={cat.code}
              />
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function CategoryRow({
  categoryId,
  name,
  industrySlug,
  slug,
  code,
}: {
  categoryId: string;
  name: string;
  industrySlug: string;
  slug?: string | null;
  code?: string | null;
}) {
  const profiles = useCatalogBusinessProfiles(categoryId);
  const hot = isHotCategory({ id: categoryId, slug, code });
  const categorySlug = slug || code;
  const signupHref = categorySlug
    ? `/signup/${encodeURIComponent(industrySlug)}/${encodeURIComponent(categorySlug)}`
    : `/signup/${encodeURIComponent(industrySlug)}`;
  return (
    <div className="rounded-xl bg-white px-3 py-2.5 ring-1 ring-border/80 transition-colors hover:ring-primary/35">
      <div className="flex items-center justify-between gap-2">
        <Link
          href={signupHref}
          className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-[#0b1f3a] hover:text-primary"
        >
          <span className="truncate">{name}</span>
          {hot ? (
            <span className="shrink-0 rounded bg-orange-500/90 px-1 py-px text-[9px] font-bold uppercase tracking-wide text-white leading-none">
              Hot
            </span>
          ) : null}
        </Link>
        <Link
          href={signupHref}
          className="shrink-0 text-xs font-medium text-primary hover:underline"
        >
          Select
        </Link>
      </div>
      {profiles.loading ? (
        <p className="mt-1 text-xs text-muted-foreground">Loading profiles…</p>
      ) : null}
      {profiles.data.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {profiles.data.map((p) => {
            const profileSlug = p.slug || p.code;
            const href = profileSlug
              ? `${signupHref}?profile=${encodeURIComponent(profileSlug)}`
              : signupHref;
            return (
              <li key={p.id}>
                <Link
                  href={href}
                  className="inline-flex rounded-full bg-primary/8 px-2 py-0.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/15"
                >
                  {p.name}
                </Link>
              </li>
            );
          })}
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
  const lead = items[0];
  const rest = items.slice(1);

  if (industriesQuery.loading) return <CatalogSkeleton rows={6} />;
  if (industriesQuery.error) {
    return (
      <CatalogErrorState
        message={industriesQuery.error}
        onRetry={industriesQuery.retry}
        offline={industriesQuery.offline}
      />
    );
  }
  if (all.length === 0) {
    return <CatalogEmptyState message="No industries are published in License Engine yet." />;
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {items.length} of {all.length} industries
        </p>
        <div className="inline-flex rounded-full border border-border/80 bg-white p-1">
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
                  ? "bg-[#0b1f3a] text-white"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {lead ? (
        <AnimateIn className="mb-5">
          <IndustryCard
            industry={lead}
            large
            featured={featured.some((f) => f.id === lead.id)}
            expanded={expandedId === lead.id}
            onToggle={() =>
              setExpandedId((prev) => (prev === lead.id ? null : lead.id))
            }
          />
        </AnimateIn>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {rest.map((industry, i) => (
          <AnimateIn key={industry.id} delay={(i % 6) * 0.05}>
            <IndustryCard
              industry={industry}
              featured={featured.some((f) => f.id === industry.id)}
              expanded={expandedId === industry.id}
              onToggle={() =>
                setExpandedId((prev) => (prev === industry.id ? null : industry.id))
              }
            />
          </AnimateIn>
        ))}
      </div>
    </div>
  );
}

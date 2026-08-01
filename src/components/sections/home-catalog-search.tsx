"use client";

import { useDeferredValue, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Layers,
  Search,
  Store,
  X,
} from "lucide-react";
import { products } from "@/lib/data/site";
import {
  getSearchCatalogStats,
  searchSiteCatalog,
  type SiteSearchResult,
} from "@/lib/search";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Container, Section } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";

const typeMeta: Record<
  SiteSearchResult["type"],
  { label: string; icon: typeof Search; badge: string }
> = {
  Product: { label: "Product", icon: Boxes, badge: "bg-sky-50 text-sky-700" },
  Industry: { label: "Industry", icon: Store, badge: "bg-violet-50 text-violet-700" },
  Category: { label: "Category", icon: Layers, badge: "bg-emerald-50 text-emerald-700" },
};

export function HomeCatalogSearch({
  variant = "section",
}: {
  variant?: "section" | "hero";
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const results = searchSiteCatalog(deferredQuery, 6);
  const catalogStats = getSearchCatalogStats();
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isPending = query.trim() !== deferredQuery.trim();

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const showPanel = open && query.trim().length >= 2;

  const inner = (
    <>
      <div ref={wrapRef} className="relative mx-auto w-full max-w-2xl">
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-2xl border bg-white px-4 py-1.5 shadow-[0_10px_40px_rgba(11,31,58,0.08)] transition-[border-color,box-shadow] duration-200 sm:gap-3 sm:rounded-full sm:px-5 sm:py-2",
            "border-slate-200/90",
            "focus-within:border-primary/45 focus-within:shadow-[0_12px_44px_rgba(5,73,164,0.14)] focus-within:ring-2 focus-within:ring-primary/15"
          )}
        >
          <Search className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setOpen(false);
                inputRef.current?.blur();
              }
            }}
            placeholder="Search products, industries, or business types…"
            aria-autocomplete="list"
            aria-controls={listId}
            aria-expanded={showPanel}
            autoComplete="off"
            className="wt-search-field h-11 w-full min-w-0 flex-1 border-0 bg-transparent text-[15px] font-medium text-[#0b1f3a] shadow-none outline-none ring-0 placeholder:text-slate-400 sm:h-12 sm:text-base"
          />
          {isPending ? (
            <span
              className="h-4 w-4 shrink-0 animate-pulse rounded-full bg-primary/25"
              aria-hidden
            />
          ) : null}
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#0b1f3a]"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {!showPanel ? (
          <p className="mt-2.5 text-center text-[11px] leading-snug text-muted-foreground">
            Search {catalogStats.products || products.length} products ·{" "}
            {catalogStats.industries} industries · {catalogStats.categories}+ categories
          </p>
        ) : null}

        {showPanel ? (
          <div
            id={listId}
            role="listbox"
            className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-30 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_22px_64px_rgba(11,31,58,0.14)]"
          >
            <div className="flex items-center justify-between border-b border-border bg-[#f8fafc] px-4 py-2.5">
              <p className="text-xs font-medium text-muted-foreground">
                {isPending
                  ? "Searching…"
                  : results.length > 0
                    ? `${results.length} result${results.length === 1 ? "" : "s"}`
                    : "No matches"}
              </p>
              <div className="hidden gap-1.5 sm:flex">
                <Badge variant="muted" className="text-[10px]">
                  Products
                </Badge>
                <Badge variant="muted" className="text-[10px]">
                  Industries
                </Badge>
                <Badge variant="muted" className="text-[10px]">
                  Categories
                </Badge>
              </div>
            </div>

            <div
              className={cn(
                "max-h-[min(16rem,42vh)] overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-thin",
                isPending && "opacity-70"
              )}
            >
              {results.length === 0 && !isPending ? (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm font-medium text-[#0b1f3a]">
                    No results for &ldquo;{query.trim()}&rdquo;
                  </p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Try a product name, industry, or business category.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <Link
                      href="/products"
                      className="text-xs font-semibold text-primary hover:underline"
                      onClick={() => setOpen(false)}
                    >
                      Browse products
                    </Link>
                    <span className="text-muted-foreground">·</span>
                    <Link
                      href="/industries"
                      className="text-xs font-semibold text-primary hover:underline"
                      onClick={() => setOpen(false)}
                    >
                      Browse industries
                    </Link>
                  </div>
                </div>
              ) : (
                <ul className="space-y-0.5 p-2">
                  {results.map((r) => {
                    const meta = typeMeta[r.type];
                    const Icon = getIcon(r.icon) || meta.icon;
                    return (
                      <li key={r.id} role="option" aria-selected="false">
                        <Link
                          href={r.href}
                          onClick={() => setOpen(false)}
                          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-primary/[0.04] focus-visible:bg-primary/[0.04] focus-visible:outline-none"
                        >
                          <span
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                            style={{
                              backgroundColor: r.color ?? "#0549a4",
                            }}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-sm font-semibold text-[#0b1f3a] group-hover:text-primary">
                                {r.title}
                              </span>
                              <span
                                className={cn(
                                  "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                                  meta.badge
                                )}
                              >
                                {meta.label}
                              </span>
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                              {r.description}
                            </span>
                          </span>
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border bg-[#f8fafc] px-4 py-2.5 text-[11px] text-muted-foreground">
              <span className="hidden sm:inline">Click a result to open · Esc to close</span>
              <span className="sm:hidden">Tap a result · Esc to close</span>
              <Link
                href="/industries"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                Explore all
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );

  if (variant === "hero") {
    return <div className="mx-auto w-full max-w-2xl px-0">{inner}</div>;
  }

  return (
    <Section className="!py-8 md:!py-10 bg-white">
      <Container>{inner}</Container>
    </Section>
  );
}

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
import { hierarchyStats } from "@/lib/data/business-hierarchy";
import { products } from "@/lib/data/site";
import { searchSiteCatalog, type SiteSearchResult } from "@/lib/search";
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

const hints = ["Inventory", "Retail", "Pharmacy", "POS", "Restaurant", "Manufacturing"];

export function HomeCatalogSearch({
  variant = "section",
}: {
  variant?: "section" | "hero";
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const results = searchSiteCatalog(deferredQuery, 10);
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      <p className="mb-2 text-center text-xs text-muted-foreground">
        Search {products.length} products · {hierarchyStats.industries} industries ·{" "}
        {hierarchyStats.categories}+ categories
      </p>

      <div ref={wrapRef} className="relative mx-auto max-w-2xl">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)] transition-colors hover:border-border">
            <Search className="h-5 w-5 shrink-0 text-primary" />
            <input
              ref={inputRef}
              type="text"
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
              placeholder="Try Pharmacy, Inventory, Auto Parts..."
              aria-autocomplete="list"
              aria-controls={listId}
              aria-expanded={showPanel}
              autoComplete="off"
              className="h-14 w-full bg-transparent text-base text-[#0b1f3a] placeholder:text-muted-foreground outline-none ring-0 border-0 focus:outline-none focus:ring-0"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-[#0b1f3a]"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {!showPanel ? (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {hints.map((hint) => (
                <button
                  key={hint}
                  type="button"
                  onClick={() => {
                    setQuery(hint);
                    setOpen(true);
                    inputRef.current?.focus();
                  }}
                  className="rounded-full border border-border bg-slate-50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-white hover:text-primary"
                >
                  {hint}
                </button>
              ))}
            </div>
          ) : null}

          {showPanel ? (
            <div
              id={listId}
              role="listbox"
              className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-border bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)]"
            >
              <div className="flex items-center justify-between border-b border-border bg-slate-50/80 px-4 py-2.5">
                <p className="text-xs font-medium text-muted-foreground">
                  {results.length > 0
                    ? `${results.length} result${results.length === 1 ? "" : "s"}`
                    : "No matches"}
                </p>
                <div className="flex gap-1.5">
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

              <div className="max-h-[min(22rem,50vh)] overflow-y-auto overflow-x-hidden scrollbar-thin">
                {results.length === 0 ? (
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
                  <ul className="p-2 space-y-0.5">
                    {results.map((r) => {
                      const meta = typeMeta[r.type];
                      const Icon = getIcon(r.icon) || meta.icon;
                      return (
                        <li key={r.id} role="option">
                          <Link
                            href={r.href}
                            onClick={() => setOpen(false)}
                            className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-primary/[0.04]"
                          >
                            <span
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                              style={{
                                backgroundColor: r.color ?? "#2563eb",
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

              <div className="flex items-center justify-between border-t border-border bg-slate-50/80 px-4 py-2.5 text-[11px] text-muted-foreground">
                <span>Click a result to open · Esc to close</span>
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
    return <div className="mx-auto max-w-2xl">{inner}</div>;
  }

  return (
    <Section className="!py-8 md:!py-10 bg-white">
      <Container>{inner}</Container>
    </Section>
  );
}

"use client";

import { useMemo, useState, useDeferredValue } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, X } from "lucide-react";
import type { BlogPost } from "@/types";
import { AnimateIn } from "@/components/shared/animate-in";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 9;

export function BlogIndex({ posts }: { posts: BlogPost[] }) {
  const categories = useMemo(() => {
    const set = new Set(posts.map((p) => p.category));
    return ["All", ...Array.from(set).sort()];
  }, [posts]);

  const industries = useMemo(() => {
    const set = new Set(
      posts.map((p) => p.industry).filter((v): v is string => Boolean(v))
    );
    return Array.from(set).sort();
  }, [posts]);

  const [category, setCategory] = useState("All");
  const [industry, setIndustry] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return posts.filter((p) => {
      if (category !== "All" && p.category !== category) return false;
      if (industry && p.industry !== industry) return false;
      if (!q) return true;
      const hay = [
        p.title,
        p.excerpt,
        p.category,
        p.industry ?? "",
        p.author,
        ...(p.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [posts, category, industry, deferredQuery]);

  const featured =
    filtered.find((p) => p.featured) ?? filtered[0] ?? posts[0];
  const rest = filtered.filter((p) => p.id !== featured?.id);
  const totalPages = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = rest.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function resetFilters() {
    setCategory("All");
    setIndustry(null);
    setQuery("");
    setPage(1);
  }

  const hasFilters = category !== "All" || industry !== null || query.trim() !== "";

  return (
    <>
      <div className="mb-8 space-y-4">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search articles, industries, topics…"
            className="h-11 rounded-full border-border bg-white pl-10 pr-10 shadow-sm"
            aria-label="Search blog"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCategory(c);
                setPage(1);
              }}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                category === c
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-white text-muted-foreground hover:border-primary/30 hover:text-primary"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {industries.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground mr-1">
              Industry
            </span>
            <button
              type="button"
              onClick={() => {
                setIndustry(null);
                setPage(1);
              }}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                industry === null
                  ? "border-sky-600/30 bg-sky-50 text-sky-900"
                  : "border-border bg-white text-muted-foreground hover:text-primary"
              )}
            >
              All industries
            </button>
            {industries.map((ind) => (
              <button
                key={ind}
                type="button"
                onClick={() => {
                  setIndustry(ind);
                  setCategory("Industry");
                  setPage(1);
                }}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  industry === ind
                    ? "border-sky-600/30 bg-sky-50 text-sky-900"
                    : "border-border bg-white text-muted-foreground hover:text-primary"
                )}
              >
                {ind}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <p>
            {filtered.length} article{filtered.length === 1 ? "" : "s"}
            {hasFilters ? " matching filters" : ""}
          </p>
          {hasFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-medium text-primary hover:underline"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {featured ? (
        <AnimateIn>
          <Link href={`/blog/${featured.slug}`} className="group mb-10 block">
            <Card className="overflow-hidden transition-shadow hover:shadow-[0_16px_48px_rgba(15,23,42,0.08)]">
              <div className="grid lg:grid-cols-2">
                <div className="relative min-h-[220px] bg-muted">
                  <Image
                    src={featured.image}
                    alt={featured.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    quality={70}
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="p-8 md:p-10">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="muted">{featured.category}</Badge>
                    {featured.industry ? (
                      <Badge variant="outline">{featured.industry}</Badge>
                    ) : null}
                    <span>{featured.readTime}</span>
                    <span>·</span>
                    <span>{featured.date}</span>
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold tracking-tight text-balance transition-colors group-hover:text-primary md:text-3xl">
                    {featured.title}
                  </h2>
                  <p className="mt-3 leading-relaxed text-muted-foreground">
                    {featured.excerpt}
                  </p>
                  <p className="mt-6 text-sm font-medium text-primary">Read article →</p>
                </div>
              </div>
            </Card>
          </Link>
        </AnimateIn>
      ) : (
        <div className="mb-10 rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
          <p className="text-muted-foreground">No articles match your search.</p>
          <Button variant="outline" className="mt-4 rounded-full" onClick={resetFilters}>
            Reset filters
          </Button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {pageItems.map((post, i) => (
          <AnimateIn key={post.id} delay={i * 0.04}>
            <Link href={`/blog/${post.slug}`} className="group block h-full">
              <Card className="h-full overflow-hidden hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
                <div className="relative aspect-[16/10] bg-muted">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    quality={70}
                    className="object-cover"
                  />
                </div>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="muted">{post.category}</Badge>
                    {post.industry ? <Badge variant="outline">{post.industry}</Badge> : null}
                    <span>{post.readTime}</span>
                  </div>
                  <CardTitle className="mt-2 leading-snug transition-colors group-hover:text-primary">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
                  <p className="mt-4 text-xs text-muted-foreground">
                    {post.author} · {post.date}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </AnimateIn>
        ))}
      </div>

      {totalPages > 1 ? (
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Button
              key={n}
              size="sm"
              variant={n === safePage ? "default" : "outline"}
              onClick={() => setPage(n)}
            >
              {n}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      ) : null}
    </>
  );
}

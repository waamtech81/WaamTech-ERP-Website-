"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Boxes,
  CircleHelp,
  FileText,
  Search,
  Store,
  X,
} from "lucide-react";
import { products, industries, blogPosts, kbArticles, faqs } from "@/lib/data/site";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Result = { title: string; href: string; type: string };

const typeIcon: Record<string, typeof Search> = {
  Product: Boxes,
  Industry: Store,
  Blog: FileText,
  "Knowledge Base": BookOpen,
  FAQ: CircleHelp,
  Page: Search,
};

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [] as Result[];

    const items: Result[] = [
      ...products.map((p) => ({ title: p.name, href: `/products#${p.slug}`, type: "Product" })),
      ...industries.map((i) => ({ title: i.name, href: `/industries#${i.slug}`, type: "Industry" })),
      ...blogPosts.map((b) => ({ title: b.title, href: `/blog/${b.slug}`, type: "Blog" })),
      ...kbArticles.map((a) => ({ title: a.title, href: "/knowledge-base", type: "Knowledge Base" })),
      ...faqs.map((f) => ({ title: f.question, href: "/faqs", type: "FAQ" })),
      { title: "Pricing", href: "/pricing", type: "Page" },
      { title: "Documentation", href: "/docs", type: "Page" },
      { title: "Support", href: "/support", type: "Page" },
      { title: "Contact", href: "/contact", type: "Page" },
      { title: "Mobile App", href: "/mobile-app", type: "Page" },
    ];

    return items.filter((i) => i.title.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-900/40 px-4 pt-[10vh] sm:pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Site search"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4.5 w-4.5 shrink-0 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, industries, docs..."
            className="border-0 shadow-none focus-visible:ring-0 h-14 px-0 text-base"
          />
          <kbd className="hidden sm:inline-flex items-center rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Esc
          </kbd>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close search">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="max-h-[min(22rem,50vh)] overflow-auto p-2">
          {query.trim().length < 2 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-sm font-medium text-[#0b1f3a]">Search WAAMTO</p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Type at least 2 characters to find modules, industries, and docs.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {["Inventory", "POS", "Pricing", "Retail"].map((hint) => (
                  <button
                    key={hint}
                    type="button"
                    onClick={() => setQuery(hint)}
                    className="rounded-full border border-border bg-muted/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <p className="px-3 py-8 text-sm text-muted-foreground text-center">
              No results for &ldquo;{query.trim()}&rdquo;.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {results.map((r) => {
                const Icon = typeIcon[r.type] || Search;
                return (
                  <li key={`${r.type}-${r.title}`}>
                    <Link
                      href={r.href}
                      onClick={onClose}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors",
                        "hover:bg-primary/[0.05]"
                      )}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {r.title}
                        </span>
                        <span className="text-xs text-muted-foreground">{r.type}</span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-slate-50/80 px-4 py-2.5 text-[11px] text-muted-foreground">
          <span>Navigate with results · Enter to open</span>
          <span className="hidden sm:inline">Ctrl / ⌘ + K</span>
        </div>
      </div>
    </div>
  );
}

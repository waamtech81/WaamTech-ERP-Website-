"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { products, industries, blogPosts, kbArticles, faqs } from "@/lib/data/site";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Result = { title: string; href: string; type: string };

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
    ];

    return items.filter((i) => i.title.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-900/30 px-4 pt-[12vh] backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-white shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, docs, FAQs..."
            className="border-0 shadow-none focus-visible:ring-0 h-14 px-0"
          />
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close search">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="max-h-80 overflow-auto p-2">
          {query.trim().length < 2 ? (
            <p className="px-3 py-6 text-sm text-muted-foreground text-center">
              Type at least 2 characters to search.
            </p>
          ) : results.length === 0 ? (
            <p className="px-3 py-6 text-sm text-muted-foreground text-center">No results found.</p>
          ) : (
            <ul className="space-y-1">
              {results.map((r) => (
                <li key={`${r.type}-${r.title}`}>
                  <Link
                    href={r.href}
                    onClick={onClose}
                    className="flex items-center justify-between rounded-xl px-3 py-3 text-sm hover:bg-muted transition-colors"
                  >
                    <span className="font-medium text-foreground">{r.title}</span>
                    <span className="text-xs text-muted-foreground">{r.type}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

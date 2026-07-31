"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { siteConfig } from "@/lib/data/site";
import { coreModules } from "@/lib/data/core";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Container, Section } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ModuleShowcase() {
  const [productIndex, setProductIndex] = useState(0);

  const activeModule = coreModules[productIndex] ?? coreModules[0];
  const ProductIcon = getIcon(activeModule.icon);

  return (
    <Section className="!pt-8 md:!pt-12 bg-white">
      <Container>
        <div className="mx-auto mb-10 md:mb-12 max-w-2xl text-center">
          <p className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            Modules
          </p>
          <h2 className="font-heading text-section font-semibold tracking-tight text-[#0b1220] text-balance">
            One solution to manage everything, in one place
          </h2>
          <p className="mt-4 font-sans text-description font-normal text-muted-foreground leading-relaxed text-pretty">
            Switch across {siteConfig.name} modules — Inventory, POS, Sales, Finance, CRM, HR,
            Manufacturing, and AI — the same clean interface for every workflow.
          </p>
        </div>

        <div className="mb-8 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none justify-start lg:justify-center">
          {coreModules.map((m, i) => {
            const TabIcon = getIcon(m.icon);
            const selected = i === productIndex;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setProductIndex(i)}
                className={cn(
                  "group flex min-w-[84px] flex-col items-center gap-2 rounded-xl px-2.5 py-2.5 transition-colors duration-200",
                  selected ? "bg-muted" : "hover:bg-muted/70"
                )}
              >
                <span
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full border transition-[background-color,border-color,color,box-shadow] duration-200",
                    selected
                      ? "border-primary bg-primary text-white shadow-[var(--shadow-sm)]"
                      : "border-border bg-white text-muted-foreground group-hover:border-primary/30 group-hover:text-primary"
                  )}
                >
                  <TabIcon className="h-[18px] w-[18px]" />
                </span>
                <span
                  className={cn(
                    "text-[11px] font-medium whitespace-nowrap",
                    selected ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {m.short}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative overflow-hidden rounded-xl border border-border bg-white shadow-[var(--shadow-md)]">
          <div key={activeModule.id} className="grid lg:grid-cols-[1fr_1.35fr]">
            <div className="border-b lg:border-b-0 lg:border-r border-border p-6 md:p-8">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/[0.08] text-primary ring-1 ring-primary/10">
                <ProductIcon className="h-[18px] w-[18px]" />
              </div>
              <h3 className="font-heading text-h3 font-semibold tracking-tight text-[#0b1220]">
                {activeModule.name}
              </h3>
              <p className="mt-2 text-sm font-medium text-primary">{activeModule.tagline}</p>
              <p className="mt-4 text-[0.9375rem] text-muted-foreground leading-relaxed text-pretty">
                {activeModule.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {activeModule.highlights.map((h) => (
                  <Badge key={h} variant="muted">
                    {h}
                  </Badge>
                ))}
              </div>
              <Button asChild variant="link" className="mt-5 px-0">
                <Link href={`/products#${activeModule.id}`}>
                  Explore module <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="bg-[var(--surface-subtle)] p-5 md:p-7">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold tracking-tight text-[#0b1220]">
                  {activeModule.preview.title}
                </p>
                <Badge variant="accent">Live preview</Badge>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {activeModule.preview.kpis.map((kpi) => (
                  <div
                    key={kpi.label}
                    className="rounded-lg border border-border bg-white p-3 shadow-[var(--shadow-xs)]"
                  >
                    <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                      {kpi.label}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-[15px] font-semibold tracking-tight tabular-nums",
                        kpi.tone === "good" && "text-emerald-700",
                        kpi.tone === "warn" && "text-amber-700",
                        kpi.tone === "bad" && "text-rose-600",
                        kpi.tone === "neutral" && "text-[#0b1220]"
                      )}
                    >
                      {kpi.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="overflow-hidden rounded-lg border border-border bg-white">
                {activeModule.preview.rows.map((row) => (
                  <div
                    key={row.ref}
                    className="flex items-center justify-between gap-3 border-b border-border last:border-0 px-4 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[#0b1220] truncate">{row.name}</p>
                      <p className="text-xs text-muted-foreground">{row.ref}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-medium tabular-nums">{row.qty}</p>
                      <p className="text-xs text-muted-foreground">{row.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

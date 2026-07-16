"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { coreModules } from "@/lib/data/core";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Container, Section } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";

export function ModuleShowcase() {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const module = coreModules[active];
  const Icon = getIcon(module.icon);

  return (
    <Section className="!pt-8 md:!pt-12 bg-white">
      <Container>
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <h2 className="font-[family-name:var(--font-poppins)] text-3xl md:text-4xl font-semibold tracking-tight text-[#0b1f3a] text-balance">
            One solution to manage everything, in one place
          </h2>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
            Switch across the modules from our SaaS Core — the same clean interface, tailored to each workflow.
          </p>
        </div>

        <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-none justify-start md:justify-center">
          {coreModules.map((m, i) => {
            const TabIcon = getIcon(m.icon);
            const selected = i === active;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActive(i)}
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

        <div className="relative">
          <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-b from-sky-50 via-blue-50/40 to-transparent" />
          <AnimatePresence mode="wait">
            <motion.div
              key={module.id}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.1)]"
            >
              <div className="grid lg:grid-cols-[1fr_1.35fr]">
                <div className="border-b lg:border-b-0 lg:border-r border-border p-6 md:p-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-2xl font-semibold tracking-tight text-[#0b1f3a]">{module.name}</h3>
                  <p className="mt-2 text-sm font-medium text-primary">{module.tagline}</p>
                  <p className="mt-4 text-muted-foreground leading-relaxed">{module.description}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {module.highlights.map((h) => (
                      <Badge key={h} variant="muted">
                        {h}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="bg-[#f4f7fb] p-5 md:p-7">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#0b1f3a]">{module.preview.title}</p>
                    <Badge variant="accent">Live preview</Badge>
                  </div>
                  <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {module.preview.kpis.map((kpi) => (
                      <div key={kpi.label} className="rounded-xl border border-border bg-white p-3 shadow-sm">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
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
            </motion.div>
          </AnimatePresence>
        </div>
      </Container>
    </Section>
  );
}

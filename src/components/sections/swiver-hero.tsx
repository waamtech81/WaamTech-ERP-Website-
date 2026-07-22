"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/section";
import { HomeCatalogSearch } from "@/components/sections/home-catalog-search";
import { authConfig } from "@/lib/auth/config";
import { siteConfig } from "@/lib/data/site";

export function SwiverHero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(37,99,235,0.09),transparent_70%)]" />
      <Container className="relative pt-16 pb-8 md:pt-24 md:pb-12 text-center">
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-3 font-heading text-hero font-bold tracking-tight text-[#0b1f3a]"
        >
          {siteConfig.name}
        </motion.p>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.04 }}
          className="mb-6 font-sans text-sm md:text-base font-medium tracking-wide text-primary"
        >
          {siteConfig.productLine} by {siteConfig.companyName}
        </motion.p>

        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="mx-auto max-w-4xl font-heading text-h2 font-semibold tracking-tight text-[#0b1f3a]/90 text-balance leading-[1.2]"
        >
          Control your business. Optimize operations. Unlock growth.
        </motion.h1>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="mx-auto mt-5 max-w-2xl font-sans text-description font-normal text-muted-foreground leading-relaxed"
        >
          One modular platform for Inventory, POS, Sales, Purchasing, Finance, CRM, HR, Manufacturing,
          and built-in AI — configured for your industry in minutes.
        </motion.p>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-7"
        >
          <HomeCatalogSearch variant="hero" />
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Button asChild size="xl" className="rounded-full px-8 shadow-sm shadow-primary/20">
            <Link href="/signup">
              Start {authConfig.trialDays}-day free trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="xl" className="rounded-full px-8 border-primary/25 text-primary hover:bg-primary/5">
            <Link href="/products">
              Explore modules
              <Play className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.24 }}
          className="mx-auto mt-6 max-w-full overflow-x-auto"
        >
          <p className="whitespace-nowrap font-heading text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tight leading-snug">
            <span className="text-[#0b1f3a]">No card. No payment.</span>{" "}
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              {authConfig.trialDays}-day free trial signup
            </span>
            <span className="text-[#0b1f3a]"> — start instantly</span>
          </p>
        </motion.div>
      </Container>

      <Container className="relative pb-6 md:pb-10">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 36, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto max-w-5xl"
        >
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-2xl" />
          <div className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
            <ProductShell />
          </div>

          <motion.div
            initial={reduce ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-5 flex justify-end"
          >
            <div className="inline-flex items-center gap-3 rounded-full border border-border bg-white/90 px-4 py-2 shadow-sm backdrop-blur">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                WT
              </span>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{siteConfig.name}</span> powers 17 industries & 100+ business categories
              </p>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}

function ProductShell() {
  return (
    <div className="grid md:grid-cols-[200px_1fr] min-h-[320px] md:min-h-[420px]">
      <aside className="hidden md:flex flex-col gap-1 bg-[#0b1f3a] p-4 text-white">
        <div className="mb-4 flex items-center gap-2 px-2 py-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold">W</span>
          <span className="text-sm font-semibold tracking-tight">{siteConfig.name}</span>
        </div>
        {["Dashboard", "Sales", "Inventory", "POS", "Purchasing", "Finance", "CRM", "HR", "Reports"].map((item, i) => (
          <div
            key={item}
            className={`rounded-lg px-3 py-2 text-sm ${i === 1 ? "bg-white/15 text-white" : "text-white/65 hover:bg-white/5"}`}
          >
            {item}
          </div>
        ))}
      </aside>

      <div className="bg-[#f4f7fb] p-4 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Sales · Invoices</p>
            <h3 className="text-lg font-semibold text-[#0b1f3a]">Company workspace</h3>
          </div>
          <div className="flex gap-2">
            <span className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground">
              Export
            </span>
            <span className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white">
              + New document
            </span>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total", value: "₨ 2.41M", color: "text-[#0b1f3a]" },
            { label: "Paid", value: "₨ 1.92M", color: "text-emerald-600" },
            { label: "Due", value: "₨ 410K", color: "text-amber-600" },
            { label: "Overdue", value: "₨ 92K", color: "text-rose-600" },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-border bg-white p-3.5 shadow-sm">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
              <p className={`mt-1 text-lg font-semibold tracking-tight ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          <div className="grid grid-cols-12 gap-2 border-b border-border bg-slate-50 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <span className="col-span-3">Reference</span>
            <span className="col-span-4">Customer</span>
            <span className="col-span-2">Amount</span>
            <span className="col-span-3">Status</span>
          </div>
          {[
            { ref: "INV-24081", customer: "Northline Retail", amount: "₨ 128,000", status: "Paid", tone: "bg-emerald-50 text-emerald-700" },
            { ref: "INV-24082", customer: "Cedar Traders", amount: "₨ 64,500", status: "Due", tone: "bg-amber-50 text-amber-700" },
            { ref: "INV-24070", customer: "Harbor Distribution", amount: "₨ 91,200", status: "Overdue", tone: "bg-rose-50 text-rose-700" },
            { ref: "INV-24085", customer: "City Mart", amount: "₨ 47,800", status: "Paid", tone: "bg-emerald-50 text-emerald-700" },
          ].map((row) => (
            <div key={row.ref} className="grid grid-cols-12 gap-2 border-b border-border last:border-0 px-4 py-3 text-sm">
              <span className="col-span-3 font-medium text-[#0b1f3a]">{row.ref}</span>
              <span className="col-span-4 text-muted-foreground truncate">{row.customer}</span>
              <span className="col-span-2 font-medium">{row.amount}</span>
              <span className="col-span-3">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${row.tone}`}>
                  {row.status}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

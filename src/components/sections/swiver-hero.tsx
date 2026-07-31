import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/section";
import { HomeCatalogSearch } from "@/components/sections/home-catalog-search";
import { authConfig } from "@/lib/auth/config";
import { siteConfig } from "@/lib/data/site";

export function SwiverHero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" />
      <Container className="relative pt-14 pb-10 md:pt-20 md:pb-14 text-center">
        <p className="wt-fade-up mb-3 font-heading text-hero font-bold tracking-tight text-[#0b1220] leading-[1.05]">
          {siteConfig.name}
        </p>

        <p className="wt-fade-up wt-fade-up-delay-1 mb-6 font-sans text-sm md:text-[0.9375rem] font-medium tracking-wide text-primary">
          {siteConfig.productLine} by {siteConfig.companyName}
        </p>

        <h1 className="wt-fade-up wt-fade-up-delay-1 mx-auto max-w-3xl font-heading text-h2 font-semibold tracking-tight text-[#0b1220]/90 text-balance leading-[1.2]">
          Control your business. Optimize operations. Unlock growth.
        </h1>
        <p className="wt-fade-up wt-fade-up-delay-2 mx-auto mt-4 max-w-2xl font-heading text-base md:text-lg font-semibold tracking-tight text-balance leading-snug text-[#0b1220]/80">
          <Link
            href="/build-your-own-erp"
            className="text-primary underline-offset-4 transition-colors hover:text-[var(--brand-dark)] hover:underline"
          >
            Design your own ERP
          </Link>{" "}
          at runtime or launch instantly with a pre-built industry solution.
        </p>

        <p className="wt-fade-up wt-fade-up-delay-2 mx-auto mt-4 max-w-xl font-sans text-[0.9375rem] font-normal text-muted-foreground leading-relaxed text-pretty">
          One modular platform for Inventory, POS, Sales, Purchasing, Finance, CRM, HR, Manufacturing,
          and built-in AI — configured for your industry in minutes.
        </p>

        <div className="wt-fade-up wt-fade-up-delay-3 mt-8">
          <HomeCatalogSearch variant="hero" />
        </div>

        <div className="wt-fade-up wt-fade-up-delay-3 mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="xl" className="min-w-[240px] rounded-full px-8 shadow-[var(--shadow-sm)]">
            <Link href="/signup">
              Start {authConfig.trialDays}-day free trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="xl"
            className="min-w-[200px] rounded-full px-8 border-border text-foreground/80 hover:border-primary/30 hover:text-primary"
          >
            <Link href="/products">
              Explore modules
              <Play className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="mx-auto mt-8 max-w-md px-2 text-center">
          <p className="font-heading text-base sm:text-lg font-semibold tracking-tight leading-snug text-[#0b1220]">
            <span className="block sm:inline">No card. No payment.</span>{" "}
            <span className="block sm:inline text-primary">
              {authConfig.trialDays}-day free trial signup
            </span>
          </p>
          <p className="mt-1.5 font-sans text-sm font-medium tracking-tight text-muted-foreground">
            — start instantly
          </p>
        </div>
      </Container>

      <Container className="relative pb-10 md:pb-16">
        <div className="relative mx-auto max-w-5xl">
          <div className="pointer-events-none absolute -inset-x-6 -inset-y-4 rounded-[2rem] bg-primary/[0.04] blur-2xl" />
          <div className="relative overflow-hidden rounded-xl md:rounded-2xl border border-border bg-white shadow-[var(--shadow-lg)] ring-1 ring-black/[0.03]">
            <ProductShell />
          </div>

          <div className="mt-6 flex justify-center md:justify-end">
            <div className="inline-flex max-w-full items-center gap-3 rounded-full border border-border bg-white/95 px-4 py-2.5 shadow-[var(--shadow-xs)] backdrop-blur-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-primary/10">
                WT
              </span>
              <p className="text-left text-sm text-muted-foreground leading-snug">
                <span className="font-medium text-foreground">{siteConfig.name}</span> powers 17 industries & 100+ business categories
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function ProductShell() {
  return (
    <div className="grid md:grid-cols-[200px_1fr] min-h-[320px] md:min-h-[420px]">
      <aside className="hidden md:flex flex-col gap-0.5 bg-[#0b1220] p-4 text-white">
        <div className="mb-5 flex items-center gap-2.5 px-2 py-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold">W</span>
          <span className="text-sm font-semibold tracking-tight">{siteConfig.name}</span>
        </div>
        {["Dashboard", "Sales", "Inventory", "POS", "Purchasing", "Finance", "CRM", "HR", "Reports"].map((item, i) => (
          <div
            key={item}
            className={`rounded-md px-3 py-2 text-[13px] transition-colors ${
              i === 1 ? "bg-white/12 text-white" : "text-white/55"
            }`}
          >
            {item}
          </div>
        ))}
      </aside>

      <div className="bg-[#f6f8fb] p-4 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Sales · Invoices</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#0b1220]">Company workspace</h2>
          </div>
          <div className="flex gap-2">
            <span className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-[var(--shadow-xs)]">
              Export
            </span>
            <span className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white shadow-[var(--shadow-xs)]">
              + New document
            </span>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total", value: "₨ 2.41M", color: "text-[#0b1220]" },
            { label: "Paid", value: "₨ 1.92M", color: "text-emerald-700" },
            { label: "Due", value: "₨ 410K", color: "text-amber-700" },
            { label: "Overdue", value: "₨ 92K", color: "text-rose-600" },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-lg border border-border bg-white p-3.5 shadow-[var(--shadow-xs)]">
              <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">{kpi.label}</p>
              <p className={`mt-1.5 text-lg font-semibold tracking-tight ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-white shadow-[var(--shadow-xs)]">
          <div className="grid grid-cols-12 gap-2 border-b border-border bg-[#f6f8fb] px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
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
              <span className="col-span-3 font-medium text-[#0b1220]">{row.ref}</span>
              <span className="col-span-4 text-muted-foreground truncate">{row.customer}</span>
              <span className="col-span-2 font-medium tabular-nums">{row.amount}</span>
              <span className="col-span-3">
                <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${row.tone}`}>
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

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/section";
import { HomeCatalogSearch } from "@/components/sections/home-catalog-search";
import { authConfig } from "@/lib/auth/config";
import { siteConfig } from "@/lib/data/site";

export function SwiverHero() {
  return (
    <section className="relative overflow-hidden bg-white" aria-labelledby="home-hero-heading">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(37,99,235,0.09),transparent_70%)]"
        aria-hidden
      />
      <Container className="relative pt-14 pb-6 md:pt-20 md:pb-10 text-center">
        <p className="mb-1 font-heading text-hero font-bold tracking-tight text-[#0b1f3a] leading-none">
          {siteConfig.name}
        </p>
        <p className="mb-5 font-sans text-sm md:text-base font-medium tracking-wide text-primary leading-tight">
          {siteConfig.productLine} by {siteConfig.companyName}
        </p>

        <h1
          id="home-hero-heading"
          className="mx-auto max-w-4xl font-heading text-h2 font-semibold tracking-tight text-[#0b1f3a] text-balance leading-[1.2]"
        >
          Control your business. Optimize operations. Unlock growth.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl font-sans text-base md:text-lg font-normal text-muted-foreground leading-relaxed text-pretty">
          Modular ERP for inventory, POS, sales, finance, CRM, and AI — launch with an industry
          profile or{" "}
          <Link
            href="/build-your-own-erp"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            design your own package
          </Link>
          .
        </p>

        <div className="mt-7">
          <HomeCatalogSearch variant="hero" />
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="xl" className="rounded-full px-8 shadow-sm shadow-primary/20">
            <Link href="/signup">
              Start {authConfig.trialDays}-day free trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="xl"
            className="rounded-full px-8 border-primary/25 text-primary hover:bg-primary/5"
          >
            <Link href="/products">
              Explore modules
              <Play className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <nav className="journey-chip-row mt-6" aria-label="Popular next steps">
          <Link href="/pricing" className="journey-chip">
            View plans
          </Link>
          <Link href="/industries" className="journey-chip">
            Browse industries
          </Link>
          <Link href="/build-your-own-erp" className="journey-chip">
            Build your own ERP
          </Link>
          <Link href="/login" className="journey-chip">
            Customer Portal
          </Link>
        </nav>

        <p className="mx-auto mt-5 max-w-md font-sans text-sm text-muted-foreground">
          No card required · {authConfig.trialDays}-day free trial · Start instantly
        </p>
      </Container>

      <Container className="relative pb-6 md:pb-10">
        <div className="relative mx-auto max-w-5xl">
          <div
            className="absolute -inset-4 rounded-[2rem] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-2xl"
            aria-hidden
          />
          <div className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
            <ProductShell />
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Live industry and business category catalog — configured for how you operate.
          </p>
        </div>
      </Container>
    </section>
  );
}

function ProductShell() {
  return (
    <div
      className="grid md:grid-cols-[200px_1fr] min-h-[320px] md:min-h-[420px]"
      role="img"
      aria-label={`${siteConfig.name} product workspace preview showing sales invoices dashboard`}
    >
      <aside className="hidden md:flex flex-col gap-1 bg-[#0b1f3a] p-4 text-white" aria-hidden>
        <div className="mb-4 flex items-center gap-2 px-2 py-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold">
            W
          </span>
          <span className="text-sm font-semibold tracking-tight">{siteConfig.name}</span>
        </div>
        {["Dashboard", "Sales", "Inventory", "POS", "Purchasing", "Finance", "CRM", "HR", "Reports"].map(
          (item, i) => (
            <div
              key={item}
              className={`rounded-lg px-3 py-2 text-sm ${
                i === 1 ? "bg-white/15 text-white" : "text-white/65"
              }`}
            >
              {item}
            </div>
          )
        )}
      </aside>

      <div className="bg-[#f4f7fb] p-4 md:p-6" aria-hidden>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Sales · Invoices</p>
            <p className="text-lg font-semibold text-[#0b1f3a]">Company workspace</p>
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
            { label: "Paid", value: "₨ 1.92M", color: "text-emerald-700" },
            { label: "Due", value: "₨ 410K", color: "text-amber-700" },
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
            {
              ref: "INV-24081",
              customer: "Northline Retail",
              amount: "₨ 128,000",
              status: "Paid",
              tone: "bg-emerald-50 text-emerald-700",
            },
            {
              ref: "INV-24082",
              customer: "Cedar Traders",
              amount: "₨ 64,500",
              status: "Due",
              tone: "bg-amber-50 text-amber-700",
            },
            {
              ref: "INV-24070",
              customer: "Harbor Distribution",
              amount: "₨ 91,200",
              status: "Overdue",
              tone: "bg-rose-50 text-rose-700",
            },
            {
              ref: "INV-24085",
              customer: "City Mart",
              amount: "₨ 47,800",
              status: "Paid",
              tone: "bg-emerald-50 text-emerald-700",
            },
          ].map((row) => (
            <div
              key={row.ref}
              className="grid grid-cols-12 gap-2 border-b border-border last:border-0 px-4 py-3 text-sm"
            >
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

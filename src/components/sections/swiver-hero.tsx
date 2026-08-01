import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/section";
import { HomeCatalogSearch } from "@/components/sections/home-catalog-search";
import { authConfig } from "@/lib/auth/config";
import { siteConfig } from "@/lib/data/site";
import { cn } from "@/lib/utils";

export function SwiverHero() {
  return (
    <section
      className="relative overflow-hidden bg-[linear-gradient(180deg,#f7fafc_0%,#ffffff_42%,#ffffff_100%)]"
      aria-labelledby="home-hero-heading"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(ellipse_70%_55%_at_50%_-8%,rgba(5,73,164,0.11),transparent_68%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-[0.35] [background-image:linear-gradient(rgba(11,31,58,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(11,31,58,0.035)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(180deg,black,transparent)]"
        aria-hidden
      />
      <Container className="relative pt-11 pb-4 md:pt-14 md:pb-6 text-center">
        <p className="mb-1 font-heading text-hero font-bold tracking-tight text-[#0b1f3a] leading-none">
          {siteConfig.name}
        </p>
        <p className="mb-3.5 font-sans text-xs md:text-sm font-semibold tracking-[0.12em] text-primary uppercase leading-tight">
          {siteConfig.productLine}
        </p>

        <h1
          id="home-hero-heading"
          className="mx-auto max-w-4xl font-heading text-[1.65rem] font-semibold tracking-tight text-[#0b1f3a] text-balance leading-[1.2] sm:text-4xl md:text-[2.75rem] md:leading-[1.15] lg:text-5xl"
        >
          Control your business. Optimize operations. Unlock growth.
        </h1>
        <p className="mx-auto mt-3 max-w-[22rem] font-sans text-sm font-normal leading-snug text-muted-foreground sm:max-w-xl sm:text-base md:max-w-2xl md:leading-relaxed">
          One secure cloud workspace for inventory, POS, sales, finance, and CRM —
          <br />
          start from your industry or{" "}
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

        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
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
            className="rounded-full px-8 border-[#0b1f3a]/15 text-[#0b1f3a] hover:bg-[#0b1f3a]/[0.03]"
          >
            <Link href="/products">
              Explore modules
              <Play className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <nav className="journey-chip-row mt-5" aria-label="Popular next steps">
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

        <p className="mx-auto mt-3.5 max-w-md font-sans text-sm text-muted-foreground">
          No card required · {authConfig.trialDays}-day free trial · Start instantly
        </p>
      </Container>

      <Container className="relative pb-8 md:pb-12">
        <div className="relative mx-auto max-w-5xl">
          <div
            className="absolute -inset-3 rounded-[1.75rem] bg-gradient-to-b from-primary/12 via-sky-100/40 to-transparent blur-xl md:-inset-5 md:rounded-[2rem]"
            aria-hidden
          />
          <div className="relative overflow-hidden rounded-2xl border border-[#0b1f3a]/10 bg-white shadow-[0_28px_90px_rgba(11,31,58,0.14)] md:rounded-[1.75rem]">
            <div className="flex items-center gap-1.5 border-b border-slate-200/80 bg-[#0b1f3a] px-3.5 py-2.5">
              <span className="h-2 w-2 rounded-full bg-white/25" aria-hidden />
              <span className="h-2 w-2 rounded-full bg-white/25" aria-hidden />
              <span className="h-2 w-2 rounded-full bg-white/25" aria-hidden />
              <span className="ml-2 text-[11px] font-medium tracking-wide text-white/55">
                {siteConfig.name} workspace
              </span>
            </div>
            <ProductShell />
          </div>
          <p className="mt-3.5 text-center text-sm text-muted-foreground">
            Live catalog of industries and business types — configured for how you operate.
          </p>
        </div>
      </Container>
    </section>
  );
}

const workspaceNav = [
  { label: "Dashboard", href: "/products", panel: "dashboard" },
  { label: "Sales", href: "/products#sales", panel: "sales" },
  { label: "Inventory", href: "/products#inventory", panel: "inventory" },
  { label: "POS", href: "/products#pos", panel: "pos" },
  { label: "Purchasing", href: "/products#purchasing", panel: "purchasing" },
  { label: "Finance", href: "/products#finance", panel: "finance" },
  { label: "CRM", href: "/products#crm", panel: "crm" },
  { label: "HR", href: "/products#hr", panel: "hr" },
  { label: "Reports", href: "/erp-features", panel: "reports" },
] as const;

function ProductShell() {
  return (
    <div className="grid min-h-[320px] md:min-h-[420px] md:grid-cols-[200px_1fr]">
      <aside className="hidden md:flex flex-col gap-1 bg-[#0b1f3a] p-4 text-white">
        <Link
          href="/"
          className="mb-4 flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-white/10"
          aria-label={`${siteConfig.name} home`}
        >
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
            <Image
              src={siteConfig.logo}
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
          </span>
          <span className="text-sm font-semibold tracking-tight">{siteConfig.name}</span>
        </Link>
        <nav aria-label={`${siteConfig.name} workspace modules`} className="flex flex-col gap-0.5">
          {workspaceNav.map((item, i) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm transition-colors",
                i === 1
                  ? "bg-white/15 font-medium text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="bg-[#f4f7fb] p-4 md:p-6">
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

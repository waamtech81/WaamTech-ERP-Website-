import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Calculator,
  ClipboardList,
  Factory,
  ShoppingCart,
  Users,
  Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/section";
import { HomeCatalogSearch } from "@/components/sections/home-catalog-search";
import { authConfig } from "@/lib/auth/config";
import { siteConfig } from "@/lib/data/site";

const floatModules = [
  { label: "Sales", Icon: ShoppingCart, className: "left-[-0.5rem] top-[12%] md:left-[-1.25rem]" },
  { label: "Inventory", Icon: Warehouse, className: "right-[-0.25rem] top-[8%] md:right-[-1rem]" },
  { label: "Finance", Icon: Calculator, className: "left-[-0.75rem] top-[48%] md:left-[-1.5rem]" },
  { label: "CRM", Icon: Users, className: "right-[-0.5rem] top-[42%] md:right-[-1.25rem]" },
  { label: "POS", Icon: Boxes, className: "left-[8%] bottom-[-0.75rem] md:bottom-[-1rem]" },
  { label: "Ops", Icon: Factory, className: "right-[10%] bottom-[-0.5rem] md:bottom-[-0.85rem]" },
  { label: "HR", Icon: ClipboardList, className: "left-[42%] top-[-0.85rem] hidden sm:flex" },
];

export function SwiverHero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_85%_15%,rgba(29,191,115,0.08),transparent_50%),radial-gradient(ellipse_50%_40%_at_10%_80%,rgba(5,73,164,0.06),transparent_55%)]" />

      <Container className="relative py-12 md:py-16 lg:py-[4.5rem]">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-10 xl:gap-14">
          {/* Copy — Enerpize-inspired hierarchy, WAAMTO content */}
          <div className="max-w-xl">
            <p className="wt-fade-up font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-primary">
              {siteConfig.name} · {siteConfig.productLine}
            </p>

            <h1 className="wt-fade-up wt-fade-up-delay-1 mt-5 font-heading text-[clamp(2.35rem,1.35rem+3.8vw,3.75rem)] font-extrabold tracking-tight text-[#213242] leading-[1.05] text-balance">
              Control your business.
              <span className="block">Optimize operations.</span>
              <span className="block text-primary">Unlock growth.</span>
            </h1>

            <p className="wt-fade-up wt-fade-up-delay-2 mt-6 max-w-md font-sans text-[1.0625rem] text-[#5a6b7a] leading-relaxed text-pretty">
              One modular platform for Inventory, POS, Sales, Purchasing, Finance, CRM, HR,
              Manufacturing, and built-in AI — configured for your industry in minutes.{" "}
              <Link
                href="/build-your-own-erp"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                Design your own ERP
              </Link>{" "}
              or launch with a pre-built industry solution.
            </p>

            <div className="wt-fade-up wt-fade-up-delay-3 mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
              <Button
                asChild
                size="lg"
                variant="accent"
                className="h-[3.25rem] rounded-lg px-8 text-[0.9375rem] font-semibold shadow-[var(--shadow-sm)]"
              >
                <Link href="/signup">
                  Start {authConfig.trialDays}-day free trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-1.5 px-2 py-2 text-sm font-semibold text-[#213242] hover:text-primary transition-colors"
              >
                Explore modules
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-medium text-[#5a6b7a]">
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                No card required
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                {authConfig.trialDays}-day free trial
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Start instantly
              </li>
            </ul>

            <div className="mt-8 max-w-md">
              <HomeCatalogSearch variant="hero" />
            </div>
          </div>

          {/* Product visual with floating module chips */}
          <div className="wt-fade-up wt-fade-up-delay-2 relative w-full lg:justify-self-end">
            <div className="relative mx-auto max-w-[560px] lg:max-w-none px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
              {floatModules.map(({ label, Icon, className }) => (
                <div
                  key={label}
                  className={`pointer-events-none absolute z-10 hidden sm:flex items-center gap-2 rounded-full border border-border bg-white px-2.5 py-1.5 shadow-[var(--shadow-sm)] ${className}`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="pr-1 text-[11px] font-semibold text-[#213242]">{label}</span>
                </div>
              ))}

              <div className="relative overflow-hidden rounded-xl border border-border bg-[#213242] shadow-[var(--shadow-lg)]">
                <div className="flex items-center gap-2 border-b border-white/10 px-3.5 py-2">
                  <span className="h-2 w-2 rounded-full bg-white/25" />
                  <span className="h-2 w-2 rounded-full bg-white/25" />
                  <span className="h-2 w-2 rounded-full bg-white/25" />
                  <span className="ml-2 text-[11px] font-medium text-white/40">app.waamto.com</span>
                </div>
                <div className="bg-white">
                  <ProductShell />
                </div>
              </div>
            </div>

            <p className="mt-2 text-center text-sm text-[#5a6b7a]">
              <span className="font-semibold text-[#213242]">{siteConfig.name}</span> powers 17
              industries & 100+ business categories
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

function ProductShell() {
  return (
    <div className="grid sm:grid-cols-[152px_1fr] min-h-[260px] sm:min-h-[340px]">
      <aside className="hidden sm:flex flex-col gap-0.5 bg-[#213242] p-2.5 text-white">
        <div className="mb-2.5 flex items-center gap-2 px-2 py-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-[10px] font-bold">
            W
          </span>
          <span className="text-[12px] font-semibold tracking-tight">{siteConfig.name}</span>
        </div>
        {["Dashboard", "Sales", "Inventory", "POS", "Purchasing", "Finance", "CRM", "HR"].map(
          (item, i) => (
            <div
              key={item}
              className={`rounded-md px-2.5 py-1.5 text-[12px] ${
                i === 1 ? "bg-white/12 text-white" : "text-white/45"
              }`}
            >
              {item}
            </div>
          )
        )}
      </aside>

      <div className="bg-[#f4f7fa] p-3 sm:p-3.5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5a6b7a]">
              Sales · Invoices
            </p>
            <p className="mt-0.5 text-sm font-semibold tracking-tight text-[#213242]">
              Company workspace
            </p>
          </div>
          <span className="rounded-md bg-accent px-2.5 py-1 text-[11px] font-semibold text-white">
            + New document
          </span>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {[
            { label: "Total", value: "₨ 2.41M", color: "text-[#213242]" },
            { label: "Paid", value: "₨ 1.92M", color: "text-emerald-700" },
            { label: "Due", value: "₨ 410K", color: "text-amber-700" },
            { label: "Overdue", value: "₨ 92K", color: "text-rose-600" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-lg border border-border bg-white px-2.5 py-2 shadow-[var(--shadow-xs)]"
            >
              <p className="text-[9px] uppercase tracking-[0.12em] text-[#5a6b7a]">{kpi.label}</p>
              <p className={`mt-0.5 text-sm font-semibold tabular-nums ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-white">
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
          ].map((row) => (
            <div
              key={row.ref}
              className="flex items-center justify-between gap-3 border-b border-border last:border-0 px-3 py-2.5 text-[12px]"
            >
              <div className="min-w-0">
                <p className="font-medium text-[#213242] truncate">{row.ref}</p>
                <p className="text-[11px] text-[#5a6b7a] truncate">{row.customer}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-medium tabular-nums text-[#213242]">{row.amount}</p>
                <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${row.tone}`}>
                  {row.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ArrowRight, Link2, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useCatalogModules } from "@/hooks/use-commercial";
import {
  CatalogEmptyState,
  CatalogErrorState,
  CatalogSkeleton,
} from "@/components/commercial/catalog-states";
import { AnimateIn } from "@/components/shared/animate-in";
import { Container, Section } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { resolveModuleIcon } from "@/lib/icons";
import { cycleUnitPrice } from "@/lib/commercial/module-builder";
import {
  browseCategoryForModule,
  browseIndustryForModule,
  filterModulesByBrowseCategory,
  filterModulesByBrowseIndustry,
  groupModulesByBrowseCategory,
  groupModulesByBrowseIndustry,
  isIndustryPackModule,
  uniqueBrowseCategories,
  uniqueBrowseIndustries,
} from "@/lib/commercial/modules-taxonomy";
import type { BillingCycle, CatalogModule } from "@/lib/commercial/types";
import { cn } from "@/lib/utils";

type ModulesCatalogProps = {
  groupBy?: "none" | "category" | "industry";
  initialFilter?: string | null;
};

const CYCLES: { id: BillingCycle; label: string }[] = [
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
  { id: "lifetime", label: "Lifetime" },
];

function CatalogModuleCard({
  mod,
  cycle,
  formatPrice,
  byCode,
  showIndustryBadge,
}: {
  mod: CatalogModule;
  cycle: BillingCycle;
  formatPrice: (n: number) => string;
  byCode: Map<string, CatalogModule>;
  showIndustryBadge?: boolean;
}) {
  const Icon = resolveModuleIcon(mod.name, mod.icon);
  const price = cycleUnitPrice(mod, cycle);
  const cycleLabel = cycle === "lifetime" ? "once" : cycle === "yearly" ? "yr" : "mo";
  const depNames = (mod.dependencies || [])
    .map((c) => byCode.get(c)?.name || c)
    .filter(Boolean);
  const hasDeps = depNames.length > 0;
  const browseCat = browseCategoryForModule(mod);
  const browseInd = browseIndustryForModule(mod);

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border p-4 transition-all duration-200",
        hasDeps
          ? "border-amber-300 bg-amber-50/40 hover:border-amber-400 hover:bg-amber-50/70 hover:shadow-md"
          : "border-border bg-white hover:border-[#0b1f3a]/30 hover:bg-slate-50 hover:shadow-sm"
      )}
    >
      <span
        className="pointer-events-none absolute -right-1 bottom-0 top-0 flex w-[36%] items-end justify-center bg-slate-50/80 pb-3"
        aria-hidden
      >
        <Icon
          className={cn(
            "h-16 w-16 transition-transform duration-300 group-hover:scale-105",
            hasDeps ? "text-amber-500/15" : "text-slate-400/18"
          )}
          strokeWidth={1.15}
        />
      </span>

      <div className="relative z-[1] flex items-start gap-3 pr-2">
        <span
          className={cn(
            "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#0b1f3a] ring-1",
            hasDeps
              ? "bg-amber-100 ring-amber-200"
              : "bg-slate-100 ring-slate-200"
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3
            className="text-base font-semibold leading-snug tracking-tight text-[#0b1f3a]"
            title={mod.name}
          >
            {mod.name}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px]">
              {browseCat}
            </Badge>
            {showIndustryBadge && browseInd ? (
              <Badge variant="outline" className="text-[10px]">
                {browseInd}
              </Badge>
            ) : null}
            {isIndustryPackModule(mod) ? (
              <Badge className="bg-amber-100 text-[10px] text-amber-900 hover:bg-amber-100">
                Industry pack
              </Badge>
            ) : null}
          </div>
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {mod.description}
          </p>
        </div>
      </div>

      <div className="relative z-[1] mt-auto space-y-2 pt-3">
        {hasDeps ? (
          <div className="flex items-start gap-1.5 rounded-xl bg-amber-100/80 px-2.5 py-2 text-[11px] leading-snug text-amber-950 ring-1 ring-amber-200">
            <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              <span className="font-semibold">Also purchase for workflow:</span>{" "}
              {depNames.join(", ")}
            </p>
          </div>
        ) : (
          <p className="text-[11px] text-slate-400">Standalone — no required dependency</p>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-border/70 pt-2.5">
          <p className="text-lg font-bold tabular-nums tracking-tight text-[#0b1f3a]">
            {formatPrice(price)}
            <span className="ml-1 text-xs font-medium text-muted-foreground">
              / {cycleLabel}
            </span>
          </p>
          <Button
            asChild
            size="sm"
            className="h-9 cursor-pointer rounded-full px-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.97]"
          >
            <Link href={`/build-your-own-erp?add=${encodeURIComponent(mod.code)}`}>
              <Plus className="h-3.5 w-3.5" />
              Add
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

export function ModulesCatalog({ groupBy = "none", initialFilter = null }: ModulesCatalogProps) {
  const { formatPrice } = useLocale();
  const query = useCatalogModules("waamto-erp");
  const modules = query.data;
  const [filter, setFilter] = useState<string | null>(initialFilter);
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  const filters = useMemo(() => {
    if (groupBy === "industry") return uniqueBrowseIndustries(modules);
    if (groupBy === "category") return uniqueBrowseCategories(modules);
    return [];
  }, [modules, groupBy]);

  const byCode = useMemo(() => new Map(modules.map((m) => [m.code, m])), [modules]);

  const visible = useMemo(() => {
    if (groupBy === "industry") return filterModulesByBrowseIndustry(modules, filter);
    if (groupBy === "category") return filterModulesByBrowseCategory(modules, filter);
    return modules;
  }, [modules, filter, groupBy]);

  const groups = useMemo(() => {
    if (groupBy === "none") {
      return [{ key: "all", label: "All modules", items: visible }];
    }
    if (groupBy === "industry") {
      return groupModulesByBrowseIndustry(visible);
    }
    return groupModulesByBrowseCategory(visible);
  }, [visible, groupBy]);

  const scopeNote =
    groupBy === "industry"
      ? `${visible.length} industry pack${visible.length === 1 ? "" : "s"} — core modules stay on All / Category`
      : groupBy === "category"
        ? `${modules.length} modules in ${filters.length} categories`
        : `${modules.length} module${modules.length === 1 ? "" : "s"} from License Engine`;

  if (query.loading && !modules.length) {
    return (
      <Section>
        <Container>
          <CatalogSkeleton rows={6} />
        </Container>
      </Section>
    );
  }

  if (query.error && !modules.length) {
    return (
      <Section>
        <Container>
          <CatalogErrorState message={query.error} onRetry={query.retry} />
        </Container>
      </Section>
    );
  }

  if (!modules.length) {
    return (
      <Section>
        <Container>
          <CatalogEmptyState message="No ERP modules are published yet." />
        </Container>
      </Section>
    );
  }

  return (
    <Section className="!pt-2">
      <Container>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm text-muted-foreground">{scopeNote}</p>
            {filters.length > 0 ? (
              <>
                <div className="lg:hidden">
                  <label htmlFor="modules-catalog-filter" className="sr-only">
                    {groupBy === "industry" ? "Filter by industry" : "Filter by category"}
                  </label>
                  <select
                    id="modules-catalog-filter"
                    value={filter || ""}
                    onChange={(e) => setFilter(e.target.value || null)}
                    className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-[#0b1f3a] shadow-sm outline-none focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20"
                  >
                    <option value="">
                      {groupBy === "industry" ? "All industries" : "All categories"}
                    </option>
                    {filters.map((label) => (
                      <option key={label} value={label}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="hidden flex-wrap gap-2 lg:flex">
                  <button
                    type="button"
                    onClick={() => setFilter(null)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      !filter
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-white text-muted-foreground hover:border-primary/30"
                    )}
                  >
                    All
                  </button>
                  {filters.map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setFilter(label)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        filter === label
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-white text-muted-foreground hover:border-primary/30"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          <div className="inline-flex w-full shrink-0 rounded-full border border-border bg-white p-1 shadow-sm sm:w-auto">
            {CYCLES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCycle(c.id)}
                className={cn(
                  "min-w-0 flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:flex-none sm:px-3.5 sm:text-sm",
                  cycle === c.id
                    ? "bg-[#0b1f3a] text-white"
                    : "text-muted-foreground hover:text-[#0b1f3a]"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {!visible.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-slate-50/80 px-6 py-12 text-center text-sm text-muted-foreground">
            {groupBy === "industry"
              ? "No industry packs match this filter."
              : "No modules match this filter."}
          </div>
        ) : (
          <div className="space-y-10">
            {groups.map((group) => (
              <div key={group.key} id={group.key}>
                {groupBy !== "none" ? (
                  <h2 className="mb-4 text-xl font-semibold tracking-tight text-[#0b1f3a]">
                    {group.label}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({group.items.length})
                    </span>
                  </h2>
                ) : null}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((mod, i) => (
                    <AnimateIn key={mod.id} delay={Math.min(i * 0.03, 0.24)}>
                      <CatalogModuleCard
                        mod={mod}
                        cycle={cycle}
                        formatPrice={formatPrice}
                        byCode={byCode}
                        showIndustryBadge={groupBy !== "industry"}
                      />
                    </AnimateIn>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-slate-50/80 px-4 py-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#0b1f3a]">Build a custom package</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Select modules with live pricing, then continue to Signup.
            </p>
          </div>
          <Button asChild className="rounded-full">
            <Link href="/build-your-own-erp">
              Build your own custom ERP
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

"use client";

import { ChevronDown, Link2, Search, Sparkles } from "lucide-react";
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
import { resolveModuleIcon } from "@/lib/icons";
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
import type { CatalogModule } from "@/lib/commercial/types";
import { cn } from "@/lib/utils";

type ModulesCatalogProps = {
  groupBy?: "none" | "category" | "industry";
  initialFilter?: string | null;
};

const CATEGORY_ACCENTS = [
  "from-blue-500/10 to-sky-400/5 ring-blue-200/60",
  "from-violet-500/10 to-purple-400/5 ring-violet-200/60",
  "from-emerald-500/10 to-teal-400/5 ring-emerald-200/60",
  "from-amber-500/10 to-orange-400/5 ring-amber-200/60",
  "from-rose-500/10 to-pink-400/5 ring-rose-200/60",
  "from-cyan-500/10 to-sky-400/5 ring-cyan-200/60",
  "from-indigo-500/10 to-blue-400/5 ring-indigo-200/60",
] as const;

function accentForCategory(label: string) {
  let hash = 0;
  for (let i = 0; i < label.length; i += 1) hash = (hash + label.charCodeAt(i) * 17) % CATEGORY_ACCENTS.length;
  return CATEGORY_ACCENTS[hash] ?? CATEGORY_ACCENTS[0];
}

function CatalogModuleCard({
  mod,
  byCode,
  showIndustryBadge,
  expanded,
  onToggle,
}: {
  mod: CatalogModule;
  byCode: Map<string, CatalogModule>;
  showIndustryBadge?: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const Icon = resolveModuleIcon(mod.name, mod.icon);
  const browseCat = browseCategoryForModule(mod);
  const browseInd = browseIndustryForModule(mod);
  const accent = accentForCategory(browseCat);
  const depNames = (mod.dependencies || [])
    .map((c) => byCode.get(c)?.name || c)
    .filter(Boolean);
  const recNames = (mod.recommended_modules || [])
    .map((c) => byCode.get(c)?.name || c)
    .filter(Boolean);
  const hasDeps = depNames.length > 0;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300",
        expanded
          ? "border-[#0b1f3a]/25 shadow-md ring-1 ring-[#0b1f3a]/10"
          : "border-border hover:-translate-y-0.5 hover:border-[#0b1f3a]/20 hover:shadow-md"
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-br",
          accent
        )}
        aria-hidden
      />

      <div className="relative flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0b1f3a] shadow-sm ring-1 ring-black/5">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3
              className="text-base font-semibold leading-snug tracking-tight text-[#0b1f3a]"
              title={mod.name}
            >
              {mod.name}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="text-[10px] font-medium">
                {browseCat}
              </Badge>
              {showIndustryBadge && browseInd ? (
                <Badge variant="outline" className="text-[10px]">
                  {browseInd}
                </Badge>
              ) : null}
              {isIndustryPackModule(mod) ? (
                <Badge className="bg-amber-100 text-[10px] text-amber-900 hover:bg-amber-100">
                  Industry setup
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <p
          className={cn(
            "mt-4 text-sm leading-relaxed text-muted-foreground",
            expanded ? "" : "line-clamp-3"
          )}
        >
          {mod.description || "Part of the WAAMTO modular ERP suite."}
        </p>

        {expanded ? (
          <div className="mt-4 space-y-3 border-t border-border/70 pt-4 text-sm">
            {mod.version ? (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-[#0b1f3a]">Version:</span> {mod.version}
              </p>
            ) : null}
            {hasDeps ? (
              <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-snug text-amber-950 ring-1 ring-amber-200/80">
                <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>
                  <span className="font-semibold">Works best with:</span> {depNames.join(", ")}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Standalone module — runs on its own.</p>
            )}
            {recNames.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-[#0b1f3a]">Recommended alongside:</span>{" "}
                {recNames.join(", ")}
              </p>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onToggle}
          className="mt-auto flex w-full items-center justify-between gap-2 border-t border-border/60 pt-3.5 text-left text-xs font-medium text-[#0b1f3a] transition-colors hover:text-primary"
          aria-expanded={expanded}
        >
          <span>{expanded ? "Hide details" : "View module details"}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              expanded && "rotate-180"
            )}
          />
        </button>
      </div>
    </article>
  );
}

export function ModulesCatalog({ groupBy = "none", initialFilter = null }: ModulesCatalogProps) {
  const query = useCatalogModules("waamto-erp");
  const modules = query.data;
  const [filter, setFilter] = useState<string | null>(initialFilter);
  const [search, setSearch] = useState("");
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  const categoryFilters = useMemo(() => uniqueBrowseCategories(modules), [modules]);

  const filters = useMemo(() => {
    if (groupBy === "industry") return uniqueBrowseIndustries(modules);
    if (groupBy === "category") return uniqueBrowseCategories(modules);
    return categoryFilters;
  }, [modules, groupBy, categoryFilters]);

  const byCode = useMemo(() => new Map(modules.map((m) => [m.code, m])), [modules]);

  const visible = useMemo(() => {
    let list =
      groupBy === "industry"
        ? filterModulesByBrowseIndustry(modules, filter)
        : groupBy === "category" || groupBy === "none"
          ? filterModulesByBrowseCategory(modules, filter)
          : modules;

    const q = search.trim().toLowerCase();
    if (!q) return list;

    return list.filter((mod) => {
      const haystack = [
        mod.name,
        mod.code,
        mod.description,
        browseCategoryForModule(mod),
        browseIndustryForModule(mod),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [modules, filter, groupBy, search]);

  const groups = useMemo(() => {
    if (groupBy === "none") {
      return [{ key: "all", label: "All modules", items: visible }];
    }
    if (groupBy === "industry") {
      return groupModulesByBrowseIndustry(visible);
    }
    return groupModulesByBrowseCategory(visible);
  }, [visible, groupBy]);

  const categoryCount = categoryFilters.length;

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
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-[#0b1f3a]/5 to-transparent p-4 sm:col-span-1">
            <p className="text-3xl font-bold tabular-nums tracking-tight text-[#0b1f3a]">
              {modules.length}
            </p>
            <p className="mt-1 text-sm font-medium text-[#0b1f3a]">Total ERP modules</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Full WAAMTO module library</p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-4 sm:col-span-1">
            <p className="text-3xl font-bold tabular-nums tracking-tight text-[#0b1f3a]">
              {categoryCount}
            </p>
            <p className="mt-1 text-sm font-medium text-[#0b1f3a]">Business areas</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Operations, finance, CRM & more</p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-4 sm:col-span-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium text-[#0b1f3a]">Information only</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Browse what WAAMTO includes. To compose a package, use Build Your Own ERP.
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search modules by name or area…"
              className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-sm text-[#0b1f3a] shadow-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20"
              aria-label="Search modules"
            />
          </div>

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
                    "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
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
                      "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
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

          <p className="text-sm text-muted-foreground">
            Showing {visible.length} of {modules.length} module{modules.length === 1 ? "" : "s"}
            {filter ? ` in ${filter}` : ""}
            {search.trim() ? ` matching “${search.trim()}”` : ""}
          </p>
        </div>

        {!visible.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-slate-50/80 px-6 py-12 text-center text-sm text-muted-foreground">
            No modules match your search or filter.
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
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {group.items.map((mod, i) => (
                    <AnimateIn key={mod.id} delay={Math.min(i * 0.03, 0.24)}>
                      <CatalogModuleCard
                        mod={mod}
                        byCode={byCode}
                        showIndustryBadge={groupBy !== "industry"}
                        expanded={expandedCode === mod.code}
                        onToggle={() =>
                          setExpandedCode((prev) => (prev === mod.code ? null : mod.code))
                        }
                      />
                    </AnimateIn>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}

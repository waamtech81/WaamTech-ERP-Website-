"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  CalendarDays,
  Check,
  ChevronDown,
  GitBranch,
  Link2,
  Lock,
  Minus,
  Package,
  Plus,
  Search,
  Sparkles,
  Users,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  useCatalogBusinessCategories,
  useCatalogBundle,
  useCatalogIndustries,
  useCatalogModules,
} from "@/hooks/use-commercial";
import {
  CatalogEmptyState,
  CatalogErrorState,
  CatalogSkeleton,
} from "@/components/commercial/catalog-states";
import { BundleRecommendationCard } from "@/components/commercial/bundle-recommendation-card";
import { CustomErpPackageSummary } from "@/components/commercial/custom-erp-package-summary";
import { AnimateIn } from "@/components/shared/animate-in";
import { Container, Section } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { getIcon, resolveModuleIcon } from "@/lib/icons";
import { industryDisplayIcon } from "@/lib/commercial/mappers";
import {
  buildCustomPackageQuotePayload,
  engineMoneyFromQuote,
  quoteCycleTotals,
  shouldShowBundleOffer,
  shouldShowCloseMatch,
} from "@/lib/commercial/custom-package-quote";
import {
  BUILDER_STEPS,
  buildCategoryRecommendation,
  clampTenantLimits,
  defaultTenantLimitsFromCommercial,
  DEFAULT_TENANT_LIMITS,
  mergeFeaturePackCatalogPrices,
  resolveTenantUnitPrices,
  resolveTenantUnitPricesFromCommercial,
  stepIndex,
  type BuilderFeaturePack,
  type BuilderStepId,
  type BuilderTenantLimits,
} from "@/lib/commercial/erp-builder-config";
import {
  cycleUnitPrice,
  resolveRecommendedModules,
  resolveRequiredDependencies,
  uniqueCategories,
} from "@/lib/commercial/module-builder";
import { browseCategoryForModule } from "@/lib/commercial/modules-taxonomy";
import { savePlanSelection } from "@/lib/commercial/plan-selection";
import type {
  BillingCycle,
  CatalogBusinessCategory,
  CatalogIndustry,
  CatalogModule,
  CustomPackageQuoteResult,
  PublicCommercialOverview,
} from "@/lib/commercial/types";
import {
  buildCustomErpPackagePayload,
  clearCustomErpPackage,
  couponAppliedInPricing,
  loadCustomErpPackage,
  saveCustomErpPackage,
  type CustomErpPackageMoneyBreakdown,
} from "@/lib/signup/custom-package";
import { cn } from "@/lib/utils";

const CYCLES: {
  id: BillingCycle;
  label: string;
  hint: string;
  icon: LucideIcon;
}[] = [
  { id: "monthly", label: "Monthly", hint: "Billed every month", icon: Calendar },
  { id: "yearly", label: "Yearly", hint: "Billed once a year", icon: CalendarDays },
  { id: "lifetime", label: "Lifetime", hint: "One-time purchase", icon: Sparkles },
];

/** Shared select-card shell — every builder card matches the module card. */
function BuilderSelectCard({
  selected,
  disabled,
  onClick,
  icon: Icon,
  title,
  description,
  badges,
  note,
  noteTone = "amber",
  metaLine,
  footerLeft,
  footerRight,
  footerNode,
  warnBorder,
  as = "button",
  showSelection = true,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick?: () => void;
  icon: LucideIcon;
  title: string;
  description?: string | null;
  badges?: ReactNode;
  note?: ReactNode;
  noteTone?: "amber" | "primary";
  metaLine?: ReactNode;
  footerLeft?: ReactNode;
  footerRight?: string | null;
  /** Replaces the price footer (e.g. tenant steppers). */
  footerNode?: ReactNode;
  warnBorder?: boolean;
  as?: "button" | "div";
  showSelection?: boolean;
}) {
  const className = cn(
    "group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200",
    selected
      ? "cursor-pointer border-primary bg-sky-50 shadow-sm ring-2 ring-primary/25"
      : warnBorder
        ? "cursor-pointer border-amber-300 bg-amber-50/40 hover:border-amber-400 hover:bg-amber-50/70 hover:shadow-md"
        : "cursor-pointer border-border bg-white hover:border-primary/35 hover:bg-slate-50 hover:shadow-sm",
    disabled && selected && "cursor-default"
  );

  const body = (
    <>
      <span
        className={cn(
          "pointer-events-none absolute -right-1 bottom-0 top-0 flex w-[36%] items-end justify-center pb-3",
          selected ? "bg-sky-100/70" : warnBorder ? "bg-amber-50/80" : "bg-slate-50/80"
        )}
        aria-hidden
      >
        <Icon
          className={cn(
            "h-16 w-16 transition-transform duration-300 group-hover:scale-105",
            selected
              ? "text-primary/12"
              : warnBorder
                ? "text-amber-500/12"
                : "text-slate-400/15"
          )}
          strokeWidth={1.15}
        />
      </span>

      {showSelection ? (
        <span
          className={cn(
            "absolute right-3 top-3 z-10 inline-flex items-center gap-1.5",
            selected &&
              "rounded-full border border-primary bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm"
          )}
          aria-hidden
        >
          <span
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
              selected
                ? "border-white bg-white text-primary"
                : "border-slate-300 bg-white/95 shadow-sm group-hover:border-primary/50"
            )}
          >
            {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
          </span>
          {selected ? "Selected" : null}
        </span>
      ) : null}

      <div
        className={cn(
          "relative z-[1] flex items-start gap-3",
          showSelection && "pr-16"
        )}
      >
        <span
          className={cn(
            "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm",
            selected
              ? "bg-primary text-white"
              : "bg-[#0b1f3a]/[0.06] text-[#0b1f3a] ring-1 ring-[#0b1f3a]/10"
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3
            className="text-base font-semibold leading-snug tracking-tight text-[#0b1f3a]"
            title={title}
          >
            {title}
          </h3>
          {badges ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">{badges}</div>
          ) : null}
          {description ? (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="relative z-[1] mt-auto space-y-2 pt-3">
        {note ? (
          <div
            className={cn(
              "flex items-start gap-1.5 rounded-xl px-2.5 py-2 text-[11px] leading-snug",
              noteTone === "primary" || selected
                ? "bg-primary/10 text-[#0b1f3a]"
                : "bg-amber-50 text-amber-950 ring-1 ring-amber-200/80"
            )}
          >
            {note}
          </div>
        ) : metaLine ? (
          <p className="text-[11px] text-slate-400">{metaLine}</p>
        ) : null}

        {footerNode ? (
          <div className="border-t border-border/70 pt-2.5">{footerNode}</div>
        ) : footerLeft != null || footerRight ? (
          <div className="flex items-baseline justify-between gap-2 border-t border-border/70 pt-2.5">
            <div
              className={cn(
                "text-lg font-bold tabular-nums tracking-tight",
                selected ? "text-primary" : "text-[#0b1f3a]"
              )}
            >
              {footerLeft}
            </div>
            {footerRight ? (
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] text-muted-foreground ring-1 ring-border/70">
                {footerRight}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );

  if (as === "div") {
    return <div className={className}>{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={className}
    >
      {body}
    </button>
  );
}

function ModuleCard({
  mod,
  selected,
  required,
  recommended,
  cycle,
  onToggle,
  formatPrice,
  depNames,
}: {
  mod: CatalogModule;
  selected: boolean;
  required: boolean;
  recommended: boolean;
  cycle: BillingCycle;
  onToggle: () => void;
  formatPrice: (n: number) => string;
  depNames: string[];
}) {
  const Icon = resolveModuleIcon(mod.name, mod.icon);
  const price = cycleUnitPrice(mod, cycle);
  const hasDeps = depNames.length > 0;
  const cycleLabel = cycle === "lifetime" ? "once" : cycle === "yearly" ? "yr" : "mo";
  const categoryLabel = browseCategoryForModule(mod);

  return (
    <BuilderSelectCard
      selected={selected}
      disabled={required && selected}
      onClick={onToggle}
      icon={Icon}
      title={mod.name}
      description={mod.description}
      warnBorder={hasDeps && !selected}
      badges={
        required || (recommended && !selected) || (hasDeps && !selected) ? (
          <>
            {required ? (
              <Badge className="border-primary/20 bg-primary/10 text-[10px] text-primary">
                Auto-added
              </Badge>
            ) : null}
            {recommended && !selected ? (
              <Badge className="border-amber-200 bg-amber-50 text-[10px] text-amber-800">
                Recommended
              </Badge>
            ) : null}
            {hasDeps && !selected ? (
              <Badge className="border-amber-300 bg-amber-50 text-[10px] text-amber-900">
                Needs deps
              </Badge>
            ) : null}
          </>
        ) : null
      }
      note={
        hasDeps ? (
          <>
            <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              <span className="font-semibold">Also purchase for workflow:</span>{" "}
              {depNames.join(", ")}
            </p>
          </>
        ) : null
      }
      noteTone={hasDeps && !selected ? "amber" : "primary"}
      metaLine={hasDeps ? null : "Standalone — no required dependency"}
      footerLeft={
        <>
          {formatPrice(price)}
          <span className="ml-1 text-xs font-medium text-muted-foreground">
            / {cycleLabel}
          </span>
        </>
      }
      footerRight={categoryLabel}
    />
  );
}

function BuilderStepRail({
  step,
  maxReached,
  canAccess,
  onJump,
}: {
  step: BuilderStepId;
  maxReached: BuilderStepId;
  canAccess: (id: BuilderStepId) => boolean;
  onJump: (id: BuilderStepId) => void;
}) {
  const current = stepIndex(step);
  const reached = stepIndex(maxReached);
  const scrollerRef = useRef<HTMLElement | null>(null);
  const activeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const active = activeRef.current;
    if (!scroller || !active) return;
    const target =
      active.offsetLeft - scroller.clientWidth / 2 + active.offsetWidth / 2;
    scroller.scrollTo({
      left: Math.max(0, target),
      behavior: "smooth",
    });
  }, [step]);

  return (
    <nav
      ref={scrollerRef}
      aria-label="Builder steps"
      className="scrollbar-none -mx-1 overflow-x-auto overscroll-x-contain px-1 pb-0.5 touch-pan-x"
    >
      <ol className="flex w-max min-w-full items-center gap-1 sm:gap-1.5">
        {BUILDER_STEPS.map((s, i) => {
          const active = s.id === step;
          const done = i < current;
          const enabled = i <= reached && canAccess(s.id);
          return (
            <li key={s.id} className="flex shrink-0 items-center gap-1 sm:gap-1.5">
              {i > 0 ? (
                <span className="h-px w-2 shrink-0 bg-border sm:w-4" aria-hidden />
              ) : null}
              <button
                type="button"
                ref={active ? activeRef : undefined}
                disabled={!enabled}
                onClick={() => enabled && onJump(s.id)}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-[11px] font-medium transition-colors sm:gap-1.5 sm:px-2.5 sm:text-xs",
                  active
                    ? "bg-[#0b1f3a] text-white"
                    : done
                      ? "bg-primary/10 text-primary hover:bg-primary/15"
                      : enabled
                        ? "bg-white text-[#0b1f3a] ring-1 ring-border hover:bg-slate-50"
                        : "cursor-not-allowed bg-slate-50 text-slate-400"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                    active
                      ? "bg-white/15 text-white"
                      : done
                        ? "bg-primary text-white"
                        : "bg-slate-100 text-slate-500"
                  )}
                >
                  {done ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                </span>
                <span className="whitespace-nowrap">{s.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function BuilderSearchField({
  value,
  onChange,
  placeholder,
  label,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("relative min-w-0 w-full sm:max-w-md lg:max-w-lg", className)}>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="wt-search-field h-11 w-full rounded-full border border-border bg-white py-2 pl-10 pr-10 text-sm text-foreground shadow-sm outline-none ring-0 placeholder:text-slate-400 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-[#0b1f3a]"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function matchesSearch(haystack: Array<string | null | undefined>, query: string): boolean {
  if (!query) return true;
  return haystack.some((part) => (part || "").toLowerCase().includes(query));
}

function TenantStepper({
  label,
  icon: Icon,
  value,
  min,
  unitPrice,
  formatPrice,
  cycle,
  onChange,
}: {
  label: string;
  icon: LucideIcon;
  value: number;
  min: number;
  unitPrice: number;
  formatPrice: (n: number) => string;
  cycle: BillingCycle;
  onChange: (n: number) => void;
}) {
  const cycleHint = cycle === "lifetime" ? "once" : cycle === "yearly" ? "yr" : "mo";
  const aboveMin = value > min;
  return (
    <BuilderSelectCard
      as="div"
      selected={aboveMin}
      showSelection={false}
      icon={Icon}
      title={label}
      description={
        unitPrice > 0
          ? `${min} included · Extra ${formatPrice(unitPrice)}/${cycleHint}`
          : `${min} included · Extra at catalog rate`
      }
      footerNode={
        <div className="flex items-center justify-between gap-3">
          <p
            className={cn(
              "text-lg font-bold tabular-nums tracking-tight",
              aboveMin ? "text-primary" : "text-[#0b1f3a]"
            )}
          >
            {value}
            <span className="ml-1 text-xs font-medium text-muted-foreground">
              seats
            </span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white hover:bg-slate-50 disabled:opacity-40"
              disabled={value <= min}
              onClick={() => onChange(value - 1)}
              aria-label={`Decrease ${label}`}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white hover:bg-slate-50"
              onClick={() => onChange(value + 1)}
              aria-label={`Increase ${label}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      }
    />
  );
}

export function BuildYourOwnErpBuilder() {
  const { formatPrice } = useLocale();
  const router = useRouter();
  const modulesQuery = useCatalogModules("waamto-erp");
  const industriesQuery = useCatalogIndustries();
  const catalogBundle = useCatalogBundle("waamto-erp");
  const modules = modulesQuery.data;
  const industries = useMemo(
    () =>
      [...industriesQuery.data].sort(
        (a, b) =>
          (a.display_order ?? 0) - (b.display_order ?? 0) || a.name.localeCompare(b.name)
      ),
    [industriesQuery.data]
  );

  const [step, setStep] = useState<BuilderStepId>("industry");
  const [maxReached, setMaxReached] = useState<BuilderStepId>("industry");
  const [industryId, setIndustryId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const categoriesQuery = useCatalogBusinessCategories(industryId || null);
  const categories = useMemo(
    () =>
      [...categoriesQuery.data].sort(
        (a, b) =>
          (a.display_order ?? 0) - (b.display_order ?? 0) || a.name.localeCompare(b.name)
      ),
    [categoriesQuery.data]
  );

  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [selected, setSelected] = useState<string[]>([]);
  const [categoryRequired, setCategoryRequired] = useState<string[]>([]);
  const [featurePacks, setFeaturePacks] = useState<BuilderFeaturePack[]>([]);
  const [selectedPacks, setSelectedPacks] = useState<string[]>([]);
  const [tenantLimits, setTenantLimits] = useState<BuilderTenantLimits>(DEFAULT_TENANT_LIMITS);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [notice, setNotice] = useState<{ code: string; deps: string[] } | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [money, setMoney] = useState<CustomErpPackageMoneyBreakdown | null>(null);
  const [liveQuote, setLiveQuote] = useState<CustomPackageQuoteResult | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [bundleDismissed, setBundleDismissed] = useState(false);
  const [quoteNonce, setQuoteNonce] = useState(0);
  const [commercialOverview, setCommercialOverview] =
    useState<PublicCommercialOverview | null>(null);
  const [, startTransition] = useTransition();
  const restoreCategoryMetaRef = useRef(false);
  const pendingAddCodeRef = useRef<string | null>(null);
  const quoteCacheRef = useRef<Map<string, CustomPackageQuoteResult>>(new Map());

  const selectedIndustry = useMemo(
    () => industries.find((i) => i.id === industryId) || null,
    [industries, industryId]
  );
  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId) || null,
    [categories, categoryId]
  );

  const unitPrices = useMemo(() => {
    const fromCommercial = resolveTenantUnitPricesFromCommercial(commercialOverview);
    if (fromCommercial) return fromCommercial;
    return resolveTenantUnitPrices(
      catalogBundle.data.pricingPlans || [],
      catalogBundle.data.comparison
    );
  }, [commercialOverview, catalogBundle.data.pricingPlans, catalogBundle.data.comparison]);

  const moduleCategories = useMemo(() => uniqueCategories(modules), [modules]);
  const seedForDeps = useMemo(
    () => Array.from(new Set([...selected, ...categoryRequired])),
    [selected, categoryRequired]
  );
  const dependencyRequired = useMemo(
    () => resolveRequiredDependencies(seedForDeps, modules),
    [seedForDeps, modules]
  );
  /** Category-required modules + their deps stay locked even when also recommended. */
  const categoryLocked = useMemo(
    () =>
      Array.from(
        new Set([
          ...categoryRequired,
          ...resolveRequiredDependencies(categoryRequired, modules),
        ])
      ),
    [categoryRequired, modules]
  );
  const lockedCodes = useMemo(
    () => Array.from(new Set([...categoryLocked, ...dependencyRequired])),
    [categoryLocked, dependencyRequired]
  );
  const complete = useMemo(
    () => Array.from(new Set([...selected, ...lockedCodes])),
    [selected, lockedCodes]
  );
  const recommended = useMemo(
    () => resolveRecommendedModules(seedForDeps, modules, lockedCodes),
    [seedForDeps, modules, lockedCodes]
  );
  /** Display totals — License Engine quote only (never local arithmetic). */
  const totals = useMemo(() => {
    const fromQuote = quoteCycleTotals(liveQuote);
    if (fromQuote) return fromQuote;
    return { monthly: 0, yearly: 0, lifetime: 0 };
  }, [liveQuote]);
  const packTotal = Number(liveQuote?.pricing.feature_pack_total) || 0;
  const tenantAddon = Number(liveQuote?.pricing.seat_overage_total) || 0;

  const searchQ = deferredQuery.trim().toLowerCase();

  const filteredIndustries = useMemo(
    () =>
      industries.filter((ind) =>
        matchesSearch([ind.name, ind.description, ind.code, ind.slug], searchQ)
      ),
    [industries, searchQ]
  );

  const filteredCategories = useMemo(
    () =>
      categories.filter((cat) =>
        matchesSearch([cat.name, cat.description, cat.code, cat.slug], searchQ)
      ),
    [categories, searchQ]
  );

  const filtered = useMemo(() => {
    return modules.filter((m) => {
      if (categoryFilter !== "all" && (m.category || "General") !== categoryFilter) {
        return false;
      }
      return matchesSearch(
        [m.name, m.code, m.description, m.industry, m.category],
        searchQ
      );
    });
  }, [modules, categoryFilter, searchQ]);

  const filteredFeaturePacks = useMemo(
    () =>
      featurePacks.filter((p) =>
        matchesSearch([p.name, p.code, p.description], searchQ)
      ),
    [featurePacks, searchQ]
  );

  const filteredCycles = useMemo(
    () => CYCLES.filter((c) => matchesSearch([c.label, c.hint, c.id], searchQ)),
    [searchQ]
  );

  const tenantLimitCards = useMemo(
    () =>
      (
        [
          {
            key: "users" as const,
            label: "Users",
            icon: Users,
            keywords: ["users", "seats", "team"],
          },
          {
            key: "companies" as const,
            label: "Companies",
            icon: Building2,
            keywords: ["companies", "company", "org"],
          },
          {
            key: "branches" as const,
            label: "Branches",
            icon: GitBranch,
            keywords: ["branches", "branch", "locations"],
          },
          {
            key: "warehouses" as const,
            label: "Warehouses",
            icon: Warehouse,
            keywords: ["warehouses", "warehouse", "wms", "stock"],
          },
        ] as const
      ).filter((row) => matchesSearch([row.label, ...row.keywords], searchQ)),
    [searchQ]
  );

  const byCode = useMemo(() => new Map(modules.map((m) => [m.code, m])), [modules]);

  const filteredLockedCodes = useMemo(
    () =>
      lockedCodes.filter((code) =>
        matchesSearch([byCode.get(code)?.name, code], searchQ)
      ),
    [lockedCodes, byCode, searchQ]
  );

  const filteredRecommendedCodes = useMemo(
    () =>
      selected
        .filter((c) => !lockedCodes.includes(c))
        .filter((code) => matchesSearch([byCode.get(code)?.name, code], searchQ)),
    [selected, lockedCodes, byCode, searchQ]
  );

  const activePacks = useMemo(
    () =>
      featurePacks.filter((p) => p.required || selectedPacks.includes(p.code)),
    [featurePacks, selectedPacks]
  );

  const packagePreview = useMemo(
    () =>
      buildCustomErpPackagePayload({
        selected_modules: selected.filter((c) => !lockedCodes.includes(c)),
        dependency_modules: lockedCodes,
        recommended_modules: recommended,
        billing_cycle: cycle,
        monthly_price: totals.monthly,
        yearly_price: totals.yearly,
        lifetime_price: totals.lifetime,
        module_labels: Object.fromEntries(
          modules.map((m) => [m.code, m.name] as const)
        ),
        product_slug: "waamto-erp",
        discount_code: money?.discount_code || null,
        money: couponError || quoteError ? null : money,
        industry_id: industryId || null,
        industry_name: selectedIndustry?.name || null,
        category_id: categoryId || null,
        category_name: selectedCategory?.name || null,
        feature_packs: activePacks.map((p) => ({
          code: p.code,
          name: p.name,
          required: p.required,
          monthly_price: p.monthly_price,
          yearly_price: p.yearly_price,
          lifetime_price: p.lifetime_price,
        })),
        tenant_limits: tenantLimits,
        tenant_addon_total: tenantAddon,
        feature_pack_total: packTotal,
      }),
    [
      selected,
      lockedCodes,
      recommended,
      cycle,
      totals,
      modules,
      money,
      couponError,
      quoteError,
      industryId,
      selectedIndustry,
      categoryId,
      selectedCategory,
      activePacks,
      tenantLimits,
      tenantAddon,
      packTotal,
    ]
  );

  const canContinueSignup =
    complete.length > 0 &&
    Boolean(industryId && categoryId) &&
    Boolean(money?.grand_total != null) &&
    !quoteBusy &&
    !quoteError &&
    !couponError;

  /** Later tabs stay locked until prior selections are done. */
  function canAccessStep(id: BuilderStepId): boolean {
    if (id === "industry") return true;
    if (!industryId) return false;
    if (id === "category") return true;
    if (!categoryId) return false;
    if (id === "review") return complete.length > 0;
    return true;
  }

  function goTo(next: BuilderStepId) {
    if (!canAccessStep(next)) return;
    const nextIdx = stepIndex(next);
    const reachedIdx = stepIndex(maxReached);
    // Block skipping ahead — only revisit unlocked steps or open the next one.
    if (nextIdx > reachedIdx + 1) return;
    if (next !== step) {
      setQuery("");
      if (next !== "modules") setCategoryFilter("all");
    }
    setStep(next);
    if (nextIdx > reachedIdx) setMaxReached(next);
  }

  const searchPlaceholder =
    step === "industry"
      ? "Search industries…"
      : step === "category"
        ? "Search categories…"
        : step === "recommended"
          ? "Search recommended modules & packs…"
          : step === "modules"
            ? "Search modules — POS, Inventory, Finance…"
            : step === "feature-packs"
              ? "Search feature packs…"
              : step === "tenant"
                ? "Search tenant limits — users, branches…"
                : "Search billing cycles…";

  const searchLabel =
    step === "industry"
      ? "Search industries"
      : step === "category"
        ? "Search categories"
        : step === "recommended"
          ? "Search recommended configuration"
          : step === "modules"
            ? "Search modules"
            : step === "feature-packs"
              ? "Search feature packs"
              : step === "tenant"
                ? "Search tenant limits"
                : "Search billing cycles";

  function goNextStep() {
    if (step === "industry" && !industryId) return;
    if (step === "category" && !categoryId) return;
    if (step === "modules" && !complete.length) return;
    const order = BUILDER_STEPS.map((s) => s.id);
    const idx = order.indexOf(step);
    const next = order[Math.min(idx + 1, order.length - 1)];
    if (next) goTo(next);
  }

  function goPrevStep() {
    const order = BUILDER_STEPS.map((s) => s.id);
    const idx = order.indexOf(step);
    const prev = order[Math.max(idx - 1, 0)];
    if (prev && prev !== step) {
      setQuery("");
      if (prev !== "modules") setCategoryFilter("all");
      setStep(prev);
    }
  }

  function selectIndustry(id: string) {
    setIndustryId(id);
    setCategoryId("");
    setSelected([]);
    setCategoryRequired([]);
    setFeaturePacks([]);
    setSelectedPacks([]);
    setQuery("");
    setCategoryFilter("all");
    setMaxReached("category");
    setStep("category");
  }

  function selectCategory(cat: CatalogBusinessCategory) {
    setCategoryId(cat.id);
    applyCategoryConfig(cat);
    setQuery("");
    setCategoryFilter("all");
    setMaxReached("recommended");
    setStep("recommended");
  }

  function applyCategoryConfig(cat: CatalogBusinessCategory | null) {
    if (!cat || !modules.length) return;
    const rec = buildCategoryRecommendation(cat, modules);
    setCategoryRequired(rec.required_modules);
    // Recommended modules are pre-selected and editable; required stay locked via categoryRequired.
    const pendingAdd = pendingAddCodeRef.current;
    const nextSelected = pendingAdd
      ? Array.from(new Set([...rec.recommended_modules, pendingAdd]))
      : rec.recommended_modules;
    if (pendingAdd) pendingAddCodeRef.current = null;
    setSelected(nextSelected);
    setFeaturePacks(rec.feature_packs);
    setSelectedPacks(rec.feature_packs.map((p) => p.code));
    setTenantLimits(
      clampTenantLimits(
        {
          users: unitPrices.users.included,
          companies: unitPrices.companies.included,
          branches: unitPrices.branches.included,
          warehouses: unitPrices.warehouses.included,
        },
        DEFAULT_TENANT_LIMITS,
        unitPrices
      )
    );
  }

  useEffect(() => {
    if (hydrated || !modules.length) return;
    const params = new URLSearchParams(window.location.search);
    const editMode = params.get("edit") === "1";
    const addCodeRaw = (params.get("add") || "").trim().toUpperCase();
    const addCode =
      addCodeRaw && modules.some((m) => m.code.toUpperCase() === addCodeRaw)
        ? modules.find((m) => m.code.toUpperCase() === addCodeRaw)!.code
        : null;

    if (editMode) {
      const saved = loadCustomErpPackage();
      if (saved?.selected_modules?.length || saved?.dependency_modules?.length) {
        const optional = saved.selected_modules || [];
        const deps = saved.dependency_modules || [];
        setSelected(optional);
        setCategoryRequired(deps);
        setCycle(saved.billing_cycle);
        if (saved.discount_code) {
          setAppliedCoupon(saved.discount_code);
          setCouponInput(saved.discount_code);
        }
        if (saved.money) setMoney(saved.money);
        if (saved.industry_id) setIndustryId(saved.industry_id);
        if (saved.category_id) {
          setCategoryId(saved.category_id);
          restoreCategoryMetaRef.current = true;
        }
        if (saved.tenant_limits) setTenantLimits(saved.tenant_limits);
        if (saved.feature_packs?.length) {
          setFeaturePacks(
            saved.feature_packs.map((p) => ({
              code: p.code,
              name: p.name,
              description: p.name,
              required: Boolean(p.required),
              monthly_price: Number(p.monthly_price) || 0,
              yearly_price: Number(p.yearly_price) || 0,
              lifetime_price: Number(p.lifetime_price) || 0,
            }))
          );
          setSelectedPacks(saved.feature_packs.map((p) => p.code));
        }
        if (saved.industry_id && saved.category_id) {
          setStep("review");
          setMaxReached("review");
        } else if (saved.industry_id) {
          setStep("category");
          setMaxReached("category");
        }
      }
    } else {
      // Always open a fresh builder unless the user came from Signup "Edit package".
      clearCustomErpPackage();
      pendingAddCodeRef.current = addCode;
      setStep("industry");
      setMaxReached("industry");
      setIndustryId("");
      setCategoryId("");
      setSelected([]);
      setCategoryRequired([]);
      setFeaturePacks([]);
      setSelectedPacks([]);
      setTenantLimits(
        commercialOverview
          ? defaultTenantLimitsFromCommercial(commercialOverview)
          : DEFAULT_TENANT_LIMITS
      );
      setCycle("monthly");
      setCouponInput("");
      setAppliedCoupon(null);
      setMoney(null);
      setLiveQuote(null);
      setQuoteError(null);
      setBundleDismissed(false);
      setCouponError(null);
      setQuery("");
      setCategoryFilter("all");
      setNotice(null);
      quoteCacheRef.current.clear();
    }
    setHydrated(true);
  }, [modules, hydrated]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    void (async () => {
      try {
        const res = await fetch(
          `/api/commercial/commercial?product=waamto-erp&billing_cycle=${encodeURIComponent(cycle)}`,
          { signal: controller.signal, cache: "no-store" }
        );
        const json = (await res.json()) as {
          success?: boolean;
          data?: PublicCommercialOverview;
        };
        if (!cancelled && res.ok && json.success && json.data) {
          setCommercialOverview(json.data);
        }
      } catch {
        /* keep fallback catalog pricing */
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [cycle]);

  // Restore locked/required + packs from category registry after categories load.
  useEffect(() => {
    if (!hydrated || !restoreCategoryMetaRef.current) return;
    if (!categoryId || !modules.length || !categories.length) return;
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    const rec = buildCategoryRecommendation(cat, modules);
    setCategoryRequired(rec.required_modules);
    if (!featurePacks.length) {
      const priced = mergeFeaturePackCatalogPrices(rec.feature_packs, commercialOverview);
      setFeaturePacks(priced);
      setSelectedPacks(priced.map((p) => p.code));
    }
    restoreCategoryMetaRef.current = false;
  }, [hydrated, categoryId, categories, modules, featurePacks.length, commercialOverview]);

  useEffect(() => {
    if (!commercialOverview || !featurePacks.length) return;
    setFeaturePacks((prev) => mergeFeaturePackCatalogPrices(prev, commercialOverview));
  }, [commercialOverview]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 7000);
    return () => window.clearTimeout(t);
  }, [notice]);

  const completeKey = complete.join("|");
  const packKey = selectedPacks.slice().sort().join("|");
  const tenantKey = `${tenantLimits.users}|${tenantLimits.companies}|${tenantLimits.branches}|${tenantLimits.warehouses}`;

  useEffect(() => {
    if (!hydrated) return;
    if (!completeKey) {
      setMoney(null);
      setLiveQuote(null);
      setQuoteError(null);
      setCouponError(null);
      setQuoteBusy(false);
      return;
    }

    const moduleCodes = completeKey.split("|").filter(Boolean);
    const quoteBody = buildCustomPackageQuotePayload({
      product_slug: "waamto-erp",
      billing_cycle: cycle,
      selected_module_codes: moduleCodes,
      discount_code: appliedCoupon,
      industry_id: industryId || null,
      category_id: categoryId || null,
      selected_feature_packs: selectedPacks,
      user_limit: tenantLimits.users,
      company_limit: tenantLimits.companies,
      branch_limit: tenantLimits.branches,
      warehouse_limit: tenantLimits.warehouses,
    });
    const cacheKey = JSON.stringify(quoteBody);
    const cached = quoteCacheRef.current.get(cacheKey);
    if (cached?.pricing) {
      setLiveQuote(cached);
      setMoney(engineMoneyFromQuote(cached));
      setQuoteError(null);
      setQuoteBusy(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setQuoteBusy(true);
      setQuoteError(null);
      try {
        const res = await fetch("/api/commercial/custom-package-quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(quoteBody),
          signal: controller.signal,
          cache: "no-store",
        });
        const json = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          message?: string;
          data?: CustomPackageQuoteResult | null;
        };
        if (!res.ok || json.success === false || !json.data?.pricing) {
          const msg =
            json.message || "Live pricing is unavailable. Retry to continue.";
          // Retry once without feature packs when Engine rejects unknown pack codes.
          if (
            selectedPacks.length &&
            /feature pack/i.test(msg) &&
            quoteBody.selected_feature_packs?.length
          ) {
            const retryBody = {
              ...quoteBody,
              selected_feature_packs: [] as string[],
            };
            const retryRes = await fetch("/api/commercial/custom-package-quote", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(retryBody),
              signal: controller.signal,
              cache: "no-store",
            });
            const retryJson = (await retryRes.json().catch(() => ({}))) as {
              success?: boolean;
              message?: string;
              data?: CustomPackageQuoteResult | null;
            };
            if (retryRes.ok && retryJson.success !== false && retryJson.data?.pricing) {
              json.data = retryJson.data;
            } else {
              setLiveQuote(null);
              setMoney(null);
              if (appliedCoupon) {
                setCouponError(msg);
              } else {
                setCouponError(null);
                setQuoteError(msg);
              }
              return;
            }
          } else {
            setLiveQuote(null);
            setMoney(null);
            if (appliedCoupon) {
              setCouponError(msg);
            } else {
              setCouponError(null);
              setQuoteError(msg);
            }
            return;
          }
        }

        setLiveQuote(json.data);
        quoteCacheRef.current.set(cacheKey, json.data);
        if (quoteCacheRef.current.size > 40) {
          const first = quoteCacheRef.current.keys().next().value;
          if (first) quoteCacheRef.current.delete(first);
        }
        const pricing = json.data.pricing;
        const nextMoney = engineMoneyFromQuote(json.data);
        setMoney(nextMoney);
        setQuoteError(null);
        setBundleDismissed(false);

        if (appliedCoupon) {
          if (!couponAppliedInPricing(pricing)) {
            setCouponError("This coupon is invalid or not applicable.");
            return;
          }
          const matched = String(pricing.discount_code || appliedCoupon).toUpperCase();
          setAppliedCoupon(matched);
          setCouponInput(matched);
          setCouponError(null);
          return;
        }

        setCouponError(null);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setLiveQuote(null);
        setMoney(null);
        setQuoteError("Could not load live pricing from License Engine.");
        if (appliedCoupon) {
          setCouponError("Could not verify coupon right now.");
        }
      } finally {
        if (!controller.signal.aborted) setQuoteBusy(false);
      }
    }, 400);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [
    hydrated,
    completeKey,
    cycle,
    appliedCoupon,
    industryId,
    categoryId,
    packKey,
    tenantKey,
    selectedPacks,
    tenantLimits.users,
    tenantLimits.companies,
    tenantLimits.branches,
    tenantLimits.warehouses,
    quoteNonce,
  ]);

  function toggleModule(code: string) {
    startTransition(() => {
      // Locked required / dependency modules cannot be removed while still needed.
      if (lockedCodes.includes(code)) return;

      if (selected.includes(code)) {
        setSelected((prev) => prev.filter((c) => c !== code));
        setNotice(null);
        return;
      }

      const missingDeps = resolveRequiredDependencies([code], modules).filter(
        (c) => c !== code && !selected.includes(c) && !lockedCodes.includes(c)
      );
      setSelected((prev) => [...prev, code]);
      if (missingDeps.length) {
        setNotice({ code, deps: missingDeps });
      } else {
        setNotice(null);
      }
    });
  }

  function togglePack(code: string) {
    const pack = featurePacks.find((p) => p.code === code);
    if (!pack || pack.required) return;
    setSelectedPacks((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  function continueToSignup() {
    if (!canContinueSignup) return;
    const typed = couponInput.trim().toUpperCase();
    if (typed && !appliedCoupon) {
      setCouponError("Apply the coupon to update the price, or clear the code.");
      return;
    }
    if (couponError || quoteError) return;
    if (
      appliedCoupon &&
      (!money?.discount_code ||
        money.discount_code.toUpperCase() !== appliedCoupon.toUpperCase())
    ) {
      setCouponError("Coupon could not be applied. Fix or clear it before continuing.");
      return;
    }
    saveCustomErpPackage(packagePreview);
    router.push("/signup?package_type=custom");
  }

  function switchToRecommendedPlan() {
    const offer = liveQuote?.bundle_offer;
    if (!offer?.matched_plan_id) return;
    const planSlug =
      offer.matched_plan_slug ||
      String(offer.matched_plan?.slug || offer.matched_plan_name || "business")
        .toLowerCase()
        .replace(/\s+/g, "-");
    savePlanSelection({
      planId: offer.matched_plan_id,
      plan: planSlug,
      productSlug: "waamto-erp",
      billingCycle: cycle,
    });
    clearCustomErpPackage();
    router.push(
      `/signup?plan_id=${encodeURIComponent(offer.matched_plan_id)}&billing_cycle=${encodeURIComponent(cycle)}`
    );
  }

  const catalogLoading =
    (modulesQuery.loading && !modules.length) ||
    (industriesQuery.loading && !industries.length);

  if (catalogLoading) {
    return (
      <Section>
        <Container>
          <CatalogSkeleton rows={6} />
        </Container>
      </Section>
    );
  }

  if ((modulesQuery.error && !modules.length) || (industriesQuery.error && !industries.length)) {
    return (
      <Section>
        <Container>
          <CatalogErrorState
            message={modulesQuery.error || industriesQuery.error || "Unable to load catalog."}
            onRetry={() => {
              modulesQuery.retry();
              industriesQuery.retry();
            }}
          />
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

  const showSidebar = stepIndex(step) >= stepIndex("recommended");
  const cycleUnit = (key: keyof BuilderTenantLimits) => {
    const row = unitPrices[key];
    return cycle === "yearly"
      ? row.yearly
      : cycle === "lifetime"
        ? row.lifetime
        : row.monthly;
  };

  const showBillingToggle = stepIndex(step) >= stepIndex("modules");

  return (
    <>
      <Section className="!pt-4 !pb-3 sm:!pb-6">
        <Container>
          <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="mb-1.5 text-sm font-medium tracking-wide text-primary uppercase font-sans sm:mb-2">
                Custom ERP Builder
              </p>
              <h2 className="max-w-4xl font-heading text-base font-semibold leading-snug tracking-tight text-[#0b1f3a] text-pretty sm:text-lg md:text-xl">
                Industry → category → modules → packs → seats → signup.
                <span className="mt-1.5 block font-normal text-muted-foreground">
                  Required partners stay locked. Live pricing updates as you configure.
                </span>
              </h2>
            </div>
            {showBillingToggle ? (
              <div className="inline-flex w-full shrink-0 rounded-full border border-border bg-white p-1 shadow-sm sm:w-auto">
                {CYCLES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCycle(c.id)}
                    className={cn(
                      "min-w-0 flex-1 rounded-full px-3 py-2 text-xs font-medium transition-colors sm:flex-none sm:px-4 sm:text-sm",
                      cycle === c.id
                        ? "bg-[#0b1f3a] text-white"
                        : "text-muted-foreground hover:text-[#0b1f3a]"
                    )}
                    title={c.hint}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </Container>
      </Section>

      {/* Sticky step rail — stays visible while the user scrolls the builder */}
      <div
        id="erp-builder-sticky"
        className="sticky top-16 z-30 border-y border-border/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 sm:top-20"
      >
        <Container className="py-2.5 sm:py-3">
          <BuilderStepRail
            step={step}
            maxReached={maxReached}
            canAccess={canAccessStep}
            onJump={goTo}
          />
        </Container>
      </div>

      <Section className="!pt-5 !pb-24 sm:!pt-6 lg:!pb-16">
        <Container>
          <div className={cn("grid gap-6 sm:gap-8", showSidebar && "lg:grid-cols-12")}>
            <div className={cn("min-w-0", showSidebar ? "lg:col-span-8" : "max-w-5xl")}>
              {step === "industry" ? (
                <div>
                  <h3 className="text-lg font-semibold text-[#0b1f3a]">Select industry</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    From the License Engine industry registry.
                  </p>
                  <BuilderSearchField
                    value={query}
                    onChange={setQuery}
                    placeholder={searchPlaceholder}
                    label={searchLabel}
                    className="mt-4 sm:mt-5"
                  />
                  {filteredIndustries.length === 0 ? (
                    <div className="mt-5 rounded-2xl border border-dashed border-border bg-slate-50/80 px-6 py-12 text-center text-sm text-muted-foreground">
                      No industries match your search.
                    </div>
                  ) : (
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-5 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredIndustries.map((ind: CatalogIndustry, i) => {
                        const Icon = getIcon(industryDisplayIcon(ind));
                        const active = industryId === ind.id;
                        return (
                          <AnimateIn key={ind.id} delay={Math.min(i * 0.02, 0.25)}>
                            <BuilderSelectCard
                              selected={active}
                              onClick={() => selectIndustry(ind.id)}
                              icon={Icon}
                              title={ind.name}
                              description={
                                ind.description ||
                                "Industry profile from the Engine registry."
                              }
                              footerLeft={
                                <span className="text-sm font-semibold">Industry</span>
                              }
                              footerRight="Registry"
                            />
                          </AnimateIn>
                        );
                      })}
                    </div>
                  )}
                  <div className="mt-5 hidden sm:flex">
                    <Button
                      type="button"
                      className="rounded-full"
                      disabled={!industryId}
                      onClick={() => goTo("category")}
                    >
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : null}

              {step === "category" ? (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-[#0b1f3a]">
                        Select business category
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Showing categories for{" "}
                        <span className="font-medium text-[#0b1f3a]">
                          {selectedIndustry?.name || "your industry"}
                        </span>
                        .
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => goTo("industry")}
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Change industry
                    </Button>
                  </div>

                  <BuilderSearchField
                    value={query}
                    onChange={setQuery}
                    placeholder={searchPlaceholder}
                    label={searchLabel}
                    className="mt-4 sm:mt-5"
                  />

                  {categoriesQuery.loading && !categories.length ? (
                    <div className="mt-6">
                      <CatalogSkeleton rows={4} />
                    </div>
                  ) : categoriesQuery.error && !categories.length ? (
                    <div className="mt-6">
                      <CatalogErrorState
                        message={categoriesQuery.error}
                        onRetry={categoriesQuery.retry}
                      />
                    </div>
                  ) : !categories.length ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-border bg-slate-50/80 px-6 py-12 text-center text-sm text-muted-foreground">
                      No categories published for this industry yet.
                    </div>
                  ) : filteredCategories.length === 0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-border bg-slate-50/80 px-6 py-12 text-center text-sm text-muted-foreground">
                      No categories match your search.
                    </div>
                  ) : (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {filteredCategories.map((cat, i) => {
                        const active = categoryId === cat.id;
                        const posRequired =
                          cat.pos_requirement === "required" ||
                          cat.pos_mode === "required";
                        const mobileRequired =
                          cat.mobile_requirement === "required" ||
                          cat.mobile_mode === "required";
                        return (
                          <AnimateIn key={cat.id} delay={Math.min(i * 0.02, 0.25)}>
                            <BuilderSelectCard
                              selected={active}
                              onClick={() => selectCategory(cat)}
                              icon={Building2}
                              title={cat.name}
                              description={
                                cat.description ||
                                "Business category from the Engine registry."
                              }
                              badges={
                                posRequired || mobileRequired ? (
                                  <>
                                    {posRequired ? (
                                      <Badge className="border-amber-200 bg-amber-50 text-[10px] text-amber-900">
                                        POS required
                                      </Badge>
                                    ) : null}
                                    {mobileRequired ? (
                                      <Badge className="border-sky-200 bg-sky-50 text-[10px] text-sky-900">
                                        Mobile required
                                      </Badge>
                                    ) : null}
                                  </>
                                ) : null
                              }
                              footerLeft={
                                <span className="text-sm font-semibold">Category</span>
                              }
                              footerRight={selectedIndustry?.name || "Industry"}
                            />
                          </AnimateIn>
                        );
                      })}
                    </div>
                  )}
                  <div className="mt-5 hidden gap-2 sm:flex">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => goTo("industry")}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      className="rounded-full"
                      disabled={!categoryId}
                      onClick={() => goTo("recommended")}
                    >
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : null}

              {step === "recommended" ? (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-semibold text-[#0b1f3a]">
                      Recommended configuration
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Loaded for {selectedCategory?.name || "your category"}. Required modules
                      stay locked; recommended modules stay editable.
                    </p>
                    <BuilderSearchField
                      value={query}
                      onChange={setQuery}
                      placeholder={searchPlaceholder}
                      label={searchLabel}
                      className="mt-4 sm:mt-5"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-white p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Required modules
                      </p>
                      <ul className="mt-2 space-y-1.5 text-sm text-[#0b1f3a]">
                        {filteredLockedCodes.length ? (
                          filteredLockedCodes.map((code) => (
                            <li key={code} className="flex items-center gap-2">
                              <Lock className="h-3.5 w-3.5 text-primary" />
                              {byCode.get(code)?.name || code}
                            </li>
                          ))
                        ) : (
                          <li className="text-muted-foreground">
                            {searchQ ? "No required modules match" : "None locked yet"}
                          </li>
                        )}
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-border bg-white p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Recommended modules
                      </p>
                      <ul className="mt-2 space-y-1.5 text-sm text-[#0b1f3a]">
                        {filteredRecommendedCodes.map((code) => (
                          <li key={code} className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-amber-700" />
                            {byCode.get(code)?.name || code}
                          </li>
                        ))}
                        {!filteredRecommendedCodes.length ? (
                          <li className="text-muted-foreground">
                            {searchQ
                              ? "No recommended modules match"
                              : "Using required set only — add more in the next step"}
                          </li>
                        ) : null}
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-border bg-white p-4 sm:col-span-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Recommended feature packs
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {filteredFeaturePacks.length ? (
                          filteredFeaturePacks.map((p) => (
                            <Badge
                              key={p.code}
                              className={
                                p.required
                                  ? "bg-primary/10 text-primary"
                                  : "bg-amber-50 text-amber-900"
                              }
                            >
                              {p.name}
                              {p.required ? " · required" : ""}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {searchQ
                              ? "No feature packs match your search"
                              : "No feature packs listed for this category"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="hidden flex-wrap gap-3 sm:flex">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => goTo("category")}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      className="rounded-full"
                      onClick={() => goTo("modules")}
                    >
                      Customize modules
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : null}

              {step === "modules" ? (
                <div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-[#0b1f3a]">Module builder</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Add or remove optional modules. Required dependencies stay locked.
                      </p>
                    </div>
                    <div className="hidden gap-2 sm:flex">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => goTo("recommended")}
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-full"
                        disabled={!complete.length}
                        onClick={() => goTo("feature-packs")}
                      >
                        Next
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 flex w-full flex-col gap-3 sm:mt-5 sm:flex-row sm:items-center sm:justify-between">
                    <BuilderSearchField
                      value={query}
                      onChange={setQuery}
                      placeholder={searchPlaceholder}
                      label={searchLabel}
                    />
                    <div className="relative w-full shrink-0 sm:ml-auto sm:w-auto">
                      <label className="sr-only" htmlFor="custom-erp-category-filter">
                        Module category
                      </label>
                      <select
                        id="custom-erp-category-filter"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="h-11 w-full appearance-none rounded-full border border-border bg-white py-2 pl-4 pr-10 text-sm font-medium text-[#0b1f3a] shadow-sm outline-none transition-colors hover:border-primary/30 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20 sm:min-w-[11.5rem]"
                      >
                        <option value="all">All categories</option>
                        {moduleCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                        aria-hidden
                      />
                    </div>
                  </div>

                  {notice ? (
                    <div
                      role="status"
                      className="mt-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
                    >
                      <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">
                          With {byCode.get(notice.code)?.name || notice.code}, you also need
                          these modules for the workflow
                        </p>
                        <p className="mt-1 text-amber-900/90">
                          Auto-selected:{" "}
                          <span className="font-medium">
                            {notice.deps.map((c) => byCode.get(c)?.name || c).join(", ")}
                          </span>
                          .
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotice(null)}
                        className="shrink-0 rounded-lg p-1 text-amber-800 hover:bg-amber-100"
                        aria-label="Dismiss"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}

                  <div className="mt-5">
                    {filtered.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border bg-slate-50/80 px-6 py-12 text-center">
                        <p className="text-sm font-medium text-[#0b1f3a]">
                          No modules match your search
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {filtered.map((mod, i) => {
                          const depNames = (mod.dependencies || [])
                            .map((c) => byCode.get(c)?.name || c)
                            .filter(Boolean);
                          const isLocked = lockedCodes.includes(mod.code);
                          return (
                            <AnimateIn key={mod.id} delay={Math.min(i * 0.03, 0.3)}>
                              <ModuleCard
                                mod={mod}
                                selected={complete.includes(mod.code)}
                                required={isLocked && complete.includes(mod.code)}
                                recommended={
                                  recommended.includes(mod.code) ||
                                  (selected.includes(mod.code) && !isLocked)
                                }
                                cycle={cycle}
                                onToggle={() => toggleModule(mod.code)}
                                formatPrice={formatPrice}
                                depNames={depNames}
                              />
                            </AnimateIn>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {step === "feature-packs" ? (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-[#0b1f3a]">Feature packs</h3>
                      {featurePacks.some((p) => !p.required) ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Enable optional packs for{" "}
                          {selectedCategory?.name || "your category"}. Required packs stay
                          locked. Prices come from the catalog when published (currently
                          included).
                        </p>
                      ) : null}
                    </div>
                    <div className="hidden gap-2 sm:flex">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => goTo("modules")}
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-full"
                        onClick={() => goTo("tenant")}
                      >
                        Next
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <BuilderSearchField
                    value={query}
                    onChange={setQuery}
                    placeholder={searchPlaceholder}
                    label={searchLabel}
                    className="mt-4 sm:mt-5"
                  />

                  {!featurePacks.length ? (
                    <div className="rounded-2xl border border-dashed border-border bg-slate-50/80 px-6 py-10 text-center text-sm text-muted-foreground">
                      No feature packs are listed for this category. Continue to tenant limits.
                    </div>
                  ) : filteredFeaturePacks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-slate-50/80 px-6 py-10 text-center text-sm text-muted-foreground">
                      No feature packs match your search.
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {filteredFeaturePacks.map((pack) => {
                        const on = pack.required || selectedPacks.includes(pack.code);
                        const price =
                          cycle === "yearly"
                            ? pack.yearly_price
                            : cycle === "lifetime"
                              ? pack.lifetime_price
                              : pack.monthly_price;
                        const cycleLabel =
                          cycle === "lifetime" ? "once" : cycle === "yearly" ? "yr" : "mo";
                        return (
                          <BuilderSelectCard
                            key={pack.code}
                            selected={on}
                            disabled={pack.required}
                            onClick={() => togglePack(pack.code)}
                            icon={Package}
                            title={pack.name}
                            description={pack.description}
                            badges={
                              pack.required ? (
                                <Badge className="border-primary/20 bg-primary/10 text-[10px] text-primary">
                                  Auto-added
                                </Badge>
                              ) : null
                            }
                            footerLeft={
                              price > 0 ? (
                                <>
                                  {formatPrice(price)}
                                  <span className="ml-1 text-xs font-medium text-muted-foreground">
                                    / {cycleLabel}
                                  </span>
                                </>
                              ) : (
                                <span className="text-base font-bold">Included</span>
                              )
                            }
                            footerRight="Feature pack"
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : null}

              {step === "tenant" ? (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-[#0b1f3a]">Tenant limits</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Configure seats for your workspace. Unit prices come from the published
                        Business plan catalog rates.
                      </p>
                    </div>
                    <div className="hidden gap-2 sm:flex">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => goTo("feature-packs")}
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-full"
                        onClick={() => goTo("billing")}
                      >
                        Next
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <BuilderSearchField
                    value={query}
                    onChange={setQuery}
                    placeholder={searchPlaceholder}
                    label={searchLabel}
                    className="mt-4 sm:mt-5"
                  />

                  {tenantLimitCards.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-slate-50/80 px-6 py-10 text-center text-sm text-muted-foreground">
                      No tenant limits match your search.
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {tenantLimitCards.map((row) => (
                        <TenantStepper
                          key={row.key}
                          label={row.label}
                          icon={row.icon}
                          value={tenantLimits[row.key]}
                          min={unitPrices[row.key].included}
                          unitPrice={cycleUnit(row.key)}
                          formatPrice={formatPrice}
                          cycle={cycle}
                          onChange={(n) =>
                            setTenantLimits((prev) =>
                              clampTenantLimits({ [row.key]: n }, prev, unitPrices)
                            )
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              {step === "billing" ? (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-[#0b1f3a]">Billing cycle</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Choose how you want to pay. Live pricing updates immediately.
                      </p>
                    </div>
                    <div className="hidden gap-2 sm:flex">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => goTo("tenant")}
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-full"
                        onClick={() => goTo("review")}
                      >
                        Review package
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <BuilderSearchField
                    value={query}
                    onChange={setQuery}
                    placeholder={searchPlaceholder}
                    label={searchLabel}
                    className="mt-4 sm:mt-5"
                  />

                  {filteredCycles.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-slate-50/80 px-6 py-10 text-center text-sm text-muted-foreground">
                      No billing cycles match your search.
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-3">
                      {filteredCycles.map((c) => {
                        const amount =
                          c.id === cycle && money?.grand_total != null
                            ? money.grand_total
                            : c.id === "yearly"
                              ? totals.yearly
                              : c.id === "lifetime"
                                ? totals.lifetime
                                : totals.monthly;
                        const active = cycle === c.id;
                        return (
                          <BuilderSelectCard
                            key={c.id}
                            selected={active}
                            onClick={() => {
                              setCycle(c.id);
                              if (step === "billing") goTo("review");
                            }}
                            icon={c.icon}
                            title={c.label}
                            description={c.hint}
                            footerLeft={
                              quoteBusy && active ? "…" : formatPrice(amount)
                            }
                            footerRight={
                              c.id === "lifetime"
                                ? "once"
                                : c.id === "yearly"
                                  ? "/ yr"
                                  : "/ mo"
                            }
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : null}

              {step === "review" ? (
                <div className="space-y-5">
                  <div className="overflow-hidden rounded-2xl border-2 border-[#0b1f3a]/15 bg-white shadow-sm">
                    <div className="border-b border-sky-100 bg-sky-50 px-5 py-5 sm:px-6 sm:py-6">
                      <div className="flex items-start gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0b1f3a] text-white shadow-sm">
                          <Sparkles className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">
                            Your workspace is ready to build
                          </p>
                          <h3 className="mt-1 text-xl font-semibold tracking-tight text-[#0b1f3a] sm:text-2xl">
                            This is where your custom ERP system will be created
                          </h3>
                          <p className="mt-2 text-sm leading-relaxed text-[#0b1f3a]/75">
                            Review the package summary, then continue to Signup. Your industry,
                            modules, seats, and billing become a live WAAMTO workspace — nothing
                            is submitted until you finish Signup.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 px-5 py-5 sm:px-6">
                      <div className="grid gap-2.5 sm:grid-cols-3">
                        <div className="rounded-xl border border-border bg-slate-50 px-3.5 py-3">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Industry
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#0b1f3a]">
                            {selectedIndustry?.name || "Not selected"}
                          </p>
                        </div>
                        <div className="rounded-xl border border-border bg-slate-50 px-3.5 py-3">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Category
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#0b1f3a]">
                            {selectedCategory?.name || "Not selected"}
                          </p>
                        </div>
                        <div className="rounded-xl border border-border bg-slate-50 px-3.5 py-3">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Modules
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#0b1f3a]">
                            {packagePreview.selected_module_count} selected ·{" "}
                            <span className="capitalize">{cycle}</span>
                          </p>
                        </div>
                      </div>

                      {!bundleDismissed &&
                      liveQuote?.bundle_offer &&
                      shouldShowBundleOffer(liveQuote) ? (
                        <BundleRecommendationCard
                          offer={liveQuote.bundle_offer}
                          mode="bundle"
                          cycleLabel={
                            cycle === "lifetime"
                              ? "one-time"
                              : cycle === "yearly"
                                ? "/ year"
                                : "/ month"
                          }
                          onSwitchToPlan={switchToRecommendedPlan}
                          onContinueCustom={() => setBundleDismissed(true)}
                        />
                      ) : !bundleDismissed &&
                        liveQuote?.bundle_offer &&
                        shouldShowCloseMatch(liveQuote) ? (
                        <BundleRecommendationCard
                          offer={liveQuote.bundle_offer}
                          mode="close"
                          cycleLabel={
                            cycle === "lifetime"
                              ? "one-time"
                              : cycle === "yearly"
                                ? "/ year"
                                : "/ month"
                          }
                          onSwitchToPlan={switchToRecommendedPlan}
                          onContinueCustom={() => setBundleDismissed(true)}
                        />
                      ) : null}

                      <div className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-4 shadow-sm lg:hidden">
                        <CustomErpPackageSummary
                          package={packagePreview}
                          readOnly={false}
                          cycle={cycle}
                          totals={totals}
                          money={money}
                          className="border-0 bg-transparent p-0 shadow-none"
                          couponCode={couponInput}
                          onCouponCodeChange={(value) => {
                            const next = value.toUpperCase();
                            setCouponInput(next);
                            setCouponError(null);
                            if (!next.trim() && appliedCoupon) setAppliedCoupon(null);
                            else if (
                              appliedCoupon &&
                              next.trim() &&
                              next.trim() !== appliedCoupon
                            ) {
                              setAppliedCoupon(null);
                            }
                          }}
                          onApplyCoupon={() => {
                            const code = couponInput.trim().toUpperCase();
                            if (!code) {
                              setAppliedCoupon(null);
                              setCouponError(null);
                              return;
                            }
                            if (!complete.length) {
                              setCouponError(
                                "Select at least one module before applying a coupon."
                              );
                              return;
                            }
                            setCouponError(null);
                            setCouponInput(code);
                            setAppliedCoupon(code);
                          }}
                          onClearCoupon={() => {
                            setCouponInput("");
                            setAppliedCoupon(null);
                            setCouponError(null);
                          }}
                          couponError={couponError}
                          couponBusy={quoteBusy}
                        />
                      </div>

                      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          className="hidden rounded-full sm:inline-flex"
                          onClick={() => goTo("billing")}
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Back
                        </Button>
                        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:items-end">
                          <Button
                            type="button"
                            size="lg"
                            className="w-full rounded-full sm:w-auto sm:min-w-[14rem]"
                            disabled={!canContinueSignup}
                            onClick={continueToSignup}
                          >
                            Build my ERP — continue to Signup
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                          <p className="text-xs text-muted-foreground sm:text-right">
                            Prefer a fixed plan?{" "}
                            <Link href="/pricing" className="text-primary hover:underline">
                              View pricing
                            </Link>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {showSidebar ? (
              <aside className="hidden lg:col-span-4 lg:block">
                <div className="sticky top-24 space-y-4">
                  {quoteError ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                      <p className="font-semibold">Live pricing unavailable</p>
                      <p className="mt-1 text-rose-800/90">{quoteError}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-3 rounded-full border-rose-300 bg-white"
                        onClick={() => {
                          quoteCacheRef.current.clear();
                          setQuoteError(null);
                          setQuoteNonce((n) => n + 1);
                        }}
                      >
                        Retry quote
                      </Button>
                    </div>
                  ) : null}

                  {quoteBusy && !money ? (
                    <div className="animate-pulse space-y-3 rounded-2xl border-2 border-sky-200 bg-sky-50 p-5">
                      <div className="h-4 w-1/3 rounded bg-sky-200/80" />
                      <div className="h-10 w-2/3 rounded bg-sky-200/80" />
                      <div className="h-3 w-full rounded bg-sky-100" />
                      <div className="h-3 w-5/6 rounded bg-sky-100" />
                    </div>
                  ) : (
                  <div className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-1 shadow-sm">
                    <CustomErpPackageSummary
                      package={packagePreview}
                      readOnly={false}
                      cycle={cycle}
                      totals={totals}
                      money={money}
                      className="border-0 bg-transparent shadow-none"
                      couponCode={couponInput}
                      onCouponCodeChange={(value) => {
                        const next = value.toUpperCase();
                        setCouponInput(next);
                        setCouponError(null);
                        if (!next.trim() && appliedCoupon) setAppliedCoupon(null);
                        else if (
                          appliedCoupon &&
                          next.trim() &&
                          next.trim() !== appliedCoupon
                        ) {
                          setAppliedCoupon(null);
                        }
                      }}
                      onApplyCoupon={() => {
                        const code = couponInput.trim().toUpperCase();
                        if (!code) {
                          setAppliedCoupon(null);
                          setCouponError(null);
                          return;
                        }
                        if (!complete.length) {
                          setCouponError(
                            "Select at least one module before applying a coupon."
                          );
                          return;
                        }
                        setCouponError(null);
                        setCouponInput(code);
                        setAppliedCoupon(code);
                      }}
                      onClearCoupon={() => {
                        setCouponInput("");
                        setAppliedCoupon(null);
                        setCouponError(null);
                      }}
                      couponError={couponError}
                      couponBusy={quoteBusy}
                    />
                  </div>
                  )}

                  {!bundleDismissed &&
                  liveQuote?.bundle_offer &&
                  step !== "industry" &&
                  step !== "category" &&
                  (shouldShowBundleOffer(liveQuote) ||
                    shouldShowCloseMatch(liveQuote)) ? (
                    <BundleRecommendationCard
                      offer={liveQuote.bundle_offer}
                      mode={shouldShowBundleOffer(liveQuote) ? "bundle" : "close"}
                      cycleLabel={
                        cycle === "lifetime"
                          ? "one-time"
                          : cycle === "yearly"
                            ? "/ year"
                            : "/ month"
                      }
                      onSwitchToPlan={switchToRecommendedPlan}
                      onContinueCustom={() => setBundleDismissed(true)}
                    />
                  ) : null}

                  {recommended.length && step === "modules" ? (
                    <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4 shadow-sm">
                      <p className="text-xs font-medium uppercase tracking-wide text-sky-800/80">
                        Optional recommendations
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {recommended.map((code) => (
                          <button
                            key={code}
                            type="button"
                            onClick={() => toggleModule(code)}
                            className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-900 hover:bg-amber-100"
                          >
                            + {byCode.get(code)?.name || code}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {step !== "review" ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-full border-sky-300 bg-sky-50"
                      onClick={goNextStep}
                    >
                      Next step
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </aside>
            ) : null}
          </div>
        </Container>
      </Section>

      {/* Mobile sticky action dock — matches how users scroll & act on phone */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 px-3 py-2.5 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur supports-[backdrop-filter]:bg-white/90 lg:hidden pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          {step !== "industry" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 shrink-0 rounded-full px-3"
              onClick={goPrevStep}
              aria-label="Previous step"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          ) : null}
          <div className="min-w-0 flex-1">
            {showSidebar ? (
              <p className="truncate text-[11px] text-muted-foreground">
                <span className="font-semibold tabular-nums text-[#0b1f3a]">
                  {formatPrice(packagePreview.estimated_total)}
                </span>
                <span className="ml-1">
                  {cycle === "lifetime" ? "once" : cycle === "yearly" ? "/ yr" : "/ mo"}
                </span>
                <span className="ml-1.5">
                  · {packagePreview.selected_module_count} mod
                </span>
              </p>
            ) : (
              <p className="truncate text-[11px] text-muted-foreground">
                Step {stepIndex(step) + 1} of {BUILDER_STEPS.length}
              </p>
            )}
          </div>
          {step === "review" ? (
            <Button
              type="button"
              size="sm"
              className="h-11 min-w-0 flex-1 rounded-full sm:flex-none sm:px-5"
              disabled={!canContinueSignup}
              onClick={continueToSignup}
            >
              Signup
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="h-11 min-w-0 flex-1 rounded-full sm:flex-none sm:px-5"
              disabled={
                (step === "industry" && !industryId) ||
                (step === "category" && !categoryId) ||
                (step === "modules" && !complete.length)
              }
              onClick={goNextStep}
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  memo,
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
import { CustomErpCommercialSummary } from "@/components/commercial/custom-erp-commercial-summary";
import { CustomErpCouponField } from "@/components/commercial/custom-erp-coupon-field";
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
  buildBuilderFeaturePacksForConfiguration,
  builderRecommendationsFromLocalFallback,
  clampTenantLimits,
  defaultTenantLimitsFromCommercial,
  DEFAULT_TENANT_LIMITS,
  filterFeaturePacksForBuilder,
  filterRecommendedFeaturePacks,
  initialSelectedFeaturePackCodes,
  isFeaturePackLocked,
  mapBuilderRecommendations,
  mergeFeaturePackCatalogPrices,
  normPackKey,
  parseInvalidFeaturePackCodes,
  prepareFeaturePackCodesForQuote,
  resolveBuilderRecommendationPackRows,
  pruneSelectedFeaturePackCodes,
  resolveBuilderEligiblePackCodes,
  resolveModuleCodesFromLabels,
  resolveRecommendedConfigurationPackTags,
  resolveTenantUnitPrices,
  resolveTenantUnitPricesFromCommercial,
  stepIndex,
  type BuilderFeaturePack,
  type BuilderStepId,
  type BuilderTenantLimits,
} from "@/lib/commercial/erp-builder-config";
import {
  cycleUnitPrice,
  resolveRequiredDependencies,
  uniqueCategories,
} from "@/lib/commercial/module-builder";
import { browseCategoryForModule, type ModuleBrowseCategory } from "@/lib/commercial/modules-taxonomy";
import { savePlanSelection } from "@/lib/commercial/plan-selection";
import type {
  BillingCycle,
  CatalogBusinessCategory,
  CatalogBuilderRecommendations,
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
  iconBadgeClassName,
  watermarkIconClassName,
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
  iconBadgeClassName?: string;
  watermarkIconClassName?: string;
}) {
  const className = cn(
    "group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200",
    selected
      ? "cursor-pointer border-primary bg-sky-50 shadow-sm ring-2 ring-primary/25"
      : warnBorder
        ? "cursor-pointer border-amber-300 bg-amber-50/40 hover:border-primary hover:bg-sky-50 hover:shadow-sm hover:ring-2 hover:ring-primary/25"
        : "cursor-pointer border-border bg-white hover:border-primary hover:bg-sky-50 hover:shadow-sm hover:ring-2 hover:ring-primary/25",
    disabled && selected && "cursor-default"
  );

  const body = (
    <>
      <span
        className={cn(
          "pointer-events-none absolute -right-1 bottom-0 top-0 flex w-[36%] items-end justify-center pb-3 transition-colors duration-200",
          selected
            ? "bg-sky-100/70"
            : warnBorder
              ? "bg-amber-50/80 group-hover:bg-sky-100/70"
              : "bg-slate-50/80 group-hover:bg-sky-100/70"
        )}
        aria-hidden
      >
        <Icon
          className={cn(
            "h-16 w-16 transition-all duration-300 group-hover:scale-105",
            watermarkIconClassName ??
              (selected
                ? "text-primary/12"
                : warnBorder
                  ? "text-amber-500/12 group-hover:text-primary/12"
                  : "text-slate-400/15 group-hover:text-primary/12")
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
            "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 transition-colors duration-200",
            iconBadgeClassName ??
              (selected
                ? "bg-primary text-white ring-primary/20"
                : "bg-[#0b1f3a]/[0.06] text-[#0b1f3a] ring-[#0b1f3a]/10 group-hover:bg-primary group-hover:text-white group-hover:ring-primary/20")
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3
            className="text-base font-semibold leading-snug tracking-tight text-[#0b1f3a] transition-colors duration-200 group-hover:text-primary"
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
                "text-lg font-bold tabular-nums tracking-tight transition-colors duration-200",
                selected ? "text-primary" : "text-[#0b1f3a] group-hover:text-primary"
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

const MODULE_ICON_COLORS: Record<
  ModuleBrowseCategory,
  { badge: string; watermark: string }
> = {
  Operations: {
    badge: "bg-sky-100 text-sky-600 ring-sky-200",
    watermark: "text-sky-500/30",
  },
  "Sales & CRM": {
    badge: "bg-emerald-100 text-emerald-600 ring-emerald-200",
    watermark: "text-emerald-500/30",
  },
  Finance: {
    badge: "bg-violet-100 text-violet-600 ring-violet-200",
    watermark: "text-violet-500/30",
  },
  People: {
    badge: "bg-rose-100 text-rose-600 ring-rose-200",
    watermark: "text-rose-500/30",
  },
  "Projects & Service": {
    badge: "bg-orange-100 text-orange-600 ring-orange-200",
    watermark: "text-orange-500/30",
  },
  Platform: {
    badge: "bg-indigo-100 text-indigo-600 ring-indigo-200",
    watermark: "text-indigo-500/30",
  },
  "Industry packs": {
    badge: "bg-teal-100 text-teal-600 ring-teal-200",
    watermark: "text-teal-500/30",
  },
};

function moduleIconColors(
  mod: CatalogModule,
  state: { selected: boolean; required: boolean; recommended: boolean }
): { badge: string; watermark: string } {
  if (state.selected) {
    return {
      badge: "bg-primary text-white ring-primary/20",
      watermark: "text-primary/35",
    };
  }
  if (state.required) {
    return {
      badge: "bg-sky-100 text-sky-700 ring-sky-200",
      watermark: "text-sky-500/30",
    };
  }
  if (state.recommended) {
    return {
      badge: "bg-amber-100 text-amber-700 ring-amber-200",
      watermark: "text-amber-500/30",
    };
  }
  return (
    MODULE_ICON_COLORS[browseCategoryForModule(mod)] ?? {
      badge: "bg-slate-100 text-slate-600 ring-slate-200",
      watermark: "text-slate-400/30",
    }
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
  const iconColors = moduleIconColors(mod, { selected, required, recommended });

  return (
    <BuilderSelectCard
      selected={selected}
      disabled={required && selected}
      onClick={onToggle}
      icon={Icon}
      iconBadgeClassName={iconColors.badge}
      watermarkIconClassName={iconColors.watermark}
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

function featurePackCyclePriceLabel(
  cycle: BillingCycle,
  amount: number,
  formatPrice: (n: number) => string
): string {
  const suffix = cycle === "lifetime" ? "one-time" : cycle === "yearly" ? "year" : "month";
  return `+${formatPrice(amount)}/${suffix}`;
}

const FeaturePackCard = memo(function FeaturePackCard({
  pack,
  selected,
  cycle,
  formatPrice,
  moduleLabels,
  onToggle,
}: {
  pack: BuilderFeaturePack;
  selected: boolean;
  cycle: BillingCycle;
  formatPrice: (n: number) => string;
  moduleLabels: Record<string, string>;
  onToggle: () => void;
}) {
  const locked = isFeaturePackLocked(pack);
  const cyclePrice =
    cycle === "yearly"
      ? Number(pack.yearly_price) * 12
      : cycle === "lifetime"
        ? pack.lifetime_price
        : pack.monthly_price;
  const requiredModuleNames = (pack.required_module_codes || [])
    .map((code) => moduleLabels[code] || code)
    .filter(Boolean);

  let footerLeft: ReactNode;
  if (pack.price_pending) {
    footerLeft = <span className="text-sm font-semibold text-muted-foreground">…</span>;
  } else if (pack.included) {
    footerLeft = <span className="text-sm font-bold text-emerald-700">Included</span>;
  } else {
    footerLeft = (
      <span className="text-base font-bold tabular-nums text-[#0b1f3a]">
        {featurePackCyclePriceLabel(cycle, cyclePrice, formatPrice)}
      </span>
    );
  }

  return (
    <BuilderSelectCard
      selected={selected}
      disabled={locked || pack.disabled}
      onClick={onToggle}
      icon={Package}
      title={pack.name}
      description={pack.description || null}
      note={
        requiredModuleNames.length ? (
          <span className="text-xs leading-relaxed text-muted-foreground">
            Requires module{requiredModuleNames.length > 1 ? "s" : ""}:{" "}
            <span className="font-medium text-[#0b1f3a]">
              {requiredModuleNames.join(", ")}
            </span>
          </span>
        ) : null
      }
      badges={
        <>
          {pack.recommended ? (
            <Badge className="border-primary/20 bg-primary/10 text-[10px] text-primary">
              Recommended
            </Badge>
          ) : null}
          {locked ? (
            <Badge className="border-amber-200 bg-amber-50 text-[10px] text-amber-900">
              Auto-added
            </Badge>
          ) : null}
        </>
      }
      footerLeft={footerLeft}
      footerRight={null}
    />
  );
});

function TenantStepper({
  label,
  icon: Icon,
  value,
  min,
  unitPrice,
  formatPrice,
  cycle,
  liveAmount,
  onChange,
}: {
  label: string;
  icon: LucideIcon;
  value: number;
  min: number;
  unitPrice: number;
  formatPrice: (n: number) => string;
  cycle: BillingCycle;
  liveAmount?: number;
  onChange: (n: number) => void;
}) {
  const cycleSuffix = cycle === "lifetime" ? "once" : cycle === "yearly" ? "year" : "month";
  const nextValue = value + 1;
  const nextExtra =
    nextValue > min && unitPrice > 0 ? (nextValue - min) * unitPrice : 0;
  const currentExtra =
    value > min && unitPrice > 0 ? (value - min) * unitPrice : 0;
  const displayExtra =
    liveAmount != null && liveAmount >= 0 ? liveAmount : currentExtra;
  const unitLabel = label.toLowerCase() === "users" ? "seats" : label.toLowerCase();
  const aboveMin = value > min;

  const stepperControlClass = cn(
    "flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border bg-white text-[#0b1f3a] shadow-sm transition-all duration-150",
    "hover:border-primary/45 hover:bg-slate-100 hover:shadow-md",
    "active:scale-95 active:border-primary/55 active:bg-slate-200 active:shadow-inner",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
    "disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none",
    "disabled:hover:border-border disabled:hover:bg-white disabled:hover:shadow-sm disabled:active:scale-100"
  );

  return (
    <BuilderSelectCard
      as="div"
      selected={aboveMin}
      showSelection={false}
      icon={Icon}
      title={label}
      note={
        <span className="space-y-1 block text-sm leading-relaxed text-muted-foreground">
          <span className="block">
            <span className="font-medium text-emerald-700">{min} included</span>
          </span>
          <span className="block">
            Current:{" "}
            <span className="font-semibold text-[#0b1f3a]">
              {value} {unitLabel}
            </span>
            {displayExtra > 0 ? (
              <span className="text-primary">
                {" "}
                · +{formatPrice(displayExtra)}/{cycleSuffix}
              </span>
            ) : (
              <span> · included</span>
            )}
          </span>
          {unitPrice > 0 ? (
            <span className="block text-[11px]">
              Next {label.replace(/s$/, "").toLowerCase()}: {nextValue} · +
              {formatPrice(nextExtra)}/{cycleSuffix}
            </span>
          ) : null}
        </span>
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
            <span className="ml-1 text-xs font-medium text-muted-foreground">{unitLabel}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={stepperControlClass}
              disabled={value <= min}
              onClick={() => onChange(value - 1)}
              aria-label={`Decrease ${label}`}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className={stepperControlClass}
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
  const [couponApplyPending, setCouponApplyPending] = useState(false);
  const [bundleDismissed, setBundleDismissed] = useState(false);
  const [quoteNonce, setQuoteNonce] = useState(0);
  const [commercialOverview, setCommercialOverview] =
    useState<PublicCommercialOverview | null>(null);
  const [builderRecommendations, setBuilderRecommendations] =
    useState<CatalogBuilderRecommendations | null>(null);
  const [builderRequiredModules, setBuilderRequiredModules] = useState<string[]>([]);
  const [builderRecommendedModules, setBuilderRecommendedModules] = useState<string[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  const [recommendationsFallback, setRecommendationsFallback] = useState(false);
  const [, startTransition] = useTransition();
  const restoreCategoryMetaRef = useRef(false);
  const pendingAddCodeRef = useRef<string | null>(null);
  const quoteCacheRef = useRef<Map<string, CustomPackageQuoteResult>>(new Map());
  const quoteRequestIdRef = useRef(0);

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

  const builderSupportPlan = useMemo(() => {
    const customPlanId = commercialOverview?.custom_builder?.plan_id;
    const fromComparison = customPlanId
      ? catalogBundle.data.comparison?.comparison?.find((r) => r.plan?.id === customPlanId)
          ?.plan?.support_level
      : null;
    const fromPlans = catalogBundle.data.pricingPlans?.find(
      (p) =>
        p.id === customPlanId ||
        /custom/i.test(`${p.id || ""} ${p.name || ""}`)
    )?.supportLevel;
    return fromComparison || fromPlans || null;
  }, [commercialOverview, catalogBundle.data]);

  const recommendationPackCodes = useMemo(
    () => resolveBuilderRecommendationPackRows(builderRecommendations).map((row) => row.code),
    [builderRecommendations]
  );

  const recommendedConfigurationPackTags = useMemo(
    () =>
      resolveRecommendedConfigurationPackTags(
        builderRecommendations,
        featurePacks,
        commercialOverview
      ),
    [builderRecommendations, featurePacks, commercialOverview]
  );

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

  const eligiblePackCodes = useMemo(() => {
    if (!builderRecommendations) return [];
    return resolveBuilderEligiblePackCodes(
      builderRecommendations,
      commercialOverview,
      modules,
      complete
    );
  }, [builderRecommendations, commercialOverview, modules, complete]);

  const builderModuleSet = useMemo(
    () =>
      new Set([
        ...builderRequiredModules,
        ...builderRecommendedModules,
      ]),
    [builderRequiredModules, builderRecommendedModules]
  );

  const additionalModules = useMemo(
    () => modules.filter((m) => !builderModuleSet.has(m.code)),
    [modules, builderModuleSet]
  );
  /** Display totals — License Engine quote only (never local arithmetic). */
  const totals = useMemo(() => {
    const fromQuote = quoteCycleTotals(liveQuote);
    if (fromQuote) return fromQuote;
    return { monthly: 0, yearly: 0, lifetime: 0 };
  }, [liveQuote]);
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

  const moduleVisibleFeaturePacks = useMemo(
    () =>
      filterFeaturePacksForBuilder(featurePacks, {
        recommendedPackCodes: eligiblePackCodes,
        selectedModuleCodes: complete,
        modules,
        commercialOverview,
      }),
    [featurePacks, eligiblePackCodes, complete, modules, commercialOverview]
  );

  const filteredFeaturePacks = useMemo(
    () =>
      moduleVisibleFeaturePacks.filter((p) =>
        matchesSearch([p.name, p.code, p.description], searchQ)
      ),
    [moduleVisibleFeaturePacks, searchQ]
  );

  const recommendedFeaturePacks = useMemo(
    () =>
      filterRecommendedFeaturePacks(filteredFeaturePacks, recommendationPackCodes).filter(
        (p) => matchesSearch([p.name, p.code, p.description], searchQ)
      ),
    [filteredFeaturePacks, recommendationPackCodes, searchQ]
  );

  const additionalFeaturePacks = useMemo(() => {
    const recKeys = new Set(
      recommendationPackCodes.map((c) => c.toLowerCase().replace(/[\s_-]+/g, ""))
    );
    return filteredFeaturePacks.filter(
      (p) =>
        !p.required &&
        !recKeys.has(p.code.toLowerCase().replace(/[\s_-]+/g, ""))
    );
  }, [filteredFeaturePacks, recommendationPackCodes]);

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
  const moduleLabelsMap = useMemo(
    () => Object.fromEntries(modules.map((m) => [m.code, m.name] as const)),
    [modules]
  );

  const quotePending = quoteBusy;

  const filteredLockedCodes = useMemo(() => {
    const deps = resolveRequiredDependencies(builderRequiredModules, modules);
    const codes = Array.from(new Set([...builderRequiredModules, ...deps]));
    return codes.filter((code) =>
      matchesSearch([byCode.get(code)?.name, code], searchQ)
    );
  }, [builderRequiredModules, modules, byCode, searchQ]);

  const filteredRecommendedCodes = useMemo(
    () =>
      builderRecommendedModules.filter((code) =>
        matchesSearch([byCode.get(code)?.name, code], searchQ)
      ),
    [builderRecommendedModules, byCode, searchQ]
  );

  const filteredAdditionalModules = useMemo(
    () =>
      additionalModules.filter((m) =>
        matchesSearch([m.name, m.code, m.description, m.industry, m.category], searchQ)
      ),
    [additionalModules, searchQ]
  );

  const activePacks = useMemo(
    () => moduleVisibleFeaturePacks.filter((p) => selectedPacks.includes(p.code)),
    [moduleVisibleFeaturePacks, selectedPacks]
  );

  const selectedPackLines = useMemo(
    () =>
      activePacks.map((p) => ({
        key: p.code,
        name: p.name,
        amount:
          cycle === "yearly"
            ? Number(p.yearly_price) * 12
            : cycle === "lifetime"
              ? p.lifetime_price
              : p.monthly_price,
        included: Boolean(p.included),
      })),
    [activePacks, cycle]
  );

  /** Cart pack total — sum of visible line items (updates instantly on toggle). */
  const packTotal = useMemo(
    () =>
      selectedPackLines.reduce(
        (sum, line) => (line.included ? sum : sum + (Number(line.amount) || 0)),
        0
      ),
    [selectedPackLines]
  );

  const seatLines = useMemo(() => {
    const meta: Record<string, { label: string; unitLabel: string }> = {
      users: { label: "Users", unitLabel: "seats" },
      companies: { label: "Companies", unitLabel: "companies" },
      branches: { label: "Branches", unitLabel: "branches" },
      warehouses: { label: "Warehouses", unitLabel: "warehouses" },
    };
    const fromQuote = liveQuote?.pricing?.seat_overage?.lines || [];
    if (fromQuote.length) {
      return fromQuote.map((line) => ({
        key: line.kind,
        label: meta[line.kind]?.label || line.kind,
        quantity: line.requested,
        included: line.included,
        amount: line.amount,
        unitLabel: meta[line.kind]?.unitLabel || "",
      }));
    }
    const keys = ["users", "companies", "branches", "warehouses"] as const;
    const priceKey =
      cycle === "yearly" ? "yearly" : cycle === "lifetime" ? "lifetime" : "monthly";
    return keys.map((key) => {
      const qty = tenantLimits[key];
      const included = unitPrices[key].included;
      const unit = unitPrices[key][priceKey];
      const extra = Math.max(0, qty - included) * unit;
      return {
        key,
        label: meta[key].label,
        quantity: qty,
        included,
        amount: extra,
        unitLabel: meta[key].unitLabel,
      };
    });
  }, [liveQuote, tenantLimits, unitPrices, cycle]);

  const summaryModuleBreakdown = useMemo(() => {
    const line = (code: string) => {
      const mod = byCode.get(code);
      return {
        key: code,
        name: mod?.name || moduleLabelsMap[code] || code,
        amount: mod ? cycleUnitPrice(mod, cycle) : 0,
      };
    };
    const required = builderRequiredModules
      .filter((c) => complete.includes(c))
      .map(line);
    const recommended = builderRecommendedModules
      .filter((c) => complete.includes(c))
      .map(line);
    const additional = complete
      .filter((c) => !builderModuleSet.has(c))
      .map(line);
    return { required, recommended, additional };
  }, [
    builderRequiredModules,
    builderRecommendedModules,
    complete,
    builderModuleSet,
    byCode,
    moduleLabelsMap,
    cycle,
  ]);

  const seatAmountByKey = useMemo(
    () => new Map(seatLines.map((l) => [l.key, l.amount])),
    [seatLines]
  );

  const packagePreview = useMemo(
    () =>
      buildCustomErpPackagePayload({
        selected_modules: selected.filter((c) => !lockedCodes.includes(c)),
        dependency_modules: lockedCodes,
        recommended_modules: builderRecommendedModules.filter((c) => complete.includes(c)),
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
        support_plan: builderSupportPlan,
        bundle_recommendation: liveQuote?.bundle_offer || null,
      }),
    [
      selected,
      lockedCodes,
      builderRecommendedModules,
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
      builderSupportPlan,
      liveQuote?.bundle_offer,
    ]
  );

  const canContinueSignup =
    complete.length > 0 &&
    Boolean(industryId && categoryId && builderRecommendations) &&
    Boolean(money?.grand_total != null) &&
    !quoteBusy &&
    !quoteError &&
    !couponError &&
    !recommendationsLoading;

  /** Later tabs stay locked until prior selections are done. */
  function canAccessStep(id: BuilderStepId): boolean {
    if (id === "industry") return true;
    if (!industryId) return false;
    if (id === "category") return true;
    if (!categoryId) return false;
    if (id === "recommended") return true;
    if (["modules", "feature-packs", "tenant", "billing"].includes(id)) {
      return Boolean(builderRecommendations) && !recommendationsLoading && !recommendationsError;
    }
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
    setBuilderRequiredModules([]);
    setBuilderRecommendedModules([]);
    setBuilderRecommendations(null);
    setRecommendationsError(null);
    setRecommendationsFallback(false);
    setFeaturePacks([]);
    setSelectedPacks([]);
    setQuery("");
    setCategoryFilter("all");
    setMaxReached("category");
    setStep("category");
  }

  async function loadBuilderRecommendations(
    cat: CatalogBusinessCategory,
    opts?: { preserveSelections?: boolean }
  ) {
    setRecommendationsLoading(true);
    setRecommendationsError(null);
    setRecommendationsFallback(false);
    try {
      const res = await fetch(
        `/api/commercial/builder-recommendations?category_id=${encodeURIComponent(cat.id)}`,
        { cache: "no-store" }
      );
      const json = (await res.json()) as {
        success?: boolean;
        message?: string;
        data?: CatalogBuilderRecommendations;
      };
      if (!res.ok || json.success === false || !json.data) {
        throw new Error(json.message || "Builder recommendations unavailable.");
      }
      applyBuilderRecommendations(json.data, opts);
      setRecommendationsFallback(false);
    } catch (err) {
      if (modules.length) {
        const fallback = builderRecommendationsFromLocalFallback(cat, modules);
        applyBuilderRecommendations(fallback, opts);
        setRecommendationsError(null);
        setRecommendationsFallback(true);
      } else {
        setBuilderRecommendations(null);
        setBuilderRequiredModules([]);
        setBuilderRecommendedModules([]);
        setCategoryRequired([]);
        setSelected([]);
        setFeaturePacks([]);
        setSelectedPacks([]);
        setRecommendationsError(
          err instanceof Error ? err.message : "Builder recommendations unavailable."
        );
        setRecommendationsFallback(false);
      }
    } finally {
      setRecommendationsLoading(false);
    }
  }

  function applyBuilderRecommendations(
    rec: CatalogBuilderRecommendations,
    opts?: { preserveSelections?: boolean }
  ) {
    if (!modules.length) return;
    setBuilderRecommendations(rec);
    const mapped = mapBuilderRecommendations(rec, modules, commercialOverview);
    setBuilderRequiredModules(
      resolveModuleCodesFromLabels(rec.required_modules || [], modules)
    );
    setCategoryRequired(mapped.required_modules);
    setBuilderRecommendedModules(mapped.recommended_modules);
    const pendingAdd = pendingAddCodeRef.current;
    const nextSelected = pendingAdd
      ? Array.from(new Set([...mapped.recommended_modules, pendingAdd]))
      : mapped.recommended_modules;
    if (pendingAdd) pendingAddCodeRef.current = null;
    if (!opts?.preserveSelections) {
      setSelected(nextSelected);
    }

    const eligibleCodes = resolveBuilderEligiblePackCodes(
      rec,
      commercialOverview,
      modules,
      Array.from(new Set([...mapped.required_modules, ...nextSelected]))
    );
    const priced = mergeFeaturePackCatalogPrices(
      buildBuilderFeaturePacksForConfiguration(
        rec,
        commercialOverview,
        modules,
        Array.from(new Set([...mapped.required_modules, ...nextSelected]))
      ),
      commercialOverview
    );
    setFeaturePacks(priced);
    if (!opts?.preserveSelections) {
      const visible = filterFeaturePacksForBuilder(priced, {
        recommendedPackCodes: eligibleCodes,
        selectedModuleCodes: Array.from(
          new Set([...mapped.required_modules, ...nextSelected])
        ),
        modules,
        commercialOverview,
      });
      setSelectedPacks(initialSelectedFeaturePackCodes(visible));
      setTenantLimits(
        clampTenantLimits(
          commercialOverview
            ? defaultTenantLimitsFromCommercial(commercialOverview)
            : {
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
  }

  function selectCategory(cat: CatalogBusinessCategory) {
    setCategoryId(cat.id);
    setQuery("");
    setCategoryFilter("all");
    setMaxReached("recommended");
    setStep("recommended");
    void loadBuilderRecommendations(cat);
  }

  useEffect(() => {
    if (hydrated || !modules.length) return;
    const params = new URLSearchParams(window.location.search);
    const forceFresh = params.get("fresh") === "1";
    const addCodeRaw = (params.get("add") || "").trim().toUpperCase();
    const addCode =
      addCodeRaw && modules.some((m) => m.code.toUpperCase() === addCodeRaw)
        ? modules.find((m) => m.code.toUpperCase() === addCodeRaw)!.code
        : null;

    // Keep Custom ERP selections until signup is finalized (or user switches to a recommended plan / ?fresh=1).
    // Do not wipe session just because the user left signup or reopened the builder without ?edit=1.
    const saved = forceFresh ? null : loadCustomErpPackage();
    const hasSaved =
      Boolean(saved?.selected_modules?.length || saved?.dependency_modules?.length);

    if (hasSaved && saved) {
      pendingAddCodeRef.current = addCode;
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
    } else {
      if (forceFresh) clearCustomErpPackage();
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

  // Restore builder recommendations after edit-mode hydration.
  useEffect(() => {
    if (!hydrated || !restoreCategoryMetaRef.current) return;
    if (!categoryId || !modules.length || !categories.length) return;
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    restoreCategoryMetaRef.current = false;
    void loadBuilderRecommendations(cat, { preserveSelections: true });
  }, [hydrated, categoryId, categories, modules.length]);

  // Rebuild eligible packs when modules, category recommendations, or catalog prices change.
  useEffect(() => {
    if (!builderRecommendations || !modules.length) return;
    const built = buildBuilderFeaturePacksForConfiguration(
      builderRecommendations,
      commercialOverview,
      modules,
      complete
    );
    setFeaturePacks(mergeFeaturePackCatalogPrices(built, commercialOverview));
  }, [builderRecommendations, commercialOverview, modules, complete]);

  // Re-clamp tenant limits when catalog unit prices / included baselines load.
  useEffect(() => {
    if (!commercialOverview) return;
    setTenantLimits((prev) => clampTenantLimits({}, prev, unitPrices));
  }, [commercialOverview, unitPrices]);

  // Keep POS-locked packs in selection.
  useEffect(() => {
    const locked = featurePacks.filter(isFeaturePackLocked).map((p) => p.code);
    if (!locked.length) return;
    setSelectedPacks((prev) => {
      const next = Array.from(new Set([...prev, ...locked]));
      return next.length === prev.length && locked.every((c) => prev.includes(c))
        ? prev
        : next;
    });
  }, [featurePacks]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 7000);
    return () => window.clearTimeout(t);
  }, [notice]);

  const completeKey = complete.join("|");
  const packKey = selectedPacks.slice().sort().join("|");
  const tenantKey = `${tenantLimits.users}|${tenantLimits.companies}|${tenantLimits.branches}|${tenantLimits.warehouses}`;

  // Drop packs whose required modules were removed.
  useEffect(() => {
    if (!hydrated) return;
    setSelectedPacks((prev) => {
      const pruned = pruneSelectedFeaturePackCodes(prev, moduleVisibleFeaturePacks);
      return pruned.length === prev.length && pruned.every((c, i) => c === prev[i])
        ? prev
        : pruned;
    });
  }, [hydrated, moduleVisibleFeaturePacks, completeKey]);

  // Drop legacy category BP packs superseded by Builder Recommendation API packs.
  useEffect(() => {
    if (!hydrated || !builderRecommendations || !selectedPacks.length) return;
    const quoteReady = prepareFeaturePackCodesForQuote(
      selectedPacks,
      builderRecommendations,
      commercialOverview
    );
    if (
      quoteReady.length === selectedPacks.length &&
      quoteReady.every((code, index) => code === selectedPacks[index])
    ) {
      return;
    }
    setSelectedPacks(quoteReady);
  }, [hydrated, builderRecommendations, commercialOverview, selectedPacks]);

  useEffect(() => {
    if (!hydrated) return;
    if (!completeKey) {
      setMoney(null);
      setLiveQuote(null);
      setQuoteError(null);
      setCouponError(null);
      setQuoteBusy(false);
      setCouponApplyPending(false);
      return;
    }

    const moduleCodes = completeKey.split("|").filter(Boolean);
    const normalizedPacks = prepareFeaturePackCodesForQuote(
      selectedPacks,
      builderRecommendations,
      commercialOverview
    );
    const quoteBody = buildCustomPackageQuotePayload({
      product_slug: "waamto-erp",
      billing_cycle: cycle,
      selected_module_codes: moduleCodes,
      discount_code: appliedCoupon,
      industry_id: industryId || null,
      category_id: categoryId || null,
      selected_feature_packs: normalizedPacks,
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
      setCouponApplyPending(false);
      return;
    }

    const controller = new AbortController();
    const requestId = ++quoteRequestIdRef.current;
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

        if (requestId !== quoteRequestIdRef.current) return;

        if (!res.ok || json.success === false || !json.data?.pricing) {
          const msg =
            json.message || "Live pricing is unavailable. Retry to continue.";

          if (
            appliedCoupon &&
            /discount|coupon|promo/i.test(msg)
          ) {
            const retryBody = { ...quoteBody, discount_code: null };
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
            if (requestId !== quoteRequestIdRef.current) return;
            if (retryRes.ok && retryJson.success !== false && retryJson.data?.pricing) {
              const retryCacheKey = JSON.stringify(retryBody);
              setLiveQuote(retryJson.data);
              quoteCacheRef.current.set(retryCacheKey, retryJson.data!);
              setMoney(engineMoneyFromQuote(retryJson.data));
              setQuoteError(null);
              setAppliedCoupon(null);
              setCouponError(
                /not found/i.test(msg) ? "Discount code not found." : msg
              );
              setBundleDismissed(false);
              return;
            }
          }

          if (
            selectedPacks.length &&
            /feature pack/i.test(msg) &&
            quoteBody.selected_feature_packs?.length
          ) {
            const invalidKeys = parseInvalidFeaturePackCodes(msg);
            const retrySelected = invalidKeys.size
              ? selectedPacks.filter((code) => !invalidKeys.has(normPackKey(code)))
              : pruneSelectedFeaturePackCodes(selectedPacks, moduleVisibleFeaturePacks);
            const prunedPacks = prepareFeaturePackCodesForQuote(
              retrySelected,
              builderRecommendations,
              commercialOverview
            );
            if (
              prunedPacks.length &&
              prunedPacks.length !== quoteBody.selected_feature_packs.length
            ) {
              const retryBody = {
                ...quoteBody,
                selected_feature_packs: prunedPacks,
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
              if (requestId !== quoteRequestIdRef.current) return;
              if (retryRes.ok && retryJson.success !== false && retryJson.data?.pricing) {
                setSelectedPacks(prunedPacks);
                json.data = retryJson.data;
              } else {
                setQuoteError(msg);
                if (appliedCoupon) setCouponError(msg);
                return;
              }
            } else {
              setQuoteError(msg);
              if (appliedCoupon) setCouponError(msg);
              return;
            }
          } else {
            setQuoteError(msg);
            if (appliedCoupon) {
              setCouponError(msg);
            } else {
              setCouponError(null);
            }
            return;
          }
        }

        if (requestId !== quoteRequestIdRef.current) return;

        setLiveQuote(json.data);
        quoteCacheRef.current.set(cacheKey, json.data!);
        if (quoteCacheRef.current.size > 40) {
          const first = quoteCacheRef.current.keys().next().value;
          if (first) quoteCacheRef.current.delete(first);
        }
        const pricing = json.data!.pricing;
        const nextMoney = engineMoneyFromQuote(json.data);
        setMoney(nextMoney);
        setQuoteError(null);
        setBundleDismissed(false);

        if (appliedCoupon) {
          if (!couponAppliedInPricing(pricing)) {
            setAppliedCoupon(null);
            setCouponError("This coupon is invalid or not applicable.");
            setQuoteError(null);
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
        if (requestId !== quoteRequestIdRef.current) return;
        const msg =
          err instanceof Error && err.message
            ? err.message
            : "Could not load live pricing from License Engine.";
        setQuoteError(msg);
        if (appliedCoupon) {
          setCouponError("Could not verify coupon right now.");
        }
      } finally {
        if (requestId === quoteRequestIdRef.current) {
          setQuoteBusy(false);
          setCouponApplyPending(false);
        }
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
    commercialOverview,
    builderRecommendations,
    moduleVisibleFeaturePacks,
  ]);

  const handleCouponCodeChange = useCallback((value: string) => {
    setCouponInput(value.toUpperCase());
    setCouponError(null);
  }, []);

  const handleApplyCoupon = useCallback(() => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setAppliedCoupon(null);
      setCouponError(null);
      return;
    }
    if (!complete.length) {
      setCouponError("Select at least one module before applying a coupon.");
      return;
    }
    setCouponError(null);
    setCouponInput(code);
    setCouponApplyPending(true);
    setAppliedCoupon(code);
  }, [couponInput, complete.length]);

  const handleClearCoupon = useCallback(() => {
    setCouponInput("");
    setAppliedCoupon(null);
    setCouponError(null);
    setCouponApplyPending(false);
  }, []);

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
    const pack =
      moduleVisibleFeaturePacks.find((p) => p.code === code) ||
      featurePacks.find((p) => p.code === code);
    if (!pack || isFeaturePackLocked(pack) || pack.disabled) return;
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
      `/signup?plan=${encodeURIComponent(planSlug)}&billing_cycle=${encodeURIComponent(cycle)}`
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
                      Lean essentials from License Engine for{" "}
                      {selectedCategory?.name || "your category"}. Required modules stay
                      locked; recommended modules are editable in the next step.
                    </p>
                    {builderRecommendations?.provisioning_note ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {builderRecommendations.provisioning_note}
                      </p>
                    ) : null}
                    <BuilderSearchField
                      value={query}
                      onChange={setQuery}
                      placeholder={searchPlaceholder}
                      label={searchLabel}
                      className="mt-4 sm:mt-5"
                    />
                  </div>

                  {recommendationsLoading ? (
                    <div className="rounded-2xl border border-dashed border-border bg-slate-50/80 px-6 py-10 text-center text-sm text-muted-foreground">
                      Loading builder recommendations from License Engine…
                    </div>
                  ) : recommendationsError ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-900">
                      <p className="font-semibold">Recommendations unavailable</p>
                      <p className="mt-1 text-xs">{recommendationsError}</p>
                      {selectedCategory ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="mt-3 rounded-full"
                          onClick={() => void loadBuilderRecommendations(selectedCategory)}
                        >
                          Retry
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {recommendationsFallback ? (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:col-span-2">
                          Live License Engine recommendations are temporarily unavailable. Showing
                          offline defaults until the service recovers.
                        </div>
                      ) : null}
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
                                <Badge className="ml-auto bg-primary/10 text-primary text-[10px]">
                                  Required
                                </Badge>
                              </li>
                            ))
                          ) : (
                            <li className="text-muted-foreground">
                              {searchQ ? "No required modules match" : "None required"}
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
                                : "No optional recommendations — customize in the next step"}
                            </li>
                          ) : null}
                        </ul>
                      </div>
                      <div className="rounded-2xl border border-border bg-white p-4 sm:col-span-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Recommended feature packs
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {recommendedConfigurationPackTags.length ? (
                            recommendedConfigurationPackTags.map((p) => (
                              <Badge key={p.code} className="bg-amber-50 text-amber-900">
                                {p.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {searchQ
                                ? "No recommended feature packs match"
                                : recommendationsLoading
                                  ? "Loading feature packs…"
                                  : "No feature packs recommended for this category"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

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
                      disabled={!categoryId || recommendationsLoading || Boolean(recommendationsError)}
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
                        Required modules stay locked. Recommended modules are pre-selected but
                        optional. Add more from Additional modules.
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

                  <div className="mt-5 space-y-8">
                    {filteredLockedCodes.length ? (
                      <section>
                        <h4 className="text-sm font-semibold text-[#0b1f3a]">Required modules</h4>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Essential for {selectedCategory?.name || "your category"} — cannot be removed.
                        </p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {filteredLockedCodes.map((code, i) => {
                            const mod = byCode.get(code);
                            if (!mod) return null;
                            const depNames = (mod.dependencies || [])
                              .map((c) => byCode.get(c)?.name || c)
                              .filter(Boolean);
                            return (
                              <AnimateIn key={code} delay={Math.min(i * 0.03, 0.3)}>
                                <ModuleCard
                                  mod={mod}
                                  selected
                                  required
                                  recommended={builderRequiredModules.includes(code)}
                                  cycle={cycle}
                                  onToggle={() => undefined}
                                  formatPrice={formatPrice}
                                  depNames={depNames}
                                />
                              </AnimateIn>
                            );
                          })}
                        </div>
                      </section>
                    ) : null}

                    {filteredRecommendedCodes.length ? (
                      <section>
                        <h4 className="text-sm font-semibold text-[#0b1f3a]">
                          Recommended modules
                        </h4>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Suggested by License Engine — toggle freely.
                        </p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {filteredRecommendedCodes.map((code, i) => {
                            const mod = byCode.get(code);
                            if (!mod) return null;
                            const depNames = (mod.dependencies || [])
                              .map((c) => byCode.get(c)?.name || c)
                              .filter(Boolean);
                            const isSelected = complete.includes(code);
                            return (
                              <AnimateIn key={code} delay={Math.min(i * 0.03, 0.3)}>
                                <ModuleCard
                                  mod={mod}
                                  selected={isSelected}
                                  required={false}
                                  recommended
                                  cycle={cycle}
                                  onToggle={() => toggleModule(code)}
                                  formatPrice={formatPrice}
                                  depNames={depNames}
                                />
                              </AnimateIn>
                            );
                          })}
                        </div>
                      </section>
                    ) : null}

                    <section>
                      <h4 className="text-sm font-semibold text-[#0b1f3a]">Additional modules</h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Everything else in the catalog — unselected by default.
                      </p>
                      {filteredAdditionalModules.length === 0 ? (
                        <div className="mt-3 rounded-2xl border border-dashed border-border bg-slate-50/80 px-6 py-10 text-center">
                          <p className="text-sm font-medium text-[#0b1f3a]">
                            {searchQ ? "No additional modules match your search" : "No additional modules"}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {filteredAdditionalModules.map((mod, i) => {
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
                                  recommended={false}
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
                    </section>
                  </div>
                </div>
              ) : null}

              {step === "feature-packs" ? (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-[#0b1f3a]">Feature packs</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Packs shown match your industry, category, and selected modules.
                        Prices load live from the Product Catalog.
                      </p>
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

                  {!builderRecommendations ? (
                    <div className="rounded-2xl border border-dashed border-border bg-slate-50/80 px-6 py-10 text-center text-sm text-muted-foreground">
                      Select a category to load feature packs for your business profile.
                    </div>
                  ) : filteredFeaturePacks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-slate-50/80 px-6 py-10 text-center text-sm text-muted-foreground">
                      {searchQ
                        ? "No feature packs match your search."
                        : "No Feature Packs available for your current configuration."}
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {recommendedFeaturePacks.length ? (
                        <section className="space-y-3">
                          <div>
                            <h4 className="text-sm font-semibold text-[#0b1f3a]">
                              Recommended for your business
                            </h4>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Pre-selected from your industry profile. You can deselect any pack
                              that is not required.
                            </p>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {recommendedFeaturePacks.map((pack) => (
                              <FeaturePackCard
                                key={pack.code}
                                pack={pack}
                                selected={selectedPacks.includes(pack.code)}
                                cycle={cycle}
                                formatPrice={formatPrice}
                                moduleLabels={moduleLabelsMap}
                                onToggle={() => togglePack(pack.code)}
                              />
                            ))}
                          </div>
                        </section>
                      ) : null}

                      {additionalFeaturePacks.length ? (
                        <section className="space-y-3">
                          <div>
                            <h4 className="text-sm font-semibold text-[#0b1f3a]">
                              Additional feature packs
                            </h4>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Optional add-ons from the Product Catalog — select manually.
                            </p>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {additionalFeaturePacks.map((pack) => (
                              <FeaturePackCard
                                key={pack.code}
                                pack={pack}
                                selected={selectedPacks.includes(pack.code)}
                                cycle={cycle}
                                formatPrice={formatPrice}
                                moduleLabels={moduleLabelsMap}
                                onToggle={() => togglePack(pack.code)}
                              />
                            ))}
                          </div>
                        </section>
                      ) : null}
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
                          liveAmount={seatAmountByKey.get(row.key)}
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

                  {builderSupportPlan ? (
                    <div className="rounded-2xl border border-border bg-slate-50 px-4 py-3.5">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Support plan
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#0b1f3a]">
                        {builderSupportPlan}
                        <span className="ml-1 text-xs font-medium text-emerald-700">
                          Included
                        </span>
                      </p>
                    </div>
                  ) : null}
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
                        <CustomErpCouponField
                          couponCode={couponInput}
                          onCouponCodeChange={handleCouponCodeChange}
                          onApplyCoupon={handleApplyCoupon}
                          onClearCoupon={handleClearCoupon}
                          couponError={couponError}
                          couponBusy={couponApplyPending}
                          couponApplied={Boolean(money?.discount_code) && !couponError}
                          appliedCode={money?.discount_code}
                          discountAmount={money?.discount_amount}
                          formatPrice={formatPrice}
                          showDiscount={(money?.discount_amount ?? 0) > 0}
                          disabled={!complete.length}
                          className="mb-3"
                        />
                        <CustomErpCommercialSummary
                          cycle={cycle}
                          money={money}
                          liveQuote={liveQuote}
                          quotePending={quotePending}
                          moduleCodes={complete}
                          moduleLabels={moduleLabelsMap}
                          moduleBreakdown={summaryModuleBreakdown}
                          selectedPackLines={selectedPackLines}
                          featurePackCount={activePacks.length}
                          featurePackTotal={packTotal}
                          tenantAddonTotal={tenantAddon}
                          seatLines={seatLines}
                          bundleSavings={liveQuote?.bundle_offer?.bundle_savings ?? 0}
                          appliedCouponCode={appliedCoupon}
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
                            Build my ERP — continue to checkout
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
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
                      <p className="font-semibold">Live pricing unavailable</p>
                      <p className="mt-1 text-xs text-rose-800/90">{quoteError}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-2 rounded-full border-rose-300 bg-white"
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

                  {quoteBusy && !money && !liveQuote ? (
                    <div className="animate-pulse space-y-3 rounded-2xl border-2 border-sky-200 bg-sky-50 p-5">
                      <div className="h-4 w-1/3 rounded bg-sky-200/80" />
                      <div className="h-10 w-2/3 rounded bg-sky-200/80" />
                      <div className="h-3 w-full rounded bg-sky-100" />
                      <div className="h-3 w-5/6 rounded bg-sky-100" />
                    </div>
                  ) : (
                    <div className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-3 shadow-sm">
                      <CustomErpCouponField
                        couponCode={couponInput}
                        onCouponCodeChange={handleCouponCodeChange}
                        onApplyCoupon={handleApplyCoupon}
                        onClearCoupon={handleClearCoupon}
                        couponError={couponError}
                        couponBusy={couponApplyPending}
                        couponApplied={Boolean(money?.discount_code) && !couponError}
                        appliedCode={money?.discount_code}
                        discountAmount={money?.discount_amount}
                        formatPrice={formatPrice}
                        showDiscount={(money?.discount_amount ?? 0) > 0}
                        disabled={!complete.length}
                        className="mb-3"
                      />
                      <CustomErpCommercialSummary
                        cycle={cycle}
                        money={money}
                        liveQuote={liveQuote}
                        quotePending={quotePending}
                        moduleCodes={complete}
                        moduleLabels={moduleLabelsMap}
                        moduleBreakdown={summaryModuleBreakdown}
                        selectedPackLines={selectedPackLines}
                        featurePackCount={activePacks.length}
                        featurePackTotal={packTotal}
                        tenantAddonTotal={tenantAddon}
                        seatLines={seatLines}
                        bundleSavings={liveQuote?.bundle_offer?.bundle_savings ?? 0}
                        appliedCouponCode={appliedCoupon}
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

                  {builderRecommendedModules.some((c) => !complete.includes(c)) &&
                  step === "modules" ? (
                    <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4 shadow-sm">
                      <p className="text-xs font-medium uppercase tracking-wide text-sky-800/80">
                        Recommended modules
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {builderRecommendedModules
                          .filter((c) => !complete.includes(c))
                          .map((code) => (
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

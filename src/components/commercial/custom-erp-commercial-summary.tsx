"use client";

import { memo, useMemo, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/components/providers/locale-provider";
import type { BillingCycle, CustomPackageQuoteResult } from "@/lib/commercial/types";
import type { CustomErpPackageMoneyBreakdown } from "@/lib/signup/custom-package";
import { cn } from "@/lib/utils";

export type CommercialSummarySeatLine = {
  key: string;
  label: string;
  quantity: number;
  included: number;
  amount: number;
  unitLabel: string;
};

export type CommercialSummaryModuleLine = {
  key: string;
  name: string;
  amount: number;
};

export type CommercialSummaryFeaturePackLine = {
  key: string;
  name: string;
  amount: number;
  included?: boolean;
};

type Props = {
  cycle: BillingCycle;
  money: CustomErpPackageMoneyBreakdown | null;
  liveQuote: CustomPackageQuoteResult | null;
  quotePending?: boolean;
  moduleCodes: string[];
  moduleLabels: Record<string, string>;
  moduleBreakdown?: {
    required: CommercialSummaryModuleLine[];
    recommended: CommercialSummaryModuleLine[];
    additional: CommercialSummaryModuleLine[];
  };
  selectedPackLines: CommercialSummaryFeaturePackLine[];
  featurePackCount: number;
  featurePackTotal: number;
  tenantAddonTotal: number;
  seatLines: CommercialSummarySeatLine[];
  bundleSavings?: number;
  /** Optimistic coupon code while Engine quote is in flight. */
  appliedCouponCode?: string | null;
  className?: string;
};

const MODULE_PREVIEW = 5;

function cycleSuffix(cycle: BillingCycle): string {
  // Custom ERP never presents Lifetime; coerce defensive leftovers.
  if (cycle === "yearly") return "year";
  return "month";
}

function LiveAmount({
  value,
  formatPrice,
  pending,
  className,
  prefix = "",
}: {
  value: number;
  formatPrice: (n: number) => string;
  pending?: boolean;
  className?: string;
  prefix?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block tabular-nums transition-opacity duration-300",
        pending && "opacity-70",
        className
      )}
    >
      {prefix}
      {formatPrice(value)}
    </span>
  );
}

function AccordionSection({
  id,
  title,
  count,
  amount,
  formatPrice,
  pending,
  children,
  open,
  onToggle,
}: {
  id: string;
  title: string;
  count?: number;
  amount?: number;
  formatPrice: (n: number) => string;
  pending?: boolean;
  children: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-slate-50/60 overflow-hidden">
      <button
        type="button"
        id={`${id}-trigger`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-slate-100/80 transition-colors"
        onClick={onToggle}
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
          {count != null ? (
            <span className="ml-1.5 font-medium normal-case text-[#0b1f3a]">({count})</span>
          ) : null}
        </span>
        <span className="flex items-center gap-1.5">
          {amount != null ? (
            <LiveAmount
              value={amount}
              formatPrice={formatPrice}
              pending={id === "summary-packs" ? false : pending}
              className="text-sm font-bold text-[#0b1f3a]"
            />
          ) : null}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform duration-300",
              open && "rotate-180"
            )}
          />
        </span>
      </button>
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-trigger`}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-in-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-1 border-t border-border/60 px-3 py-2 text-xs">{children}</div>
        </div>
      </div>
    </div>
  );
}

export const CustomErpCommercialSummary = memo(function CustomErpCommercialSummary({
  cycle,
  money,
  liveQuote,
  quotePending,
  moduleCodes,
  moduleLabels,
  moduleBreakdown,
  selectedPackLines,
  featurePackCount,
  featurePackTotal,
  tenantAddonTotal,
  seatLines,
  bundleSavings = 0,
  appliedCouponCode = null,
  className,
}: Props) {
  const { formatPrice } = useLocale();
  const [showAllModules, setShowAllModules] = useState(false);
  const [openSections, setOpenSections] = useState({
    modules: false,
    packs: false,
    tenant: false,
  });

  const cycleLabel =
    cycle === "lifetime" ? "one-time" : cycle === "yearly" ? "/ year" : "/ month";
  const cycleShort = cycleSuffix(cycle);

  const pricing = liveQuote?.pricing;
  const enginePackTotal = Number(pricing?.feature_pack_total ?? 0);
  const modulesSubtotal =
    pricing?.modules_subtotal ??
    Math.max(
      0,
      (pricing?.subtotal ?? money?.subtotal ?? 0) -
        featurePackTotal -
        (pricing?.seat_overage_total ?? tenantAddonTotal)
    );
  const discountAmount = money?.discount_amount ?? pricing?.discount_amount ?? 0;
  const appliedDiscountCode =
    money?.discount_code ?? pricing?.discount_code ?? appliedCouponCode ?? null;
  const taxAmount = money?.tax_amount ?? pricing?.tax_amount ?? 0;
  const taxLabel =
    money?.tax_label ||
    (pricing?.taxes?.[0]
      ? `${pricing.taxes[0].name || pricing.taxes[0].code || "Tax"}${
          pricing.taxes[0].rate ? ` (${pricing.taxes[0].rate}%)` : ""
        }`
      : "Tax");
  const grandTotalRaw = money?.grand_total ?? pricing?.grand_total ?? 0;
  /** Keep grand total aligned with catalog pack lines while Engine catches up. */
  const grandTotal =
    grandTotalRaw > 0 || pricing || money
      ? grandTotalRaw - enginePackTotal + featurePackTotal
      : grandTotalRaw;

  const moduleNames = useMemo(
    () => moduleCodes.map((c) => moduleLabels[c] || c).filter(Boolean),
    [moduleCodes, moduleLabels]
  );
  const visibleModules = showAllModules
    ? moduleNames
    : moduleNames.slice(0, MODULE_PREVIEW);
  const hiddenModuleCount = Math.max(0, moduleNames.length - MODULE_PREVIEW);

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  function renderModuleLine(line: CommercialSummaryModuleLine) {
    return (
      <li
        key={line.key}
        className="flex items-center justify-between gap-2 py-0.5 text-[#0b1f3a]"
      >
        <span className="min-w-0 truncate">{line.name}</span>
        <span className="shrink-0 text-xs font-semibold tabular-nums">
          {line.amount > 0 ? (
            <>
              +
              <LiveAmount
                value={line.amount}
                formatPrice={formatPrice}
                pending={quotePending}
              />
            </>
          ) : (
            <span className="font-normal text-muted-foreground">—</span>
          )}
        </span>
      </li>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles className="h-4 w-4 text-sky-700" />
        <h2 className="text-sm font-semibold text-[#0b1f3a]">Package summary</h2>
        <Badge className="bg-sky-700 text-white hover:bg-sky-700 capitalize">{cycle}</Badge>
      </div>

      <div className="rounded-xl bg-[#0b1f3a] px-3.5 py-3 text-white">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-white/60">
              Grand total
            </p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">
              <LiveAmount
                value={grandTotal}
                formatPrice={formatPrice}
                pending={false}
              />
              <span className="ml-1.5 text-sm font-normal text-white/70">{cycleLabel}</span>
            </p>
          </div>
          <div className="shrink-0 space-y-1.5 text-right text-[11px] sm:text-xs">
            <div className="flex items-center justify-end gap-2">
              <span className="text-white/60">{taxLabel}</span>
              <span className="font-semibold tabular-nums text-white">
                {formatPrice(taxAmount)}
              </span>
            </div>
            {appliedDiscountCode ? (
              <div className="flex items-center justify-end gap-2">
                <span className="text-white/60">
                  Coupon{appliedDiscountCode ? ` (${appliedDiscountCode})` : ""}
                </span>
                <span className="font-semibold tabular-nums text-emerald-300">
                  {discountAmount > 0 ? `−${formatPrice(discountAmount)}` : formatPrice(0)}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <AccordionSection
          id="summary-modules"
          title="Modules"
          count={moduleNames.length}
          amount={modulesSubtotal}
          formatPrice={formatPrice}
          pending={quotePending}
          open={openSections.modules}
          onToggle={() => toggleSection("modules")}
        >
          {moduleBreakdown ? (
            <div className="space-y-2">
              {moduleBreakdown.required.length ? (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Required ({moduleBreakdown.required.length})
                  </p>
                  <ul className="mt-0.5 space-y-0.5">
                    {moduleBreakdown.required.map((line) => renderModuleLine(line))}
                  </ul>
                </div>
              ) : null}
              {moduleBreakdown.recommended.length ? (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Recommended ({moduleBreakdown.recommended.length})
                  </p>
                  <ul className="mt-0.5 space-y-0.5">
                    {moduleBreakdown.recommended.map((line) => renderModuleLine(line))}
                  </ul>
                </div>
              ) : null}
              {moduleBreakdown.additional.length ? (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Additional ({moduleBreakdown.additional.length})
                  </p>
                  <ul className="mt-0.5 space-y-0.5">
                    {(showAllModules
                      ? moduleBreakdown.additional
                      : moduleBreakdown.additional.slice(0, MODULE_PREVIEW)
                    ).map((line) => renderModuleLine(line))}
                  </ul>
                  {moduleBreakdown.additional.length > MODULE_PREVIEW ? (
                    <button
                      type="button"
                      className="mt-1 text-[11px] font-semibold text-primary hover:underline"
                      onClick={() => setShowAllModules((v) => !v)}
                    >
                      {showAllModules
                        ? "Show less"
                        : `Show ${moduleBreakdown.additional.length - MODULE_PREVIEW} more`}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <ul className="space-y-0.5 text-[#0b1f3a]">
                {visibleModules.map((name) => (
                  <li key={name} className="truncate">
                    {name}
                  </li>
                ))}
              </ul>
              {hiddenModuleCount > 0 ? (
                <button
                  type="button"
                  className="mt-1 text-[11px] font-semibold text-primary hover:underline"
                  onClick={() => setShowAllModules((v) => !v)}
                >
                  {showAllModules ? "Show less" : `Show ${hiddenModuleCount} more`}
                </button>
              ) : null}
            </>
          )}
          <div className="mt-1.5 flex justify-between border-t border-border/50 pt-1.5 font-medium">
            <span className="text-muted-foreground">
              {moduleNames.length} module{moduleNames.length === 1 ? "" : "s"}
            </span>
            <LiveAmount
              value={modulesSubtotal}
              formatPrice={formatPrice}
              pending={quotePending}
              className="text-[#0b1f3a]"
            />
          </div>
        </AccordionSection>

        <AccordionSection
          id="summary-packs"
          title="Feature packs"
          count={featurePackCount}
          amount={featurePackTotal}
          formatPrice={formatPrice}
          pending={quotePending}
          open={openSections.packs}
          onToggle={() => toggleSection("packs")}
        >
          {selectedPackLines.length ? (
            <ul className="space-y-0.5">
              {selectedPackLines.map((line) => (
                <li
                  key={line.key}
                  className="flex items-center justify-between gap-2 py-0.5 text-[#0b1f3a]"
                >
                  <span className="min-w-0 truncate">{line.name}</span>
                  <span className="shrink-0 text-xs font-semibold tabular-nums">
                    {line.included ? (
                      <span className="font-normal text-emerald-700">Included</span>
                    ) : (
                      <>
                        +
                        <LiveAmount
                          value={line.amount}
                          formatPrice={formatPrice}
                          pending={false}
                        />
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No feature packs selected</p>
          )}
          <div className="mt-1.5 flex justify-between border-t border-border/50 pt-1.5 font-medium">
            <span className="text-muted-foreground">
              {featurePackCount} pack{featurePackCount === 1 ? "" : "s"}
            </span>
            <span className="text-[#0b1f3a]">
              {featurePackTotal > 0 ? "+" : ""}
              <LiveAmount
                value={featurePackTotal}
                formatPrice={formatPrice}
                pending={false}
              />
              /{cycleShort}
            </span>
          </div>
        </AccordionSection>

        <AccordionSection
          id="summary-tenant"
          title="Tenant limits"
          amount={tenantAddonTotal}
          formatPrice={formatPrice}
          pending={quotePending}
          open={openSections.tenant}
          onToggle={() => toggleSection("tenant")}
        >
          {seatLines.map((line) => (
            <div key={line.key} className="flex justify-between gap-2 py-0.5">
              <span className="min-w-0 truncate text-muted-foreground">
                {line.label}{" "}
                <span className="text-[#0b1f3a]">
                  {line.quantity} {line.unitLabel}
                </span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-[#0b1f3a]">
                {line.amount > 0 ? (
                  <>
                    +
                    <LiveAmount
                      value={line.amount}
                      formatPrice={formatPrice}
                      pending={quotePending}
                    />
                  </>
                ) : (
                  <span className="font-normal text-emerald-700">Included</span>
                )}
              </span>
            </div>
          ))}
          <div className="mt-1.5 flex justify-between border-t border-border/50 pt-1.5 font-semibold">
            <span className="text-muted-foreground">Tenant total</span>
            <span className="text-[#0b1f3a]">
              {tenantAddonTotal > 0 ? "+" : ""}
              <LiveAmount
                value={tenantAddonTotal}
                formatPrice={formatPrice}
                pending={quotePending}
              />
              /{cycleShort}
            </span>
          </div>
        </AccordionSection>

        {bundleSavings > 0 ? (
          <div className="flex justify-between rounded-xl border border-sky-200 bg-sky-50/70 px-3 py-2 text-sm">
            <span className="text-sky-900">Bundle savings</span>
            <span className="font-semibold tabular-nums text-sky-900">
              −
              <LiveAmount
                value={bundleSavings}
                formatPrice={formatPrice}
                pending={quotePending}
              />
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
});

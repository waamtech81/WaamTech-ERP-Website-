"use client";

import Link from "next/link";
import { Info, Sparkles, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/components/providers/locale-provider";
import { USER_LIMIT_NOTE } from "@/lib/commercial/module-builder";
import { normalizeCustomErpBillingCycle } from "@/lib/commercial/custom-erp-billing";
import type { BillingCycle } from "@/lib/commercial/types";
import {
  moduleLabel,
  type CustomErpPackageMoneyBreakdown,
  type CustomErpPackagePayload,
} from "@/lib/signup/custom-package";
import { cn } from "@/lib/utils";

type Props = {
  package: CustomErpPackagePayload;
  /** When true, billing cycle is display-only (signup). Builder uses page-level cycle control. */
  readOnly?: boolean;
  /** Signup / callout layout — matches POS & Mobile required cards. */
  compact?: boolean;
  cycle?: BillingCycle;
  totals?: { monthly: number; yearly: number; lifetime: number };
  money?: CustomErpPackageMoneyBreakdown | null;
  showEditLink?: boolean;
  /** Builder: coupon input + apply — omit when coupon is rendered externally. */
  hideCoupon?: boolean;
  couponCode?: string;
  onCouponCodeChange?: (value: string) => void;
  onApplyCoupon?: () => void;
  onClearCoupon?: () => void;
  couponError?: string | null;
  couponBusy?: boolean;
  /** Live quote module subtotal when available (Engine SSOT). */
  modulesSubtotal?: number | null;
  className?: string;
};

function usePackageTotals(
  pkg: CustomErpPackagePayload,
  cycleProp?: BillingCycle,
  totalsProp?: { monthly: number; yearly: number; lifetime: number },
  moneyProp?: CustomErpPackageMoneyBreakdown | null,
  modulesSubtotalProp?: number | null
) {
  const cycle = normalizeCustomErpBillingCycle(cycleProp || pkg.billing_cycle);
  const totals = totalsProp || {
    monthly: pkg.monthly_price,
    yearly: pkg.yearly_price,
    lifetime: pkg.lifetime_price,
  };
  const cycleSubtotal = cycle === "yearly" ? totals.yearly : totals.monthly;
  const money = moneyProp ?? pkg.money ?? null;
  const tenantAddon = Number(pkg.tenant_addon_total) || 0;
  const featurePackTotal = Number(pkg.feature_pack_total) || 0;
  // Engine grand_total is SSOT when present (already includes seats/packs/tax).
  const displayTotal = money?.grand_total != null ? money.grand_total : cycleSubtotal;
  const modulePayable = money?.subtotal ?? cycleSubtotal;
  const cycleLabel = cycle === "yearly" ? "/ year" : "/ month";
  const cycleName = cycle === "yearly" ? "Yearly" : "Monthly";
  const discountAmount = money?.discount_amount ?? 0;
  const taxAmount = money?.tax_amount ?? 0;
  return {
    cycle,
    totals,
    cycleSubtotal,
    money,
    displayTotal,
    modulePayable,
    tenantAddon,
    featurePackTotal,
    cycleLabel,
    cycleName,
    discountAmount,
    taxAmount,
    showDiscount: discountAmount > 0,
    showTax: taxAmount > 0,
    showBreakdown:
      Boolean(money) ||
      discountAmount > 0 ||
      taxAmount > 0 ||
      tenantAddon + featurePackTotal > 0 ||
      modulesSubtotalProp != null,
  };
}

function CompactSignupSummary({
  pkg,
  showEditLink,
  className,
}: {
  pkg: CustomErpPackagePayload;
  showEditLink?: boolean;
  className?: string;
}) {
  const { formatPrice } = useLocale();
  const {
    cycle,
    displayTotal,
    cycleLabel,
    money,
    discountAmount,
    taxAmount,
    showDiscount,
    showTax,
  } = usePackageTotals(pkg);

  const selectedNames = pkg.selected_modules.map((c) => moduleLabel(pkg, c)).filter(Boolean);
  const depNames = pkg.dependency_modules.map((c) => moduleLabel(pkg, c)).filter(Boolean);
  const contextNote = [pkg.industry_name, pkg.category_name].filter(Boolean).join(" · ");
  const moduleNote = [
    selectedNames.length ? selectedNames.join(", ") : "No modules selected",
    depNames.length ? `Required deps: ${depNames.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={cn(
        "rounded-2xl border-2 border-sky-400 bg-sky-50 p-4 md:p-5 transition-colors",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge className="bg-sky-700 px-2.5 py-1 text-xs font-semibold tracking-wide text-white hover:bg-sky-700">
              Build your own custom ERP
            </Badge>
            <Badge
              variant="outline"
              className="border-sky-300 bg-white text-[11px] font-medium capitalize text-sky-800"
            >
              Custom package · {cycle}
            </Badge>
            {money?.discount_code ? (
              <Badge className="bg-emerald-700 text-white hover:bg-emerald-700">
                Coupon {money.discount_code}
              </Badge>
            ) : null}
            {showEditLink ? (
              <Link
                href="/build-your-own-erp?edit=1"
                className="ml-auto text-xs font-semibold text-sky-800 hover:underline"
              >
                Edit package →
              </Link>
            ) : null}
          </div>
          <p className="text-2xl font-bold tabular-nums tracking-tight text-[#0b1f3a] sm:text-3xl">
            {formatPrice(displayTotal)}
            <span className="ml-1.5 text-sm font-medium text-sky-800 sm:text-base">
              {cycleLabel}
            </span>
          </p>
          <p className="mt-1 text-sm font-medium text-sky-900/80">
            {pkg.selected_module_count} module
            {pkg.selected_module_count === 1 ? "" : "s"} selected
          </p>
          {(showDiscount || showTax) && (
            <p className="mt-1 text-sm leading-relaxed">
              {showDiscount ? (
                <span className="font-medium text-emerald-700">
                  −{formatPrice(discountAmount)}
                  {money?.discount_code ? ` with ${money.discount_code}` : ""}
                </span>
              ) : null}
              {showDiscount && showTax ? (
                <span className="text-muted-foreground"> · </span>
              ) : null}
              {showTax ? (
                <span className="text-muted-foreground">
                  {money?.tax_label || "Tax"} {formatPrice(taxAmount)}
                </span>
              ) : null}
            </p>
          )}
          {contextNote ? (
            <p className="mt-1.5 text-sm leading-relaxed text-[#0b1f3a]">{contextNote}</p>
          ) : null}
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{moduleNote}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Mobile app included free · {USER_LIMIT_NOTE}
          </p>
        </div>
      </div>
    </div>
  );
}

export function CustomErpPackageSummary({
  package: pkg,
  readOnly = true,
  compact = false,
  cycle: cycleProp,
  totals: totalsProp,
  money: moneyProp,
  showEditLink = false,
  hideCoupon = false,
  couponCode,
  onCouponCodeChange,
  onApplyCoupon,
  onClearCoupon,
  couponError,
  couponBusy,
  modulesSubtotal,
  className,
}: Props) {
  const { formatPrice } = useLocale();
  const {
    cycleSubtotal,
    money,
    displayTotal,
    modulePayable,
    tenantAddon,
    featurePackTotal,
    cycleLabel,
    cycleName,
    discountAmount,
    taxAmount,
    showDiscount,
    showTax,
    showBreakdown,
  } = usePackageTotals(pkg, cycleProp, totalsProp, moneyProp, modulesSubtotal);
  const canEditCoupon =
    !hideCoupon && !readOnly && onCouponCodeChange && onApplyCoupon;
  const couponApplied = Boolean(money?.discount_code) && !couponError;
  const packNames = (pkg.feature_packs || []).map((p) => p.name).filter(Boolean);
  const limits = pkg.tenant_limits;
  const baseModulesTotal =
    modulesSubtotal != null ? modulesSubtotal : (money?.subtotal ?? modulePayable);

  if (compact) {
    return (
      <CompactSignupSummary pkg={pkg} showEditLink={showEditLink} className={className} />
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-white p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Sparkles className="h-4 w-4 text-sky-700" />
          <h2 className="text-sm font-semibold text-[#0b1f3a]">Package summary</h2>
          <Badge className="bg-sky-700 text-white hover:bg-sky-700">
            Build your own custom ERP
          </Badge>
        </div>
        {showEditLink ? (
          <Button asChild variant="outline" size="sm" className="rounded-full shrink-0">
            <Link href="/build-your-own-erp?edit=1">Edit package</Link>
          </Button>
        ) : null}
      </div>
      <p className="mt-1 text-xs leading-snug text-muted-foreground">
        Live total updates as industry, modules, packs, seats, and billing change.
      </p>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[#0b1f3a] px-3.5 py-3 text-white">
        <p className="min-w-0 text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">
          {formatPrice(displayTotal)}
          <span className="ml-1.5 text-sm font-normal text-white/70 sm:text-base">
            {cycleLabel}
          </span>
        </p>
        <p className="shrink-0 text-xs text-white/60">
          {cycleName} · {pkg.selected_module_count} module
          {pkg.selected_module_count === 1 ? "" : "s"}
        </p>
      </div>

      {canEditCoupon ? (
        <div
          className={cn(
            "mt-3 rounded-xl border-2 p-3",
            couponError
              ? "border-rose-300 bg-rose-50/80"
              : couponApplied
                ? "border-emerald-300 bg-emerald-50/70"
                : "border-amber-300 bg-amber-50/60"
          )}
        >
          <label
            htmlFor="custom-erp-coupon"
            className="flex items-center gap-1.5 text-sm font-semibold text-[#0b1f3a]"
          >
            <Tag className="h-4 w-4 text-amber-700" />
            Coupon / discount code
          </label>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Enter a promo code — Apply updates your payable total.
          </p>
          <div className="mt-2.5 flex gap-2">
            <input
              id="custom-erp-coupon"
              type="text"
              value={couponCode || ""}
              onChange={(e) => onCouponCodeChange?.(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onApplyCoupon?.();
                }
              }}
              placeholder="e.g. SAVE20"
              autoComplete="off"
              spellCheck={false}
              className={cn(
                "h-11 min-w-0 flex-1 rounded-full border bg-white px-4 text-sm font-semibold uppercase tracking-wide text-[#0b1f3a] outline-none focus-visible:ring-2",
                couponError
                  ? "border-rose-400 focus-visible:ring-rose-300/40"
                  : couponApplied
                    ? "border-emerald-400 focus-visible:ring-emerald-300/40"
                    : "border-amber-300 focus-visible:border-primary/40 focus-visible:ring-primary/20"
              )}
            />
            <Button
              type="button"
              className="h-11 shrink-0 rounded-full px-5"
              disabled={couponBusy || !pkg.selected_module_count}
              onClick={onApplyCoupon}
            >
              {couponBusy ? "…" : "Apply"}
            </Button>
          </div>
          {couponError ? (
            <p className="mt-2 text-xs font-medium text-rose-700" role="alert">
              {couponError}
            </p>
          ) : couponApplied ? (
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-emerald-800">
                Applied: {money?.discount_code}
                {showDiscount ? ` (−${formatPrice(discountAmount)})` : ""}
              </p>
              {onClearCoupon ? (
                <button
                  type="button"
                  onClick={onClearCoupon}
                  className="text-xs font-medium text-emerald-900 underline-offset-2 hover:underline"
                >
                  Remove
                </button>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Optional — leave blank if you don&apos;t have a code.
            </p>
          )}
        </div>
      ) : null}

      {showBreakdown || showDiscount || showTax ? (
        <div className="mt-3 space-y-1.5 border-b border-border pb-3 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Base package · modules</span>
            <span className="font-semibold tabular-nums text-[#0b1f3a]">
              {formatPrice(baseModulesTotal)}
            </span>
          </div>
          {(featurePackTotal > 0 || packNames.length > 0) ? (
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">
                Feature Packs
                {packNames.length ? ` (${packNames.length})` : ""}
              </span>
              <span className="font-semibold tabular-nums text-[#0b1f3a]">
                {featurePackTotal > 0 ? "+" : ""}
                {formatPrice(featurePackTotal)}
              </span>
            </div>
          ) : null}
          {tenantAddon > 0 ? (
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Extra limits</span>
              <span className="font-semibold tabular-nums text-[#0b1f3a]">
                +{formatPrice(tenantAddon)}
              </span>
            </div>
          ) : null}
          {showDiscount ? (
            <div className="flex justify-between gap-3 text-emerald-700">
              <span>
                Discount
                {money?.discount_code ? (
                  <span className="ml-1 font-medium">({money.discount_code})</span>
                ) : null}
              </span>
              <span className="font-semibold tabular-nums">−{formatPrice(discountAmount)}</span>
            </div>
          ) : null}
          {showTax ? (
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">{money?.tax_label || "Tax"}</span>
              <span className="font-semibold tabular-nums text-[#0b1f3a]">
                {formatPrice(taxAmount)}
              </span>
            </div>
          ) : null}
          <div className="flex justify-between gap-3 border-t border-border pt-1.5">
            <span className="font-medium text-[#0b1f3a]">Live total</span>
            <span className="font-bold tabular-nums text-[#0b1f3a]">
              {formatPrice(displayTotal)}
            </span>
          </div>
        </div>
      ) : null}

      <div className="mt-3 space-y-2 text-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Industry
          </p>
          <p className="mt-0.5 text-[#0b1f3a]">{pkg.industry_name || "Not selected"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Category
          </p>
          <p className="mt-0.5 text-[#0b1f3a]">{pkg.category_name || "Not selected"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Selected modules
          </p>
          <p className="mt-0.5 text-[#0b1f3a]">
            {pkg.selected_modules.length
              ? pkg.selected_modules.map((c) => moduleLabel(pkg, c)).join(", ")
              : "None"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Also included for workflow
          </p>
          <p className="mt-0.5 text-[#0b1f3a]">
            {pkg.dependency_modules.length
              ? pkg.dependency_modules.map((c) => moduleLabel(pkg, c)).join(", ")
              : "None"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Feature Packs
          </p>
          <p className="mt-0.5 text-[#0b1f3a]">
            {packNames.length ? packNames.join(", ") : "None"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Limits
          </p>
          <p className="mt-0.5 text-[#0b1f3a]">
            {limits
              ? `${limits.users} users · ${limits.companies} companies · ${limits.branches} branches · ${limits.warehouses} warehouses`
              : USER_LIMIT_NOTE}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Billing cycle
          </p>
          <p className="mt-0.5 capitalize text-[#0b1f3a]">{cycleName}</p>
        </div>
      </div>

      <p className="mt-3 flex gap-1.5 border-t border-border pt-3 text-[11px] leading-snug text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Mobile app included free · Prices update live · Limit rates from published plans
      </p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Check, HardDrive, Sparkles, Users } from "lucide-react";
import type { PricingPlan } from "@/types";
import { AnimateIn } from "@/components/shared/animate-in";
import { PlanFeatureGroups } from "@/components/sections/plan-feature-groups";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/components/providers/locale-provider";
import { formatMoney } from "@/lib/currency/format";
import {
  resolveCyclePrice,
  withPlanSelectionParams,
} from "@/lib/commercial/mappers";
import { savePlanSelection } from "@/lib/commercial/plan-selection";
import type { BillingCycle } from "@/lib/commercial/types";

type PricingCardsProps = {
  plans: PricingPlan[];
  yearly: boolean;
  compact?: boolean;
  columns?: string;
};

function usersLabel(plan: PricingPlan) {
  if (plan.usersNote) return plan.usersNote;
  if (plan.usersIncluded === "unlimited") return "Unlimited users";
  if (typeof plan.usersIncluded === "number") {
    return `${plan.usersIncluded} user${plan.usersIncluded === 1 ? "" : "s"} included`;
  }
  return null;
}

function storageLabel(plan: PricingPlan) {
  if (plan.storageIncludedGb === "unlimited") return "Unlimited storage";
  if (typeof plan.storageIncludedGb === "number") {
    return `${plan.storageIncludedGb} GB storage included`;
  }
  return null;
}

export function PricingCards({
  plans,
  yearly,
  compact,
  columns = "sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5",
}: PricingCardsProps) {
  const { formatPrice, currency, t } = useLocale();

  function onSelectPlan(plan: PricingPlan, billingCycle: BillingCycle, cycle: ReturnType<typeof resolveCyclePrice>) {
    if (!plan.planId) return;
    savePlanSelection({
      planId: plan.planId,
      plan: plan.id,
      productSlug: plan.productSlug,
      billingCycle,
      price: cycle.price,
      discount: cycle.discountPercent,
      originalPrice: cycle.originalPrice,
      savings: cycle.savings,
      currency: plan.currency,
    });
  }

  return (
    <div className={`grid gap-6 md:gap-7 items-stretch pt-4 ${columns}`}>
      {plans.map((plan, i) => {
        const cycle = resolveCyclePrice(plan, yearly);
        const isLifetime = cycle.billingCycle === "lifetime";
        const isPopular = Boolean(plan.popular);
        const seats = usersLabel(plan);
        const storage = storageLabel(plan);
        const ribbon = plan.ribbon || plan.badge || plan.launchBadge;
        const href = withPlanSelectionParams(plan.href, {
          billingCycle: cycle.billingCycle,
          price: cycle.price,
          discount: cycle.discountPercent,
          originalPrice: cycle.originalPrice,
          savings: cycle.savings,
        });

        const moduleList = plan.modules ?? [];
        const shownModules = compact ? [] : moduleList;
        const featureGroups = plan.featureGroups ?? [];
        const shownFeatures =
          compact || featureGroups.length === 0
            ? compact
              ? plan.features.filter((f) => !seats || f !== seats).slice(0, 5)
              : plan.features.filter((f) => !seats || f !== seats)
            : [];

        return (
          <AnimateIn key={plan.id} delay={i * 0.05} className="h-full">
            <Card
              className={`h-full flex flex-col relative overflow-visible transition-shadow hover:shadow-lg ${
                isPopular
                  ? "border-[var(--brand-dark)]/15 bg-[var(--brand-dark)] text-white shadow-[0_16px_40px_rgba(9,33,91,0.28)]"
                  : isLifetime
                    ? "border-accent/25 shadow-[0_8px_28px_rgba(16,185,129,0.06)]"
                    : "border-border/80"
              }`}
            >
              {ribbon ? (
                <div className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2">
                  <Badge
                    className={`notranslate whitespace-nowrap px-3 py-1 shadow-sm ${
                      isPopular
                        ? "border border-border/80 bg-white text-[var(--brand-dark)] hover:bg-white"
                        : ""
                    }`}
                    variant={isPopular ? "default" : "accent"}
                    translate="no"
                  >
                    {ribbon}
                  </Badge>
                </div>
              ) : null}

              <CardHeader className={`${compact ? "pb-2 pt-8" : "pb-3 pt-8"}`}>
                <div className="flex flex-wrap items-center gap-2">
                <CardTitle className={`font-heading text-pricing-title leading-tight ${isPopular ? "text-white" : ""}`}>
                  {plan.name}
                </CardTitle>
                  {plan.recommended && !isPopular ? (
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                      Recommended
                    </Badge>
                  ) : null}
                </div>
                {plan.subtitle ? (
                  <p
                    className={`text-sm font-medium ${
                      isPopular ? "text-sky-100" : "text-primary"
                    }`}
                  >
                    {plan.subtitle}
                  </p>
                ) : null}
                <p
                  className={`text-sm leading-relaxed ${compact ? "" : "min-h-[2.75rem]"} ${
                    isPopular ? "text-white/80" : "text-muted-foreground"
                  }`}
                >
                  {plan.marketingSummary || plan.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {seats ? (
                    <div
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isPopular
                          ? "bg-white text-[var(--brand-dark)] shadow-sm"
                          : "bg-primary/8 text-primary"
                      }`}
                    >
                      <Users className="h-3.5 w-3.5 shrink-0" />
                      <span>{seats}</span>
                    </div>
                  ) : null}
                  {storage ? (
                    <div
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isPopular
                          ? "bg-white/15 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      <HardDrive className="h-3.5 w-3.5 shrink-0" />
                      <span>{storage}</span>
                    </div>
                  ) : null}
                </div>

                <div className="pt-4 space-y-2 min-h-[8.5rem]">
                  {cycle.price !== null && cycle.price !== undefined ? (
                    <>
                      <div className="flex items-end gap-2 flex-wrap notranslate" translate="no">
                        {cycle.originalPrice ? (
                          <span
                            className={`text-base md:text-lg line-through tabular-nums ${
                              isPopular
                                ? "text-white/55 decoration-white/50"
                                : "text-muted-foreground decoration-red-400/60"
                            }`}
                          >
                            {formatPrice(cycle.originalPrice)}
                          </span>
                        ) : null}
                        <span
                          className={`text-3xl md:text-[2rem] font-semibold tracking-tight leading-none tabular-nums ${
                            isPopular ? "text-white" : "text-[#0b1f3a]"
                          }`}
                        >
                          {formatPrice(cycle.price)}
                        </span>
                        <span
                          className={`text-sm pb-0.5 ${
                            isPopular ? "text-white/70" : "text-muted-foreground"
                          }`}
                        >
                          {isLifetime
                            ? ` ${t("pricing.oneTime", "one-time")}`
                            : ` ${t("pricing.perUserMo", "/user/mo")}`}
                        </span>
                      </div>
                      <p
                        className={`min-h-4 text-xs capitalize ${
                          isPopular ? "text-white/60" : "text-muted-foreground"
                        }`}
                      >
                        Billing: {cycle.billingCycle}
                        {yearly && !isLifetime && plan.yearlyTotal != null
                          ? ` · ${formatPrice(plan.yearlyTotal)} / year`
                          : null}
                      </p>
                      <p
                        className={`min-h-4 text-xs notranslate tabular-nums ${
                          currency === "USD" ? "invisible" : ""
                        } ${isPopular ? "text-white/60" : "text-muted-foreground"}`}
                        translate="no"
                        aria-hidden={currency === "USD"}
                      >
                        ≈ {formatMoney(cycle.price, "USD", { showCode: true })}
                        {isLifetime
                          ? ` ${t("pricing.oneTime", "one-time")}`
                          : !yearly
                            ? ` ${t("pricing.perMonth", "/month")}`
                            : ` ${t("pricing.billedYearly", "/mo billed yearly")}`}
                      </p>
                      {cycle.discountPercent ? (
                        <div
                          className="notranslate inline-flex items-center gap-1 rounded-full border border-emerald-100/80 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                          translate="no"
                        >
                          <Sparkles className="h-3 w-3" />
                          {t("pricing.launchDiscount", "{{percent}}% discount", {
                            percent: cycle.discountPercent,
                          })}
                        </div>
                      ) : null}
                      {cycle.savings != null && cycle.savings > 0 ? (
                        <p
                          className={`text-xs font-medium tabular-nums ${
                            isPopular ? "text-emerald-200" : "text-emerald-700"
                          }`}
                        >
                          Save {formatPrice(cycle.savings)}
                          {yearly && !isLifetime ? " / year" : ""}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <span
                      className={`notranslate text-3xl font-semibold tracking-tight ${
                        isPopular ? "text-white" : ""
                      }`}
                      translate="no"
                    >
                      {t("pricing.custom", "Custom")}
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col pt-0 pb-6">
                {(plan.extraUserPrice != null || plan.extraStoragePricePerGb != null) && (
                  <div
                    className={`mb-4 space-y-1 text-xs ${
                      isPopular ? "text-white/75" : "text-muted-foreground"
                    }`}
                  >
                    {plan.extraUserPrice != null ? (
                      <p>Extra user: {formatPrice(plan.extraUserPrice)}</p>
                    ) : null}
                    {plan.extraStoragePricePerGb != null ? (
                      <p>Extra storage: {formatPrice(plan.extraStoragePricePerGb)}/GB</p>
                    ) : null}
                  </div>
                )}

                {shownModules.length > 0 ? (
                  <div className="mb-4">
                    <p
                      className={`mb-2 text-[11px] font-semibold uppercase tracking-wide ${
                        isPopular ? "text-white/65" : "text-[#0b1f3a]/70"
                      }`}
                    >
                      Modules included
                    </p>
                    <ul className={`space-y-1.5 ${compact ? "text-xs" : "text-sm"}`}>
                      {shownModules.map((m) => (
                        <li
                          key={m}
                          className={`flex gap-2 leading-snug ${
                            isPopular ? "text-white/85" : "text-muted-foreground"
                          }`}
                        >
                          <Check
                            className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${
                              isPopular ? "text-sky-200" : "text-primary"
                            }`}
                          />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {!compact && featureGroups.length > 0 ? (
                  <div className="mb-6 flex-1">
                    <PlanFeatureGroups
                      groups={featureGroups}
                      compact={compact}
                      popular={isPopular}
                    />
                  </div>
                ) : shownFeatures.length > 0 ? (
                  <ul className={`space-y-2.5 mb-6 flex-1 ${compact ? "text-xs" : ""}`}>
                    {shownFeatures.map((f) => (
                      <li
                        key={f}
                        className={`flex gap-2.5 text-sm leading-snug ${
                          isPopular ? "text-white/85" : "text-muted-foreground"
                        }`}
                      >
                        <Check
                          className={`h-4 w-4 shrink-0 mt-0.5 ${
                            isPopular ? "text-emerald-300" : "text-emerald-600"
                          }`}
                        />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex-1 mb-6" />
                )}

                <Button
                  asChild
                  className={`w-full rounded-full ${
                    isPopular
                      ? "border border-white/20 bg-white text-[var(--brand-dark)] hover:bg-white/95"
                      : isLifetime
                        ? "bg-accent hover:bg-accent/90"
                        : ""
                  }`}
                  variant={isPopular ? "default" : isLifetime ? "default" : "outline"}
                >
                  <Link
                    href={href}
                    onClick={() => onSelectPlan(plan, cycle.billingCycle, cycle)}
                  >
                    {plan.cta}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </AnimateIn>
        );
      })}
    </div>
  );
}

export function LaunchDiscountBanner({
  campaign,
  badge,
  maxDiscount,
  maxSavings,
}: {
  campaign?: string | null;
  badge?: string | null;
  maxDiscount?: number | null;
  maxSavings?: number | null;
}) {
  const { formatPrice } = useLocale();
  if (!campaign && !badge && !maxDiscount) return null;

  return (
    <div className="mb-8 md:mb-10 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-blue-50 px-5 py-5 sm:px-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold text-[#0b1f3a]">
            {campaign || badge || (maxDiscount ? `${maxDiscount}% launch discount` : "Launch offer")}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5 max-w-xl leading-relaxed">
            Prices and discounts are loaded live from the License Engine commercial catalog —
            billed in USD.
          </p>
        </div>
      </div>
      {maxSavings || maxDiscount || badge ? (
        <Badge variant="accent" className="self-start md:self-center text-sm px-4 py-1.5 shrink-0">
          {badge ||
            (maxDiscount ? `Save ${maxDiscount}%` : null) ||
            (maxSavings ? (
              <>
                Save up to <span translate="no">{formatPrice(maxSavings)}</span>
              </>
            ) : null)}
        </Badge>
      ) : null}
    </div>
  );
}

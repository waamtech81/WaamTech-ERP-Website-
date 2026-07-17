"use client";

import Link from "next/link";
import { Check, Sparkles, Users } from "lucide-react";
import type { PricingPlan } from "@/types";
import { AnimateIn } from "@/components/shared/animate-in";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/components/providers/locale-provider";
import { formatMoney } from "@/lib/currency/format";

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

export function PricingCards({
  plans,
  yearly,
  compact,
  columns = "sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5",
}: PricingCardsProps) {
  const { formatPrice, currency, t } = useLocale();

  return (
    <div className={`grid gap-6 md:gap-7 items-stretch pt-4 ${columns}`}>
      {plans.map((plan, i) => {
        const isLifetime = plan.lifetimePrice != null;
        const price = isLifetime
          ? plan.lifetimePrice
          : yearly
            ? plan.yearlyPrice
            : plan.monthlyPrice;
        const original = isLifetime
          ? plan.originalMonthlyPrice
          : yearly
            ? plan.originalYearlyPrice
            : plan.originalMonthlyPrice;
        const seats = usersLabel(plan);
        const moduleList = plan.modules ?? [];
        const shownModules = compact ? moduleList.slice(0, 4) : moduleList;
        const shownFeatures = compact
          ? plan.features.filter((f) => !seats || f !== seats).slice(0, 3)
          : plan.features.filter((f) => !seats || f !== seats);

        const isPopular = Boolean(plan.popular);

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
              {isPopular ? (
                <div className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2">
                  <Badge
                    className="notranslate whitespace-nowrap border border-border/80 bg-white px-3 py-1 text-[var(--brand-dark)] shadow-sm hover:bg-white"
                    translate="no"
                  >
                    {t("pricing.mostPopular", "Most popular")}
                  </Badge>
                </div>
              ) : plan.id === "lifetime" && plan.badge ? (
                <div className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2">
                  <Badge
                    variant="accent"
                    className="notranslate shadow-sm whitespace-nowrap"
                    translate="no"
                  >
                    {t("pricing.bestValue", plan.badge)}
                  </Badge>
                </div>
              ) : null}

              {/* Same top padding on every card → equal top alignment */}
              <CardHeader className={`${compact ? "pb-2 pt-8" : "pb-3 pt-8"}`}>
                <CardTitle className={`text-lg leading-tight ${isPopular ? "text-white" : ""}`}>
                  {plan.name}
                </CardTitle>
                <p
                  className={`text-sm leading-relaxed ${compact ? "" : "min-h-[2.75rem]"} ${
                    isPopular ? "text-white/80" : "text-muted-foreground"
                  }`}
                >
                  {plan.description}
                </p>

                {seats ? (
                  <div
                    className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      isPopular
                        ? "bg-white text-[var(--brand-dark)] shadow-sm"
                        : "bg-primary/8 text-primary"
                    }`}
                  >
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span>{seats}</span>
                  </div>
                ) : null}

                <div className="pt-4 space-y-2">
                  {price !== null && price !== undefined ? (
                    <>
                      <div className="flex items-end gap-2 flex-wrap notranslate" translate="no">
                        {original ? (
                          <span
                            className={`text-base md:text-lg line-through ${
                              isPopular
                                ? "text-white/55 decoration-white/50"
                                : "text-muted-foreground decoration-red-400/60"
                            }`}
                          >
                            {formatPrice(original)}
                          </span>
                        ) : null}
                        <span
                          className={`text-3xl md:text-[2rem] font-semibold tracking-tight leading-none ${
                            isPopular ? "text-white" : "text-[#0b1f3a]"
                          }`}
                        >
                          {formatPrice(price)}
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
                      {price && currency !== "USD" ? (
                        <p
                          className={`text-xs notranslate ${
                            isPopular ? "text-white/60" : "text-muted-foreground"
                          }`}
                          translate="no"
                        >
                          ≈ {formatMoney(price, "USD", { showCode: true })}
                          {isLifetime
                            ? ` ${t("pricing.oneTime", "one-time")}`
                            : !yearly
                              ? ` ${t("pricing.perMonth", "/month")}`
                              : ` ${t("pricing.billedYearly", "/mo billed yearly")}`}
                        </p>
                      ) : null}
                      {plan.launchDiscount ? (
                        <div
                          className="notranslate inline-flex items-center gap-1 rounded-full border border-emerald-100/80 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                          translate="no"
                        >
                          <Sparkles className="h-3 w-3" />
                          {t("pricing.launchDiscount", "{{percent}}% launch discount", {
                            percent: plan.launchDiscount,
                          })}
                        </div>
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
                      {compact && moduleList.length > shownModules.length ? (
                        <li
                          className={`text-xs pl-5 ${
                            isPopular ? "text-sky-100" : "text-primary"
                          }`}
                        >
                          +{moduleList.length - shownModules.length} more on full plans page
                        </li>
                      ) : null}
                    </ul>
                  </div>
                ) : null}

                {shownFeatures.length > 0 ? (
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
                            isPopular ? "text-emerald-300" : "text-accent"
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
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          </AnimateIn>
        );
      })}
    </div>
  );
}

export function LaunchDiscountBanner() {
  const { formatPrice } = useLocale();
  return (
    <div className="mb-8 md:mb-10 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-blue-50 px-5 py-5 sm:px-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold text-[#0b1f3a]">50% Launch Discount — Limited Time</p>
          <p className="text-sm text-muted-foreground mt-0.5 max-w-xl leading-relaxed">
            Lock in launch rates before they go up. Prices auto-convert to your local currency —
            billed in USD.
          </p>
        </div>
      </div>
      <Badge variant="accent" className="self-start md:self-center text-sm px-4 py-1.5 shrink-0">
        Save up to <span translate="no">{formatPrice(40)}</span>/user/mo
      </Badge>
    </div>
  );
}

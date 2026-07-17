"use client";

import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import type { PricingPlan } from "@/types";
import { formatCurrency, formatDualPrice, usdToPkr } from "@/lib/utils";
import { AnimateIn } from "@/components/shared/animate-in";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PricingCardsProps = {
  plans: PricingPlan[];
  yearly: boolean;
  compact?: boolean;
  columns?: string;
};

export function PricingCards({
  plans,
  yearly,
  compact,
  columns = "sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5",
}: PricingCardsProps) {
  return (
    <div className={`grid gap-6 md:gap-7 ${columns}`}>
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
        // Only highlight badges: Most popular OR Best value — not on every plan
        const showTopBadge = Boolean(plan.popular || (plan.badge && plan.id === "lifetime"));

        return (
          <AnimateIn key={plan.id} delay={i * 0.05}>
            <Card
              className={`h-full flex flex-col relative overflow-visible transition-shadow hover:shadow-lg ${
                showTopBadge ? "mt-3" : ""
              } ${
                plan.popular
                  ? "border-primary shadow-[0_16px_48px_rgba(37,99,235,0.12)] ring-1 ring-primary/20"
                  : isLifetime
                    ? "border-accent/40 shadow-[0_12px_40px_rgba(16,185,129,0.08)]"
                    : ""
              }`}
            >
              {plan.popular ? (
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-[inherit] bg-gradient-to-r from-primary via-blue-400 to-primary" />
              ) : null}
              {plan.popular ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="shadow-sm whitespace-nowrap">Most popular</Badge>
                </div>
              ) : plan.id === "lifetime" && plan.badge ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge variant="accent" className="shadow-sm whitespace-nowrap">
                    {plan.badge}
                  </Badge>
                </div>
              ) : null}

              <CardHeader className={`${compact ? "pb-2" : "pb-3"} ${showTopBadge ? "pt-7" : "pt-6"}`}>
                <CardTitle className="text-lg leading-tight">{plan.name}</CardTitle>
                <p className={`text-sm text-muted-foreground leading-relaxed ${compact ? "" : "min-h-[2.75rem]"}`}>
                  {plan.description}
                </p>

                <div className="pt-4 space-y-2">
                  {price !== null && price !== undefined ? (
                    <>
                      <div className="flex items-end gap-2 flex-wrap">
                        {original ? (
                          <span className="text-base md:text-lg text-muted-foreground line-through decoration-red-400/60">
                            {formatCurrency(original)}
                          </span>
                        ) : null}
                        <span className="text-3xl md:text-[2rem] font-semibold tracking-tight text-[#0b1f3a] leading-none">
                          {formatCurrency(price)}
                        </span>
                        <span className="text-sm text-muted-foreground pb-0.5">
                          {isLifetime ? " one-time" : " /user/mo"}
                        </span>
                      </div>
                      {!isLifetime && price ? (
                        <p className="text-xs text-muted-foreground">
                          ≈ {formatCurrency(usdToPkr(price), "PKR")}
                          {!yearly ? "/mo" : "/mo billed yearly"}
                        </p>
                      ) : isLifetime && price ? (
                        <p className="text-xs text-muted-foreground">
                          ≈ {formatCurrency(usdToPkr(price), "PKR")} one-time
                        </p>
                      ) : null}
                      {plan.launchDiscount ? (
                        <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-100">
                          <Sparkles className="h-3 w-3" />
                          {plan.launchDiscount}% launch discount
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-3xl font-semibold tracking-tight">Custom</span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col pt-0 pb-6">
                <ul className={`space-y-2.5 mb-6 flex-1 ${compact ? "text-xs" : ""}`}>
                  {(compact ? plan.features.slice(0, 4) : plan.features).map((f) => (
                    <li key={f} className="flex gap-2.5 text-sm text-muted-foreground leading-snug">
                      <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className={`w-full rounded-full ${plan.popular ? "" : isLifetime ? "bg-accent hover:bg-accent/90" : ""}`}
                  variant={plan.popular ? "default" : isLifetime ? "default" : "outline"}
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
  return (
    <div className="mb-8 md:mb-10 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-blue-50 px-5 py-5 sm:px-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold text-[#0b1f3a]">50% Launch Discount — Limited Time</p>
          <p className="text-sm text-muted-foreground mt-0.5 max-w-xl leading-relaxed">
            Prices aligned with Pakistan ERP market (Finivo, Tredus, Splendid from PKR 2,000–5,500/mo).
            Lock in launch rates before they go up.
          </p>
        </div>
      </div>
      <Badge variant="accent" className="self-start md:self-center text-sm px-4 py-1.5 shrink-0">
        Save up to {formatDualPrice(40).pkr}/user/mo
      </Badge>
    </div>
  );
}

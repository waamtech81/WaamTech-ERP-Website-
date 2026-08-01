"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import type { CustomPackageBundleOffer } from "@/lib/commercial/types";
import { cn } from "@/lib/utils";

type Props = {
  offer: CustomPackageBundleOffer;
  /** Premium full offer vs soft close-match hint */
  mode: "bundle" | "close";
  cycleLabel: string;
  onSwitchToPlan: () => void;
  onContinueCustom: () => void;
  className?: string;
};

export function BundleRecommendationCard({
  offer,
  mode,
  cycleLabel,
  onSwitchToPlan,
  onContinueCustom,
  className,
}: Props) {
  const { formatPrice } = useLocale();
  const planName = offer.matched_plan_name || "Business Plan";
  const customPrice = Number(offer.custom_price) || 0;
  const planPrice = Number(offer.matched_plan_price) || 0;
  const savings = Number(offer.bundle_savings) || Math.max(0, customPrice - planPrice);
  const limits = offer.included_limits;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border-2 shadow-sm",
        mode === "bundle"
          ? "border-amber-300 bg-amber-50"
          : "border-sky-300 bg-sky-50",
        className
      )}
    >
      <div className="border-b border-black/5 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#0b1f3a]">
              {mode === "bundle"
                ? "Your configuration matches"
                : "Close match available"}
            </p>
            <p className="text-xs text-[#0b1f3a]/75">
              {mode === "bundle"
                ? `Matched plan: ${planName}`
                : offer.message ||
                  `This configuration is very similar to our ${planName}.`}
            </p>
          </div>
          {offer.match_score > 0 ? (
            <Badge className="ml-auto bg-[#0b1f3a] text-white hover:bg-[#0b1f3a]">
              {Math.round(offer.match_score)}% match
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 px-4 py-4 sm:px-5">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-white px-3.5 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Custom builder
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-[#0b1f3a]">
              {formatPrice(customPrice)}
              <span className="ml-1 text-xs font-medium text-muted-foreground">
                {cycleLabel}
              </span>
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-white px-3.5 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-800">
              {planName}
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-emerald-800">
              {formatPrice(planPrice)}
              <span className="ml-1 text-xs font-medium text-emerald-700/80">
                {cycleLabel}
              </span>
            </p>
          </div>
        </div>

        {savings > 0 ? (
          <p className="rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white">
            You save {formatPrice(savings)} {cycleLabel}
            {offer.bundle_percentage > 0
              ? ` · ${Math.round(offer.bundle_percentage)}%`
              : ""}
          </p>
        ) : null}

        {(offer.included_modules.length > 0 ||
          offer.included_feature_packs.length > 0 ||
          limits) && (
          <div className="space-y-1.5 text-xs text-[#0b1f3a]/80">
            {offer.included_modules.length ? (
              <p>
                <span className="font-semibold">Included modules:</span>{" "}
                {offer.included_modules.slice(0, 8).join(", ")}
                {offer.included_modules.length > 8
                  ? ` +${offer.included_modules.length - 8} more`
                  : ""}
              </p>
            ) : null}
            {offer.included_feature_packs.length ? (
              <p>
                <span className="font-semibold">Feature Packs:</span>{" "}
                {offer.included_feature_packs.join(", ")}
              </p>
            ) : null}
            {limits ? (
              <p>
                <span className="font-semibold">Included limits:</span>{" "}
                {limits.users} users · {limits.companies} companies · {limits.branches}{" "}
                branches · {limits.warehouses} warehouses
              </p>
            ) : null}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            className="w-full rounded-full sm:flex-1"
            onClick={onSwitchToPlan}
          >
            Switch to {planName}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full border-[#0b1f3a]/20 bg-white sm:flex-1"
            onClick={onContinueCustom}
          >
            Continue custom build
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Optional ready-made package — you can keep your custom selection.
        </p>
      </div>
    </div>
  );
}

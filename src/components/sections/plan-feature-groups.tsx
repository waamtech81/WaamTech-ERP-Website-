"use client";

import { Check, Info } from "lucide-react";
import type { PricingFeatureGroup } from "@/types";
import { cn } from "@/lib/utils";

type PlanFeatureGroupsProps = {
  groups: PricingFeatureGroup[];
  compact?: boolean;
  popular?: boolean;
  className?: string;
};

export function PlanFeatureGroups({
  groups,
  compact,
  popular,
  className,
}: PlanFeatureGroupsProps) {
  if (!groups.length) return null;

  const shown = compact ? groups.slice(0, 3) : groups;

  return (
    <div className={cn("space-y-4", className)}>
      {shown.map((group, gi) => (
        <div key={group.id || group.code || `${group.name}-${gi}`}>
          <p
            className={cn(
              "mb-2 text-[11px] font-semibold uppercase tracking-wide",
              popular ? "text-white/65" : "text-[#0b1f3a]/70"
            )}
          >
            {group.name}
          </p>
          <ul className={cn("space-y-1.5", compact ? "text-xs" : "text-sm")}>
            {(compact ? group.features.slice(0, 4) : group.features).map((feature, i) => (
              <li
                key={feature.id || `${group.code || group.name}-${feature.name}-${i}`}
                className={cn(
                  "flex gap-2 leading-snug",
                  popular ? "text-white/85" : "text-muted-foreground",
                  feature.highlighted && (popular ? "text-white font-medium" : "text-[#0b1f3a] font-medium")
                )}
              >
                <Check
                  className={cn(
                    "mt-0.5 h-3.5 w-3.5 shrink-0",
                    feature.greenTick !== false
                      ? popular
                        ? "text-emerald-300"
                        : "text-emerald-600"
                      : popular
                        ? "text-sky-200"
                        : "text-primary"
                  )}
                  aria-hidden
                />
                <span className="flex-1">{feature.name}</span>
                {feature.tooltip ? (
                  <span
                    className="relative group/tooltip shrink-0"
                    title={feature.tooltip}
                  >
                    <Info
                      className={cn(
                        "h-3.5 w-3.5",
                        popular ? "text-white/50" : "text-muted-foreground/70"
                      )}
                    />
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute bottom-full right-0 z-20 mb-1 hidden w-48 rounded-md bg-[#0b1f3a] px-2 py-1.5 text-[11px] font-normal leading-snug text-white shadow-lg group-hover/tooltip:block"
                    >
                      {feature.tooltip}
                    </span>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

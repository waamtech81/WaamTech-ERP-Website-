"use client";

import { MonitorSmartphone, Check } from "lucide-react";
import {
  getPosForSelection,
  posAccessLevelCopy,
  type PosAccessLevel,
} from "@/lib/data/mobile-app";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const levelStyles: Record<PosAccessLevel, string> = {
  required: "border-violet-200 bg-violet-50/80",
  optional: "border-amber-200 bg-amber-50/70",
  not_included: "border-slate-200 bg-slate-50/90",
};

const badgeStyles: Record<PosAccessLevel, string> = {
  required: "bg-violet-700 text-white hover:bg-violet-700",
  optional: "bg-amber-600 text-white hover:bg-amber-600",
  not_included: "bg-slate-600 text-white hover:bg-slate-600",
};

type Props = {
  categoryName?: string;
  /** License Engine business-category.pos_requirement (SSOT). */
  posRequirement?: string | null;
  className?: string;
  compact?: boolean;
};

export function PosProfileCallout({
  categoryName,
  posRequirement,
  className,
  compact,
}: Props) {
  const info = getPosForSelection({ posRequirement });
  const copy = posAccessLevelCopy[info.level];

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 md:p-5 transition-colors",
        levelStyles[info.level],
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
          <MonitorSmartphone className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <Badge className={badgeStyles[info.level]}>{info.badge}</Badge>
            {categoryName ? (
              <span className="text-xs text-muted-foreground">for {categoryName}</span>
            ) : null}
          </div>
          <p className="text-sm font-medium text-[#0b1f3a]">{copy.title}</p>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{info.note}</p>

          {!compact ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {info.useCases.map((u) => (
                <li
                  key={u}
                  className="inline-flex items-center gap-1 rounded-full bg-white/80 border border-border/60 px-2.5 py-1 text-xs text-muted-foreground"
                >
                  <Check className="h-3 w-3 text-accent" />
                  {u}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}

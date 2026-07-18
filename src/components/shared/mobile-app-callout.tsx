"use client";

import Link from "next/link";
import { Smartphone, Check } from "lucide-react";
import {
  getIndustryMobileApp,
  getMobileAppForSelection,
  mobileAppLevelCopy,
  type MobileAppLevel,
} from "@/lib/data/mobile-app";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const levelStyles: Record<MobileAppLevel, string> = {
  required: "border-rose-200 bg-rose-50/80",
  recommended: "border-amber-200 bg-amber-50/70",
  available: "border-blue-200 bg-blue-50/60",
};

const badgeStyles: Record<MobileAppLevel, string> = {
  required: "bg-rose-600 text-white hover:bg-rose-600",
  recommended: "bg-amber-600 text-white hover:bg-amber-600",
  available: "bg-primary text-white hover:bg-primary",
};

type Props = {
  /** @deprecated Prefer categoryCode / categorySlug from License Engine catalog. */
  industryId?: string;
  industryName?: string;
  categoryCode?: string | null;
  categorySlug?: string | null;
  industryCode?: string | null;
  industrySlug?: string | null;
  className?: string;
  compact?: boolean;
};

export function MobileAppProfileCallout({
  industryId,
  industryName,
  categoryCode,
  categorySlug,
  industryCode,
  industrySlug,
  className,
  compact,
}: Props) {
  const info =
    categoryCode || categorySlug || industryCode || industrySlug
      ? getMobileAppForSelection({
          categoryCode,
          categorySlug,
          industryCode,
          industrySlug,
        })
      : getIndustryMobileApp(industryId);
  const copy = mobileAppLevelCopy[info.level];

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
          <Smartphone className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <Badge className={badgeStyles[info.level]}>{info.badge}</Badge>
            {industryName ? (
              <span className="text-xs text-muted-foreground">for {industryName}</span>
            ) : null}
          </div>
          <p className="text-sm font-medium text-[#0b1f3a]">{copy.title}</p>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{info.note}</p>

          {!compact ? (
            <>
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
              <p className="mt-3 text-xs text-muted-foreground">
                Plus full <strong>responsive web</strong> on desktop, tablet & phone.{" "}
                <Link href="/mobile-app" className="text-primary hover:underline font-medium">
                  Learn about mobile access →
                </Link>
              </p>
            </>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              <Link href="/mobile-app" className="text-primary hover:underline">
                See mobile access details →
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

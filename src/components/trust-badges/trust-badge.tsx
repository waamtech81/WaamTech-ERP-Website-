"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  trustBadgeMap,
  type TrustBadgeId,
} from "@/lib/data/trust-badges";
import { trustBadgeComponents } from "./registry";

export type TrustBadgeTone = "light" | "dark" | "auto";
export type TrustBadgeSize = "xs" | "sm" | "md" | "lg";

const sizeClass: Record<TrustBadgeSize, string> = {
  xs: "w-8",
  sm: "w-[5.5rem]",
  md: "w-[6.75rem]",
  lg: "w-[7.5rem]",
};

const labelClass: Record<TrustBadgeSize, string> = {
  xs: "text-[10px] leading-snug",
  sm: "text-[11px] leading-snug",
  md: "text-xs leading-snug sm:text-[13px]",
  lg: "text-sm leading-snug",
};

export function TrustBadge({
  id,
  tone = "auto",
  size = "md",
  showTooltip = true,
  showLabel = true,
  href,
  className,
}: {
  id: TrustBadgeId;
  tone?: TrustBadgeTone;
  size?: TrustBadgeSize;
  showTooltip?: boolean;
  showLabel?: boolean;
  href?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const meta = trustBadgeMap[id];
  const Mark = trustBadgeComponents[id];

  const body = (
    <motion.div
      className={cn(
        "wt-trust-badge group relative inline-flex flex-col items-center outline-none",
        showLabel ? "gap-2.5" : "gap-0",
        sizeClass[size],
        className
      )}
      data-tone={tone}
      whileHover={reduce ? undefined : { y: -3, scale: 1.03 }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
    >
      <div
        className={cn(
          "wt-trust-seal relative w-full overflow-visible rounded-2xl transition-[box-shadow,transform] duration-300",
          "group-hover:shadow-[0_12px_32px_rgba(5,73,164,0.14)]",
          "group-focus-visible:ring-2 group-focus-visible:ring-primary/40 group-focus-visible:ring-offset-2"
        )}
      >
        <Mark className="h-auto w-full" title={meta.label} />
      </div>

      {showLabel ? (
        <span
          className={cn(
            "wt-trust-caption text-center font-semibold tracking-tight text-balance",
            labelClass[size]
          )}
        >
          {meta.label}
        </span>
      ) : null}

      {showTooltip ? (
        <div
          role="tooltip"
          className={cn(
            "pointer-events-none absolute bottom-[calc(100%+0.65rem)] left-1/2 z-30 w-52 -translate-x-1/2",
            "rounded-xl border px-3 py-2.5 text-left shadow-[0_16px_40px_rgba(15,23,42,0.16)]",
            "opacity-0 scale-95 transition-all duration-200",
            "group-hover:opacity-100 group-hover:scale-100 group-focus-visible:opacity-100 group-focus-visible:scale-100",
            "wt-trust-tooltip"
          )}
        >
          <p className="text-xs font-semibold leading-snug">{meta.label}</p>
          <p className="mt-1 text-[11px] leading-relaxed opacity-80">{meta.description}</p>
          <span
            aria-hidden
            className="wt-trust-tooltip-arrow absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r"
          />
        </div>
      ) : null}
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex focus:outline-none" aria-label={meta.label}>
        {body}
      </Link>
    );
  }

  return (
    <div tabIndex={0} className="inline-flex focus:outline-none" aria-label={meta.label}>
      {body}
    </div>
  );
}

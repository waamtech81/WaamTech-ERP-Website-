"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  trustBadgeSets,
  type TrustBadgeId,
} from "@/lib/data/trust-badges";
import { TrustBadge, type TrustBadgeSize, type TrustBadgeTone } from "./trust-badge";

export function TrustBadgeGrid({
  ids,
  set = "all",
  tone = "auto",
  size = "md",
  href = "/security",
  className,
  showTooltip = true,
  columns = "full",
}: {
  ids?: TrustBadgeId[];
  set?: keyof typeof trustBadgeSets;
  tone?: TrustBadgeTone;
  size?: TrustBadgeSize;
  href?: string | false;
  className?: string;
  showTooltip?: boolean;
  /** full = 2→4→8 cols for neat rows; compact = 2→3→6 */
  columns?: "full" | "compact";
}) {
  const reduce = useReducedMotion();
  const list = ids ?? trustBadgeSets[set];

  return (
    <div
      className={cn(
        "grid w-full place-items-center gap-4 sm:gap-5 md:gap-6",
        columns === "full"
          ? "grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8"
          : "grid-cols-2 sm:grid-cols-3 md:grid-cols-6",
        className
      )}
      role="list"
      aria-label="WaamTech trust badges"
    >
      {list.map((id, i) => (
        <motion.div
          key={id}
          role="listitem"
          className="flex w-full justify-center"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-24px" }}
          transition={{ duration: 0.4, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
        >
          <TrustBadge
            id={id}
            tone={tone}
            size={size}
            showTooltip={showTooltip}
            href={href === false ? undefined : href}
          />
        </motion.div>
      ))}
    </div>
  );
}

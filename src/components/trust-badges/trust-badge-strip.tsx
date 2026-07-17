"use client";

import { cn } from "@/lib/utils";
import {
  trustBadgeSets,
  type TrustBadgeId,
} from "@/lib/data/trust-badges";
import { TrustBadge, type TrustBadgeSize, type TrustBadgeTone } from "./trust-badge";

export function TrustBadgeStrip({
  ids,
  set = "featured",
  tone = "auto",
  size = "sm",
  href = "/security",
  className,
  showTooltip = true,
  showLabel = true,
  layout = "grid",
}: {
  ids?: TrustBadgeId[];
  set?: keyof typeof trustBadgeSets;
  tone?: TrustBadgeTone;
  size?: TrustBadgeSize;
  href?: string | false;
  className?: string;
  showTooltip?: boolean;
  showLabel?: boolean;
  /** grid = even rows; row = single flex row (e.g. footer) */
  layout?: "grid" | "row";
}) {
  const list = ids ?? trustBadgeSets[set];
  const count = list.length;

  const gridCols =
    count <= 6
      ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-6"
      : count <= 8
        ? "grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8"
        : "grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8";

  return (
    <div
      className={cn(
        layout === "row"
          ? "flex flex-wrap items-center justify-end gap-1.5"
          : cn("grid w-full place-items-center gap-3 sm:gap-4 md:gap-5", gridCols),
        className
      )}
      role="list"
      aria-label="WaamTech trust badges"
    >
      {list.map((id) => (
        <div
          key={id}
          role="listitem"
          className={layout === "row" ? undefined : "flex w-full justify-center"}
        >
          <TrustBadge
            id={id}
            tone={tone}
            size={size}
            showTooltip={showTooltip}
            showLabel={showLabel}
            href={href === false ? undefined : href}
          />
        </div>
      ))}
    </div>
  );
}

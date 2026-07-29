"use client";

import Link from "next/link";
import {
  mobileAppLevelCopy,
  mobileProfileSectionMeta,
  type MobileProfileSectionKey,
} from "@/lib/data/mobile-app";
import { Badge } from "@/components/ui/badge";
import { AutoCarousel } from "@/components/shared/auto-carousel";

type ProfileItem = {
  id: string;
  name: string;
  info: { badge: string; note: string; level: string };
};

export function MobileProfileCardRow({
  sectionKey,
  items,
}: {
  sectionKey: MobileProfileSectionKey;
  items: ProfileItem[];
}) {
  if (!items.length) return null;
  const meta = mobileProfileSectionMeta[sectionKey];
  const copy = mobileAppLevelCopy[
    sectionKey === "not_required"
      ? "not_included"
      : sectionKey === "optional"
        ? "optional"
        : sectionKey
  ];

  return (
    <div className={`rounded-2xl border p-4 md:p-6 ${meta.panelClass}`}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge className={meta.badgeClass}>{meta.title}</Badge>
        <p className="max-w-3xl text-sm text-muted-foreground">{copy.description}</p>
      </div>
      <AutoCarousel ariaLabel={`${meta.title} profiles`}>
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/industries/${item.id}`}
            className="min-w-[11.5rem] max-w-[14rem] shrink-0 snap-start rounded-xl border border-white/80 bg-white px-3 py-3 shadow-sm transition-colors hover:border-primary/30"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">
              {item.info.badge}
            </p>
            <p className="mt-1 text-sm font-medium leading-snug text-[#0b1f3a]">
              {item.name}
            </p>
            <p className="mt-1.5 line-clamp-3 text-[11px] leading-relaxed text-muted-foreground">
              {item.info.note}
            </p>
          </Link>
        ))}
      </AutoCarousel>
    </div>
  );
}

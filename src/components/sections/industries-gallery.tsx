"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  industriesServing,
  industryCategories,
  type IndustryCategory,
} from "@/lib/data/industries";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AnimateIn } from "@/components/shared/animate-in";

export function IndustriesGallery() {
  const [category, setCategory] = useState<IndustryCategory | "all">("all");

  const items = useMemo(() => {
    if (category === "all") return industriesServing;
    return industriesServing.filter((i) => i.category === category);
  }, [category]);

  return (
    <div>
      <div className="mb-10 flex flex-wrap justify-center gap-2">
        {industryCategories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
              category === c.id
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-white border border-border text-muted-foreground hover:border-primary/30 hover:text-primary"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((industry, i) => {
          const Icon = getIcon(industry.icon);
          return (
            <AnimateIn key={industry.id} delay={(i % 6) * 0.04}>
              <Link href={`/industries/${industry.id}`} className="group block h-full">
                <article className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-[0_4px_24px_rgba(15,23,42,0.04)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)] hover:border-primary/20">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={industry.image}
                      alt={industry.imageAlt}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b1f3a]/80 via-[#0b1f3a]/20 to-transparent" />
                    <div
                      className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg backdrop-blur-sm"
                      style={{ backgroundColor: `${industry.color}cc` }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge className="absolute right-4 top-4 bg-white/90 text-[#0b1f3a] hover:bg-white">
                      {industryCategories.find((c) => c.id === industry.category)?.label}
                    </Badge>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-semibold tracking-tight text-white">
                        {industry.name}
                      </h3>
                      <p className="mt-1 text-sm text-white/80 line-clamp-1">{industry.headline}</p>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {industry.short}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {industry.modules.slice(0, 3).map((m) => (
                        <Badge key={m} variant="outline" className="text-[10px]">
                          {m}
                        </Badge>
                      ))}
                      {industry.modules.length > 3 ? (
                        <Badge variant="muted" className="text-[10px]">
                          +{industry.modules.length - 3}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                      <span className="text-sm font-medium text-primary">Explore industry</span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            </AnimateIn>
          );
        })}
      </div>

      {items.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">No industries in this category.</p>
      ) : null}
    </div>
  );
}

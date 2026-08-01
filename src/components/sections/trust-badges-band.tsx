"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container, Section } from "@/components/shared/section";
import { TrustBadgeGrid } from "@/components/trust-badges";
import { Button } from "@/components/ui/button";

/** Reusable marketing band for WaamTech custom trust seals */
export function TrustBadgesBand({
  title = "Built with enterprise trust in mind",
  description = "Original WaamTech trust badges highlight real platform security and reliability features — not third-party certifications.",
  set = "featured" as const,
  tone = "light" as const,
  showLink = true,
}: {
  title?: string;
  description?: string;
  set?: "featured" | "pricing" | "about" | "footer" | "all";
  tone?: "light" | "dark" | "auto";
  showLink?: boolean;
}) {
  return (
    <Section className="!py-12 md:!py-14 bg-[#0b1f3a] text-white">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-sky-300 uppercase">
              Security & Trust
            </p>
            <h2 className="text-balance text-2xl font-semibold tracking-tight text-white md:text-3xl">
              {title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70 md:text-base">
              {description}
            </p>
          </div>
          {showLink ? (
            <Button
              asChild
              variant="outline"
              className="shrink-0 rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/security">
                Explore Security & Trust
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : null}
        </div>

        <div className="mt-9">
          <TrustBadgeGrid
            set={set}
            tone="dark"
            size="sm"
            columns={set === "all" || set === "about" ? "full" : "compact"}
            className="gap-x-3 gap-y-6 sm:gap-x-4 md:gap-x-5"
          />
        </div>
      </Container>
    </Section>
  );
}

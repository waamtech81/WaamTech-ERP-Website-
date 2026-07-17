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
    <Section muted className="!py-12 md:!py-14">
      <Container>
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <p className="mb-2 text-sm font-medium tracking-wide text-primary uppercase">
            Security & Trust
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#0b1f3a] text-balance">
            {title}
          </h2>
          <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
        <TrustBadgeGrid
          set={set}
          tone={tone}
          size="sm"
          columns={set === "all" || set === "about" ? "full" : "compact"}
        />
        {showLink ? (
          <div className="mt-8 flex justify-center">
            <Button asChild variant="link" className="text-primary">
              <Link href="/security">
                Explore Security & Trust
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        ) : null}
      </Container>
    </Section>
  );
}

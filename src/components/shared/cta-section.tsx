import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/shared/section";
import { AnimateIn } from "@/components/shared/animate-in";

export function CTASection({
  title = "Ready to run your business with clarity?",
  description = "Start a free trial or talk with our team about an enterprise rollout tailored to your operations.",
  primaryLabel = "Start free trial",
  primaryHref = "/signup",
  secondaryLabel = "Talk to sales",
  secondaryHref = "/contact",
}: {
  title?: string;
  description?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}) {
  return (
    <Section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <Container>
        <AnimateIn>
          <div className="relative rounded-2xl border border-border bg-white px-8 py-14 md:px-16 md:py-16 text-center shadow-[var(--shadow-sm)]">
            <h2 className="font-heading text-cta font-semibold tracking-tight text-balance max-w-2xl mx-auto text-[#0b1220]">
              {title}
            </h2>
            <p className="mt-4 font-sans text-description font-normal text-muted-foreground max-w-lg mx-auto leading-relaxed text-pretty">
              {description}
            </p>
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="rounded-full min-w-[180px]">
                <Link href={primaryHref}>
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full min-w-[160px]">
                <Link href={secondaryHref}>{secondaryLabel}</Link>
              </Button>
            </div>
          </div>
        </AnimateIn>
      </Container>
    </Section>
  );
}

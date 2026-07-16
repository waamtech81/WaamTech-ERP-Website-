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
          <div className="relative rounded-3xl border border-border bg-white px-8 py-14 md:px-16 md:py-20 text-center shadow-[0_8px_40px_rgba(15,23,42,0.04)]">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-balance max-w-2xl mx-auto">
              {title}
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
              {description}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href={primaryHref}>
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={secondaryHref}>{secondaryLabel}</Link>
              </Button>
            </div>
          </div>
        </AnimateIn>
      </Container>
    </Section>
  );
}

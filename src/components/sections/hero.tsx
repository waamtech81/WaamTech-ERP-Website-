import Link from "next/link";
import { ArrowRight, CheckCircle2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/shared/section";
import { AnimateIn } from "@/components/shared/animate-in";
import { siteConfig } from "@/lib/data/site";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 bg-hero-glow" />
      <div className="absolute inset-0 bg-soft-grid opacity-60" />
      <Container className="relative py-20 md:py-28 lg:py-32">
        <div className="grid-12 items-center">
          <div className="col-span-12 lg:col-span-7">
            <AnimateIn>
              <Badge variant="outline" className="mb-6 px-3 py-1">
                Enterprise business software
              </Badge>
              <h1 className="font-[family-name:var(--font-poppins)] text-4xl sm:text-5xl lg:text-6xl xl:text-[4.25rem] font-semibold tracking-tight text-balance leading-[1.05]">
                {siteConfig.name}
                <span className="block mt-2 text-primary">built for modern operations</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg md:text-xl text-muted-foreground leading-relaxed">
                {siteConfig.tagline} Unify ERP, inventory, POS, CRM, finance, and industry suites in one premium platform.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button asChild size="xl">
                  <Link href="/signup">
                    Start free trial
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="xl">
                  <Link href="/products">
                    <Play className="h-4 w-4" />
                    Explore products
                  </Link>
                </Button>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
                {["No credit card required", "Guided onboarding", "Enterprise-ready security"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </AnimateIn>
          </div>

          <div className="col-span-12 lg:col-span-5 mt-12 lg:mt-0">
            <AnimateIn delay={0.15} direction="left">
              <div className="relative rounded-3xl border border-border bg-white p-3 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <div className="rounded-2xl bg-muted p-5 md:p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Operations overview</p>
                      <p className="mt-1 text-lg font-semibold">WaamTech Command</p>
                    </div>
                    <Badge variant="accent">Live</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Revenue MTD", value: "$1.28M", delta: "+12.4%" },
                      { label: "Open orders", value: "482", delta: "+38" },
                      { label: "Stock health", value: "96%", delta: "Stable" },
                      { label: "Cash position", value: "$840K", delta: "+4.1%" },
                    ].map((card) => (
                      <div key={card.label} className="rounded-2xl border border-border bg-white p-4">
                        <p className="text-xs text-muted-foreground">{card.label}</p>
                        <p className="mt-2 text-xl font-semibold tracking-tight">{card.value}</p>
                        <p className="mt-1 text-xs text-emerald-600">{card.delta}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-2xl border border-border bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium">Fulfillment velocity</p>
                      <p className="text-xs text-muted-foreground">Last 7 days</p>
                    </div>
                    <div className="flex items-end gap-1.5 h-20">
                      {[42, 58, 51, 72, 66, 84, 78].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t-md bg-primary/15"
                          style={{ height: `${h}%` }}
                        >
                          <div className="h-full w-full rounded-t-md bg-primary/70" style={{ height: `${Math.max(h - 18, 20)}%`, marginTop: "auto" }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </AnimateIn>
          </div>
        </div>
      </Container>
    </section>
  );
}

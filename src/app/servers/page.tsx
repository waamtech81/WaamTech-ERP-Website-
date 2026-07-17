import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink, Check } from "lucide-react";
import { serverHero, serverOfferings, waamHostPlans } from "@/lib/data/servers";
import { getIcon } from "@/lib/icons";
import { formatCurrency } from "@/lib/utils";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AnimateIn } from "@/components/shared/animate-in";
import { CTASection } from "@/components/shared/cta-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Servers & Hosting",
  description:
    "WaamHost cloud hosting, WaamTech ERP deployment, own cloud server, local on-premise, and whitelabel solutions.",
};

export default function ServersPage() {
  return (
    <>
      <Section className="!pb-0 !pt-12 md:!pt-16 overflow-hidden">
        <Container>
          <Breadcrumbs items={[{ label: "Servers & Hosting" }]} />
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center pb-16">
            <AnimateIn>
              <Badge variant="accent" className="mb-4">Infrastructure</Badge>
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#0b1f3a] text-balance">
                {serverHero.title}
              </h1>
              <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-xl">
                {serverHero.description}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full">
                  <Link href="https://waamhost.com" target="_blank" rel="noopener noreferrer">
                    Get cloud hosting
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full">
                  <Link href="/contact?intent=own-cloud">Contact for deployment</Link>
                </Button>
              </div>
            </AnimateIn>
            <AnimateIn delay={0.1}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-border shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
                <Image
                  src={serverHero.image}
                  alt="Server infrastructure and cloud hosting"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b1f3a]/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <p className="text-sm font-medium text-white/80">Powered by WaamHost</p>
                  <p className="text-xl font-semibold">3× faster cloud hosting from $5.99/mo</p>
                </div>
              </div>
            </AnimateIn>
          </div>
        </Container>
      </Section>

      <Section muted>
        <Container>
          <SectionHeader
            eyebrow="Our offerings"
            title="Everything your business needs to run online"
            description="From shared cloud hosting to dedicated ERP on your own server — WaamTech has delivered infrastructure solutions since 2012."
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {serverOfferings.map((item, i) => {
              const Icon = getIcon(item.icon);
              return (
                <AnimateIn key={item.id} delay={i * 0.05}>
                  <Card className="h-full overflow-hidden group hover:shadow-lg transition-shadow">
                    <div className="relative h-44 overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <span className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-primary backdrop-blur-sm">
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <p className="text-sm font-medium text-primary">{item.tagline}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                      {item.priceFrom > 0 ? (
                        <p className="pt-1 text-sm">
                          {item.originalPrice ? (
                            <span className="text-muted-foreground line-through mr-2">
                              {formatCurrency(item.originalPrice)}/mo
                            </span>
                          ) : null}
                          <span className="font-semibold text-[#0b1f3a]">
                            From {formatCurrency(item.priceFrom)}
                            {item.id !== "domain-hosting" ? "/mo" : ""}
                          </span>
                        </p>
                      ) : (
                        <p className="text-sm font-semibold text-[#0b1f3a]">Custom quote — contact us</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1.5 mb-5">
                        {item.features.map((f) => (
                          <li key={f} className="flex gap-2 text-xs text-muted-foreground">
                            <Check className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <Button asChild variant="outline" className="w-full rounded-full" size="sm">
                        {item.external ? (
                          <a href={item.href} target="_blank" rel="noopener noreferrer">
                            Learn more
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <Link href={item.href}>
                            Learn more
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </AnimateIn>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeader
            eyebrow="WaamHost"
            title="Cloud hosting plans"
            description="Managed SSD cloud hosting with LiteSpeed, free SSL, daily backups, and 7-day money-back guarantee."
          />
          <div className="grid gap-5 md:grid-cols-3 max-w-4xl mx-auto">
            {waamHostPlans.map((plan, i) => (
              <AnimateIn key={plan.name} delay={i * 0.06}>
                <Card className={`h-full text-center ${plan.popular ? "border-primary ring-1 ring-primary/15" : ""}`}>
                  {plan.popular ? (
                    <div className="pt-4">
                      <Badge className="mx-auto">Best value</Badge>
                    </div>
                  ) : null}
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <p className="pt-2">
                      <span className="text-muted-foreground line-through text-sm mr-2">
                        ${plan.original}
                      </span>
                      <span className="text-3xl font-semibold">${plan.price}</span>
                      <span className="text-sm text-muted-foreground">/mo</span>
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground mb-5">
                      <li>{plan.storage}</li>
                      <li>{plan.bandwidth}</li>
                      <li>{plan.emails}</li>
                      <li>Free SSL + cPanel</li>
                    </ul>
                    <Button asChild className="w-full rounded-full" variant={plan.popular ? "default" : "outline"}>
                      <a href="https://waamhost.com" target="_blank" rel="noopener noreferrer">
                        Get started
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </AnimateIn>
            ))}
          </div>
        </Container>
      </Section>

      <Section muted>
        <Container className="max-w-3xl text-center">
          <SectionHeader
            eyebrow="ERP deployment"
            title="Local server or your own cloud?"
            description="If you need WaamTech ERP on a local network or dedicated cloud server, our team handles installation, configuration, and ongoing support."
          />
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/contact?intent=local-server">Local server setup</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link href="/contact?intent=own-cloud">Own cloud deployment</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link href="/contact?intent=whitelabel">Whitelabel inquiry</Link>
            </Button>
          </div>
        </Container>
      </Section>

      <CTASection
        title="Ready to get started?"
        description="Cloud hosting, ERP deployment, or a complete digital solution — we've been delivering since 2012."
        primaryLabel="Contact us"
        primaryHref="/contact"
        secondaryLabel="View ERP pricing"
        secondaryHref="/pricing"
      />
    </>
  );
}

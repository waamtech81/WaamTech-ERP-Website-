import type { Metadata } from "next";
import { coreBusinesses } from "@/lib/data/core";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AnimateIn } from "@/components/shared/animate-in";
import { CTASection } from "@/components/shared/cta-section";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getIcon } from "@/lib/icons";

export const metadata: Metadata = {
  title: "Industries",
  description:
    "WaamTech business profiles for retail, pharmacy, restaurant, manufacturing, wholesale, warehouse, property, and more — mapped from SaaS Core.",
};

export default function IndustriesPage() {
  return (
    <>
      <Section className="!pb-10 !pt-12 md:!pt-16">
        <Container>
          <Breadcrumbs items={[{ label: "Industries" }]} />
          <SectionHeader
            align="left"
            eyebrow="Business profiles"
            title="Software shaped by real industry workflows"
            description="Every profile comes from WaamTech SaaS Core — modules, feature packs, workflows, and KPIs pre-mapped for your business type."
            className="mb-0 max-w-3xl"
          />
        </Container>
      </Section>

      <Section muted className="!pt-10">
        <Container>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {coreBusinesses.map((biz, i) => {
              const Icon = getIcon(biz.icon);
              return (
                <div key={biz.id} id={biz.id}>
                  <AnimateIn delay={(i % 4) * 0.04}>
                    <Card className="h-full hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
                      <CardHeader>
                        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-base">{biz.name}</CardTitle>
                        <p className="text-sm text-muted-foreground leading-relaxed">{biz.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1.5">
                          {biz.modules.map((m) => (
                            <Badge key={m} variant="outline">
                              {m}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </AnimateIn>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      <CTASection
        title="Don't see your industry?"
        description="Enterprise deployments can be tailored with custom feature packs and module combinations."
        primaryLabel="Contact sales"
        primaryHref="/contact?intent=industry"
        secondaryLabel="Explore modules"
        secondaryHref="/products"
      />
    </>
  );
}

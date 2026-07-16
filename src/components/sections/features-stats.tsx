import { Container, Section, SectionHeader } from "@/components/shared/section";
import { AnimateIn } from "@/components/shared/animate-in";
import { FeatureCard } from "@/components/shared/cards";
import { Counter } from "@/components/shared/counter";
import { whyWaamTech, stats } from "@/lib/data/site";

export function FeaturesSection() {
  return (
    <Section>
      <Container>
        <SectionHeader
          eyebrow="Platform"
          title="Everything your business needs to operate with precision"
          description="Modular suites designed to work together — so finance, inventory, sales, and operations share one source of truth."
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {whyWaamTech.map((item, i) => (
            <AnimateIn key={item.title} delay={i * 0.08}>
              <FeatureCard title={item.title} description={item.description} icon={item.icon} />
            </AnimateIn>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export function StatsSection() {
  return (
    <Section muted className="!py-16 md:!py-20">
      <Container>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          {stats.map((stat, i) => (
            <AnimateIn key={stat.label} delay={i * 0.06}>
              <div className="text-center">
                <p className="font-[family-name:var(--font-poppins)] text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </Container>
    </Section>
  );
}

import type { Metadata } from "next";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AnimateIn } from "@/components/shared/animate-in";
import { CTASection } from "@/components/shared/cta-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about WaamTech Technologies — our mission, vision, timeline, leadership, and technology.",
};

const timeline = [
  { year: "2018", title: "Founded", text: "WaamTech began with a mission to simplify enterprise operations software." },
  { year: "2020", title: "ERP core launch", text: "First unified ERP release across finance, inventory, and sales." },
  { year: "2022", title: "Industry suites", text: "Expanded into POS, Warehouse, Pharmacy, and Property modules." },
  { year: "2024", title: "Connected platform", text: "Introduced Maps, WhatsApp, and deeper API integrations." },
  { year: "2026", title: "Enterprise scale", text: "Global customers across retail, wholesale, manufacturing, and healthcare." },
];

const leaders = [
  { name: "Ayaan Malik", role: "Chief Executive Officer", bio: "Product and operations leader focused on enterprise clarity." },
  { name: "Elena Brooks", role: "Chief Product Officer", bio: "Designs modular systems that teams actually love using." },
  { name: "Omar Farid", role: "Chief Technology Officer", bio: "Builds secure, scalable platforms for mission-critical work." },
];

export default function AboutPage() {
  return (
    <>
      <Section className="!pb-10 !pt-12 md:!pt-16">
        <Container>
          <Breadcrumbs items={[{ label: "About" }]} />
          <SectionHeader
            align="left"
            eyebrow="About WaamTech"
            title={`${siteConfig.fullName}`}
            description="We build premium enterprise software that helps organizations operate with precision, confidence, and calm."
            className="mb-0 max-w-3xl"
          />
        </Container>
      </Section>

      <Section muted className="!pt-10">
        <Container>
          <div className="grid gap-6 md:grid-cols-2">
            <AnimateIn>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Mission</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    Make enterprise operations software feel clear, trustworthy, and modern — so teams can focus on outcomes instead of fighting tools.
                  </p>
                </CardContent>
              </Card>
            </AnimateIn>
            <AnimateIn delay={0.08}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Vision</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    Become the operating system for ambitious businesses — modular enough to start lean, powerful enough to run global complexity.
                  </p>
                </CardContent>
              </Card>
            </AnimateIn>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeader eyebrow="Timeline" title="A decade of building for operators" />
          <div className="relative mx-auto max-w-3xl space-y-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-border">
            {timeline.map((item, i) => (
              <AnimateIn key={item.year} delay={i * 0.05}>
                <div className="relative pl-10">
                  <span className="absolute left-0 top-2 h-3.5 w-3.5 rounded-full border-2 border-primary bg-white" />
                  <p className="text-sm font-medium text-primary">{item.year}</p>
                  <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </Container>
      </Section>

      <Section muted id="leadership">
        <Container>
          <SectionHeader eyebrow="Leadership" title="People behind the platform" />
          <div className="grid gap-6 md:grid-cols-3">
            {leaders.map((person, i) => (
              <AnimateIn key={person.name} delay={i * 0.06}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary font-semibold">
                      {person.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <CardTitle className="text-lg">{person.name}</CardTitle>
                    <p className="text-sm text-primary font-medium">{person.role}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{person.bio}</p>
                  </CardContent>
                </Card>
              </AnimateIn>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container className="max-w-3xl">
          <SectionHeader
            eyebrow="Technology"
            title="Built for performance, security, and scale"
            description="Modern cloud architecture, role-based access, auditability, and APIs that integrate cleanly with the systems your business already runs."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "Secure multi-tenant cloud",
              "Role-based access control",
              "Audit trails & activity logs",
              "REST APIs & webhooks",
              "High-availability operations",
              "Modular product architecture",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-border bg-white px-5 py-4 text-sm font-medium">
                {item}
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <CTASection />
    </>
  );
}

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { AnimateIn } from "@/components/shared/animate-in";
import { ProductCard, IndustryCard } from "@/components/shared/cards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { products, industries, testimonials, caseStudies, blogPosts, pricingPlans } from "@/lib/data/site";
import { Price } from "@/components/shared/price";

export function SolutionsSection() {
  const solutions = [
    { title: "Retail & POS", text: "Sell faster across stores with synchronized inventory.", href: "/industries#retail" },
    { title: "Wholesale & Distribution", text: "Manage bulk orders, credit, and routes at scale.", href: "/industries#wholesale" },
    { title: "Manufacturing", text: "Connect materials, work orders, and costing.", href: "/industries#manufacturing" },
    { title: "Healthcare & Pharmacy", text: "Operate with compliance-ready workflows.", href: "/industries#healthcare" },
  ];

  return (
    <Section muted>
      <Container>
        <SectionHeader
          eyebrow="Business solutions"
          title="Purpose-built for the way enterprises actually work"
          description="Whether you run stores, warehouses, factories, or multi-branch networks — WaamTech adapts to your operating model."
        />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {solutions.map((s, i) => (
            <AnimateIn key={s.title} delay={i * 0.06}>
              <Link href={s.href} className="group block h-full">
                <Card className="h-full hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(15,23,42,0.08)] hover:border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">{s.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Learn more <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </AnimateIn>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export function ErpOverviewSection() {
  return (
    <Section>
      <Container>
        <div className="grid-12 items-center gap-10">
          <div className="col-span-12 lg:col-span-5">
            <AnimateIn>
              <SectionHeader
                align="left"
                className="mb-6"
                eyebrow="ERP overview"
                title="One system of record. Every department aligned."
                description="WaamTech ERP connects finance, inventory, sales, purchasing, HR, CRM, and analytics so leaders and operators work from the same truth."
              />
              <ul className="space-y-3 mb-8">
                {[
                  "Role-based workspaces for every team",
                  "Automation that removes repetitive approvals",
                  "Dashboards that surface the metrics that matter",
                  "Extensible modules as your business grows",
                ].map((item) => (
                  <li key={item} className="flex gap-3 text-sm md:text-base text-muted-foreground">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild>
                <Link href="/erp-features">
                  Explore ERP features
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </AnimateIn>
          </div>
          <div className="col-span-12 lg:col-span-7">
            <AnimateIn delay={0.1}>
              <div className="rounded-3xl border border-border bg-muted p-6 md:p-8">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { title: "Finance", desc: "Close books with confidence" },
                    { title: "Inventory", desc: "Know stock in real time" },
                    { title: "Sales", desc: "Quote to cash, streamlined" },
                    { title: "Analytics", desc: "Decisions backed by data" },
                  ].map((m) => (
                    <div key={m.title} className="rounded-2xl border border-border bg-white p-5">
                      <p className="font-semibold">{m.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{m.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </AnimateIn>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export function ProductsPreviewSection() {
  return (
    <Section muted>
      <Container>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <SectionHeader
            align="left"
            className="mb-0"
            eyebrow="Products"
            title="A complete suite for enterprise operations"
            description="Start with ERP and expand into specialized modules without losing consistency."
          />
          <Button asChild variant="outline" className="shrink-0 self-start md:self-auto">
            <Link href="/products">
              View all products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.slice(0, 6).map((p, i) => (
            <AnimateIn key={p.id} delay={i * 0.05}>
              <ProductCard
                name={p.name}
                tagline={p.tagline}
                description={p.description}
                icon={p.icon}
                href={`/products#${p.slug}`}
                status={p.status}
                features={p.features}
              />
            </AnimateIn>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export function IndustriesPreviewSection() {
  return (
    <Section>
      <Container>
        <SectionHeader
          eyebrow="Industries"
          title="Trusted across industries that move fast"
          description="From retail floors to factory floors — WaamTech is configured for how your industry operates."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {industries.slice(0, 8).map((ind, i) => (
            <AnimateIn key={ind.id} delay={i * 0.04}>
              <IndustryCard
                name={ind.name}
                description={ind.description}
                icon={ind.icon}
                href={`/industries#${ind.slug}`}
                benefits={ind.benefits}
              />
            </AnimateIn>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button asChild variant="outline">
            <Link href="/industries">Browse all industries</Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

export function TestimonialsSection() {
  return (
    <Section muted>
      <Container>
        <SectionHeader
          eyebrow="Customers"
          title="Teams choose WaamTech for clarity and control"
          description="Operators and leaders trust WaamTech to keep complex businesses running smoothly."
        />
        <div className="grid gap-6 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <AnimateIn key={t.id} delay={i * 0.08}>
              <Card className="h-full">
                <CardContent className="pt-6">
                  <p className="text-base leading-relaxed text-foreground/90">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-6 border-t border-border pt-5">
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {t.role}, {t.company}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </AnimateIn>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export function CaseStudiesSection() {
  return (
    <Section>
      <Container>
        <SectionHeader
          eyebrow="Case studies"
          title="Outcomes that matter to the business"
          description="Real operational improvements from teams running WaamTech across retail, distribution, and healthcare."
        />
        <div className="grid gap-6 lg:grid-cols-3">
          {caseStudies.map((c, i) => (
            <AnimateIn key={c.id} delay={i * 0.08}>
              <Card className="h-full hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
                <CardHeader>
                  <Badge variant="outline" className="w-fit">{c.industry}</Badge>
                  <CardTitle className="mt-3 text-xl">{c.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold tracking-tight text-primary">{c.metric}</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{c.result}</p>
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{c.description}</p>
                </CardContent>
              </Card>
            </AnimateIn>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export function PricingPreviewSection() {
  const featured = pricingPlans.filter((p) => p.id === "professional" || p.id === "business");

  return (
    <Section muted>
      <Container>
        <SectionHeader
          eyebrow="Pricing"
          title="Transparent plans that scale with you"
          description="Start lean, expand as your teams and locations grow. Enterprise options available."
        />
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {featured.map((plan, i) => (
            <AnimateIn key={plan.id} delay={i * 0.08}>
              <Card className={plan.popular ? "border-primary shadow-[0_12px_40px_rgba(37,99,235,0.08)]" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{plan.name}</CardTitle>
                    {plan.popular ? <Badge>Popular</Badge> : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                  <p className="pt-3">
                    <span className="text-4xl font-semibold tracking-tight">
                      {plan.monthlyPrice ? <Price usd={plan.monthlyPrice} /> : "Custom"}
                    </span>
                    {plan.monthlyPrice ? <span className="text-muted-foreground text-sm"> /month</span> : null}
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {plan.features.slice(0, 5).map((f) => (
                      <li key={f} className="text-sm text-muted-foreground flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full" variant={plan.popular ? "default" : "outline"}>
                    <Link href={plan.href}>{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            </AnimateIn>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button asChild variant="outline">
            <Link href="/pricing">Compare all plans</Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

export function BlogPreviewSection() {
  return (
    <Section>
      <Container>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <SectionHeader
            align="left"
            className="mb-0"
            eyebrow="Latest insights"
            title="Ideas for building better operations"
            description="Product thinking, ERP strategy, and practical guides from the WaamTech team."
          />
          <Button asChild variant="outline">
            <Link href="/blog">View blog</Link>
          </Button>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {blogPosts.slice(0, 3).map((post, i) => (
            <AnimateIn key={post.id} delay={i * 0.06}>
              <Link href={`/blog/${post.slug}`} className="group block h-full">
                <Card className="h-full hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
                  <CardHeader>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="muted">{post.category}</Badge>
                      <span>{post.readTime}</span>
                    </div>
                    <CardTitle className="mt-2 group-hover:text-primary transition-colors text-xl leading-snug">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{post.excerpt}</p>
                  </CardContent>
                </Card>
              </Link>
            </AnimateIn>
          ))}
        </div>
      </Container>
    </Section>
  );
}

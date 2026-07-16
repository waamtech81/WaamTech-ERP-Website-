import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/lib/data/site";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AnimateIn } from "@/components/shared/animate-in";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Blog",
  description: "Insights on ERP, inventory, product design, and operational excellence from WaamTech.",
};

export default function BlogPage() {
  const featured = blogPosts.find((p) => p.featured) ?? blogPosts[0];
  const rest = blogPosts.filter((p) => p.id !== featured.id);
  const categories = Array.from(new Set(blogPosts.map((p) => p.category)));

  return (
    <>
      <Section className="!pb-10 !pt-12 md:!pt-16">
        <Container>
          <Breadcrumbs items={[{ label: "Blog" }]} />
          <SectionHeader
            align="left"
            eyebrow="Blog"
            title="Insights for modern operators"
            description="Practical writing on ERP strategy, inventory systems, and premium product experiences."
            className="mb-8 max-w-3xl"
          />
          <div className="flex flex-wrap gap-2">
            <Badge>All</Badge>
            {categories.map((c) => (
              <Badge key={c} variant="outline">
                {c}
              </Badge>
            ))}
          </div>
        </Container>
      </Section>

      <Section muted className="!pt-10">
        <Container>
          <AnimateIn>
            <Link href={`/blog/${featured.slug}`} className="group block mb-10">
              <Card className="overflow-hidden hover:shadow-[0_16px_48px_rgba(15,23,42,0.08)] transition-shadow">
                <div className="grid lg:grid-cols-2">
                  <div className="min-h-[220px] bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10" />
                  <div className="p-8 md:p-10">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="muted">{featured.category}</Badge>
                      <span>{featured.readTime}</span>
                      <span>·</span>
                      <span>{featured.date}</span>
                    </div>
                    <h2 className="mt-4 text-2xl md:text-3xl font-semibold tracking-tight group-hover:text-primary transition-colors text-balance">
                      {featured.title}
                    </h2>
                    <p className="mt-3 text-muted-foreground leading-relaxed">{featured.excerpt}</p>
                    <p className="mt-6 text-sm font-medium text-primary">Read article →</p>
                  </div>
                </div>
              </Card>
            </Link>
          </AnimateIn>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((post, i) => (
              <AnimateIn key={post.id} delay={i * 0.05}>
                <Link href={`/blog/${post.slug}`} className="group block h-full">
                  <Card className="h-full hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
                    <CardHeader>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="muted">{post.category}</Badge>
                        <span>{post.readTime}</span>
                      </div>
                      <CardTitle className="mt-2 group-hover:text-primary transition-colors leading-snug">
                        {post.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">{post.excerpt}</p>
                      <p className="mt-4 text-xs text-muted-foreground">
                        {post.author} · {post.date}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </AnimateIn>
            ))}
          </div>

          <div className="mt-12 flex justify-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button size="sm">1</Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}

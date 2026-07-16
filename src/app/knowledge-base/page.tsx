import type { Metadata } from "next";
import { Search } from "lucide-react";
import { kbArticles } from "@/lib/data/site";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AnimateIn } from "@/components/shared/animate-in";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Knowledge Base",
  description: "Search WaamTech knowledge base articles, categories, and popular topics.",
};

const categories = ["All", "Finance", "Inventory", "POS", "Admin", "Integrations", "Support"];

export default function KnowledgeBasePage() {
  const popular = kbArticles.filter((a) => a.popular);

  return (
    <>
      <Section className="!pb-10 !pt-12 md:!pt-16">
        <Container>
          <Breadcrumbs items={[{ label: "Knowledge Base" }]} />
          <SectionHeader
            eyebrow="Knowledge base"
            title="Answers for operators and admins"
            description="Practical articles for day-to-day configuration, troubleshooting, and best practices."
          />
          <div className="relative mx-auto mb-8 max-w-xl">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search articles..." className="pl-11 bg-white" />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((c) => (
              <Badge key={c} variant={c === "All" ? "default" : "outline"} className="cursor-default">
                {c}
              </Badge>
            ))}
          </div>
        </Container>
      </Section>

      <Section muted className="!pt-10">
        <Container>
          <h2 className="mb-6 text-xl font-semibold">Popular topics</h2>
          <div className="mb-12 grid gap-5 md:grid-cols-3">
            {popular.map((a, i) => (
              <AnimateIn key={a.id} delay={i * 0.05}>
                <Card className="h-full hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
                  <CardHeader>
                    <Badge variant="muted" className="w-fit">{a.category}</Badge>
                    <CardTitle className="text-lg mt-2">{a.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{a.excerpt}</p>
                  </CardContent>
                </Card>
              </AnimateIn>
            ))}
          </div>

          <h2 className="mb-6 text-xl font-semibold">All articles</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {kbArticles.map((a, i) => (
              <AnimateIn key={a.id} delay={(i % 2) * 0.04}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant="outline">{a.category}</Badge>
                      {a.popular ? <Badge variant="accent">Popular</Badge> : null}
                    </div>
                    <CardTitle className="text-lg mt-2">{a.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{a.excerpt}</p>
                  </CardContent>
                </Card>
              </AnimateIn>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}

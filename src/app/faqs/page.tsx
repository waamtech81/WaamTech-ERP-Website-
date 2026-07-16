"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { faqs } from "@/lib/data/site";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const categories = ["All", ...Array.from(new Set(faqs.map((f) => f.category)))];

export default function FaqsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = useMemo(() => {
    return faqs.filter((f) => {
      const matchesCategory = category === "All" || f.category === category;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  return (
    <>
      <Section className="!pb-6 !pt-12 md:!pt-16">
        <Container>
          <Breadcrumbs items={[{ label: "FAQs" }]} />
          <SectionHeader
            eyebrow="FAQs"
            title="Answers to common questions"
            description="Search by topic or browse categories across product, billing, support, security, and integrations."
          />
          <div className="relative mx-auto mb-6 max-w-xl">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search FAQs..."
              className="pl-11 bg-white"
            />
          </div>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {categories.map((c) => (
              <button key={c} type="button" onClick={() => setCategory(c)}>
                <Badge variant={category === c ? "default" : "outline"}>{c}</Badge>
              </button>
            ))}
          </div>
        </Container>
      </Section>

      <Section muted className="!pt-6">
        <Container className="max-w-3xl">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-border bg-white p-10 text-center text-muted-foreground">
              No FAQs match your search.
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full rounded-2xl border border-border bg-white px-5">
              {filtered.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger>
                    <span className="pr-4">
                      <span className="mr-2 inline-block">
                        <Badge variant="muted" className="align-middle">
                          {faq.category}
                        </Badge>
                      </span>
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </Container>
      </Section>
    </>
  );
}

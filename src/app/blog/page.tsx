import type { Metadata } from "next";
import { blogPosts } from "@/lib/data/site";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { BlogIndex } from "@/components/blog/blog-index";

export const metadata: Metadata = {
  title: "Blog — ERP, industries & operations insights",
  description:
    "Practical guides on ERP, inventory, POS, finance, AI, Custom ERP, and industry operations from WAAMTO / WaamTech.",
  keywords: [
    "ERP blog",
    "inventory management tips",
    "POS retail guide",
    "WAAMTO insights",
  ],
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <>
      <Section className="!pb-6 !pt-12 md:!pt-16">
        <Container>
          <SectionHeader
            eyebrow="Blog"
            as="h1"
            title="Insights for modern operators"
            description="Industry guides and practical writing on ERP, inventory, POS, finance, and AI — written for people who close the day on the floor."
            className="mb-2"
          />
        </Container>
      </Section>

      <Section muted className="!pt-6">
        <Container>
          <BlogIndex posts={blogPosts} />
        </Container>
      </Section>
    </>
  );
}

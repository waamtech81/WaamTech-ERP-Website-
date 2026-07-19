import type { Metadata } from "next";
import { blogPosts } from "@/lib/data/site";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { BlogIndex } from "@/components/blog/blog-index";

export const metadata: Metadata = {
  title: "Blog — ERP, industries & operations insights",
  description:
    "Practical guides on ERP, inventory, POS, finance, AI, and industry-specific operations from WaamTech. Written for operators who run real businesses.",
};

export default function BlogPage() {
  return (
    <>
      <Section className="!pb-6 !pt-12 md:!pt-16">
        <Container>
          <Breadcrumbs items={[{ label: "Blog" }]} />
          <SectionHeader
            align="left"
            eyebrow="Blog"
            title="Insights for modern operators"
            description="Industry guides and practical writing on ERP, inventory, POS, finance, and AI — written for people who close the day on the floor."
            className="mb-6 max-w-3xl"
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

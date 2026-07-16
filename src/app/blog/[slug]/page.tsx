import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts } from "@/lib/data/site";
import { Container, Section } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return { title: "Article" };
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <Section className="!py-12 md:!py-16">
      <Container className="max-w-3xl">
        <Breadcrumbs items={[{ label: "Blog", href: "/blog" }, { label: post.title }]} />
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Badge variant="muted">{post.category}</Badge>
          <span>{post.readTime}</span>
          <span>·</span>
          <span>{post.date}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-balance">{post.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">{post.excerpt}</p>
        <p className="mt-6 text-sm text-muted-foreground">By {post.author}</p>
        <div className="mt-10 space-y-5 text-muted-foreground leading-relaxed">
          <p>
            Modern enterprises lose time and money when systems don&apos;t talk to each other.
            WaamTech is designed to reduce those blind spots by unifying operational data into
            a single, trustworthy layer.
          </p>
          <p>
            This article explores practical patterns for connecting inventory, finance, and sales
            workflows — and why clarity in software design is as important as feature depth.
          </p>
          <p>
            Whether you&apos;re evaluating ERP platforms or optimizing an existing stack, focus on
            adoption, data integrity, and the quality of daily operator experience.
          </p>
        </div>
        <div className="mt-12">
          <Button asChild variant="outline">
            <Link href="/blog">← Back to blog</Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

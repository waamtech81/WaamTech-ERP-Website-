import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts } from "@/lib/data/site";
import { Container, Section } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { BlogBody } from "@/components/blog/blog-body";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { optimizeImageUrl } from "@/lib/images";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return { title: "Article" };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      images: [{ url: post.image }],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  const related = blogPosts
    .filter(
      (p) =>
        p.id !== post.id &&
        (p.category === post.category ||
          (post.industry && p.industry === post.industry) ||
          p.tags?.some((t) => post.tags?.includes(t)))
    )
    .slice(0, 3);

  const blocks =
    post.blocks?.length > 0
      ? post.blocks
      : (post.content ?? []).map((text) => ({ type: "p" as const, text }));

  return (
    <Section className="!py-12 md:!py-16">
      <Container className="max-w-3xl">
        <Breadcrumbs items={[{ label: "Blog", href: "/blog" }, { label: post.title }]} />
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="muted">{post.category}</Badge>
          {post.industry ? <Badge variant="outline">{post.industry}</Badge> : null}
          <span>{post.readTime}</span>
          <span>·</span>
          <span>{post.date}</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-balance text-[#0b1f3a] md:text-4xl">
          {post.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
        <p className="mt-6 text-sm text-muted-foreground">By {post.author}</p>

        <div className="relative mt-8 aspect-[16/9] max-h-[360px] overflow-hidden rounded-xl bg-muted">
          <Image
            src={optimizeImageUrl(post.image, { width: 1200 })}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            quality={70}
            className="object-cover"
            priority
          />
        </div>

        <BlogBody blocks={blocks} />

        {related.length > 0 ? (
          <div className="mt-14 border-t border-border pt-10">
            <h2 className="text-lg font-semibold tracking-tight text-[#0b1f3a]">Related reading</h2>
            <ul className="mt-4 space-y-3">
              {related.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/blog/${r.slug}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {r.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">{r.category}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-12">
          <Button asChild variant="outline">
            <Link href="/blog">← Back to blog</Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

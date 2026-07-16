import Link from "next/link";
import { Boxes } from "lucide-react";
import { siteConfig, products } from "@/lib/data/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/shared/section";

const footerColumns = [
  {
    title: "Products",
    links: products.slice(0, 6).map((p) => ({ label: p.name, href: `/products#${p.slug}` })),
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/about#leadership" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "Knowledge Base", href: "/knowledge-base" },
      { label: "FAQs", href: "/faqs" },
      { label: "Support", href: "/support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Customer Portal", href: "/portal" },
      { label: "Plans", href: "/plans" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted">
      <Container className="py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
                <Boxes className="h-4 w-4" />
              </span>
              <span className="font-[family-name:var(--font-poppins)] text-lg font-semibold">
                {siteConfig.name}
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground leading-relaxed">
              {siteConfig.description}
            </p>
            <div className="mt-6">
              <p className="text-sm font-medium mb-2">Subscribe to product updates</p>
              <form className="flex gap-2" action="/contact" method="get">
                <Input
                  type="email"
                  name="email"
                  placeholder="Work email"
                  aria-label="Email for newsletter"
                  className="bg-white"
                />
                <Button type="submit">Join</Button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {footerColumns.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-semibold mb-4">{col.title}</h3>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-border pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {siteConfig.fullName}. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <a href={siteConfig.social.linkedin} className="hover:text-primary transition-colors" target="_blank" rel="noreferrer">
              LinkedIn
            </a>
            <a href={siteConfig.social.twitter} className="hover:text-primary transition-colors" target="_blank" rel="noreferrer">
              X / Twitter
            </a>
            <a href={siteConfig.social.youtube} className="hover:text-primary transition-colors" target="_blank" rel="noreferrer">
              YouTube
            </a>
            <a href={siteConfig.social.github} className="hover:text-primary transition-colors" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}

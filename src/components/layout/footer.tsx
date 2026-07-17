import Link from "next/link";
import { Share2 } from "lucide-react";
import { siteConfig, products } from "@/lib/data/site";
import { Container } from "@/components/shared/section";
import { CurrencySwitcher } from "@/components/layout/locale-controls";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { AppStoreBadges } from "@/components/layout/app-store-badges";
import { FooterReveal } from "@/components/layout/footer-reveal";
import { BrandLogo } from "@/components/shared/brand-logo";
import { TrustBadgeStrip } from "@/components/trust-badges";

const footerColumns = [
  {
    title: "Products",
    links: products.slice(0, 6).map((p) => ({ label: p.name, href: `/products#${p.slug}` })),
  },
  {
    title: "Industries",
    links: [
      { label: "Retail & Commerce", href: "/industries/retail_commerce" },
      { label: "Automotive & Vehicle", href: "/industries/automotive_vehicle" },
      { label: "Healthcare & Pharmacy", href: "/industries/healthcare_pharmacy" },
      { label: "Restaurant & Food", href: "/industries/restaurant_food_service" },
      { label: "All industries", href: "/industries" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Security & Trust", href: "/security" },
      { label: "Mobile App", href: "/mobile-app" },
      { label: "Servers & Hosting", href: "/servers" },
      { label: "Blog", href: "/blog" },
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
      { label: "Pricing", href: "/pricing" },
    ],
  },
];

const linkClass = "text-sm text-slate-400 hover:text-white transition-colors";

export function Footer() {
  return (
    <FooterReveal className="border-t border-white/[0.06] bg-[#071526] text-slate-200">
      <div className="relative isolate overflow-hidden bg-[#071526]">
        <div className="wt-footer-reveal" aria-hidden />
        <div className="wt-footer-edge" aria-hidden />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(147,197,253,0.07),transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 bottom-4 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.08),transparent_72%)]"
        />

        <Container className="relative z-[1] py-16 md:py-20">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <BrandLogo tone="dark" height={36} />
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
                {siteConfig.description}
              </p>
              <NewsletterForm variant="dark" />
            </div>

            <div className="lg:col-span-8 grid grid-cols-2 gap-8 md:grid-cols-4">
              {footerColumns.map((col) => (
                <div key={col.title}>
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-white/90">
                    {col.title}
                  </h3>
                  <ul className="space-y-2.5">
                    {col.links.map((link) => (
                      <li key={link.href + link.label}>
                        <Link href={link.href} className={linkClass}>
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <AppStoreBadges variant="dark" />
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
                WAAMTO Trust
              </p>
              <TrustBadgeStrip
                set="footer"
                tone="dark"
                size="xs"
                href="/security"
                showLabel={false}
                layout="row"
                className="justify-end"
              />
            </div>
          </div>

          <div className="wt-footer-divider mt-14 flex flex-col gap-5 border-t pt-8 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <p className="text-sm text-slate-500">
                © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
              </p>
              <p className="text-sm text-slate-500">
                Maintained by{" "}
                <a
                  href={siteConfig.companyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-sky-300 hover:text-white"
                >
                  {siteConfig.companyName}
                </a>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-sm text-slate-400">
              <div className="relative z-10 flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Currency
                </span>
                <CurrencySwitcher align="end" tone="dark" />
              </div>
              <Link href="/privacy" className={linkClass}>
                Privacy
              </Link>
              <Link href="/terms" className={linkClass}>
                Terms
              </Link>
              <a
                href={siteConfig.social.linkedin}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.05] text-slate-400 transition-colors hover:border-white/10 hover:text-white"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
              >
                <Share2 className="h-4 w-4" />
              </a>
              <a
                href={siteConfig.social.youtube}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.05] text-slate-400 transition-colors hover:border-white/10 hover:text-white"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
              >
                <Share2 className="h-4 w-4" />
              </a>
            </div>
          </div>
        </Container>
      </div>
    </FooterReveal>
  );
}

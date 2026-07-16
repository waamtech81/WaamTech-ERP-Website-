import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { docCategories } from "@/lib/data/site";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AnimateIn } from "@/components/shared/animate-in";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Documentation",
  description: "Professional WaamTech documentation with categories for getting started, ERP core, modules, and administration.",
};

export default function DocsPage() {
  return (
    <Section className="!py-12 md:!py-16">
      <Container>
        <Breadcrumbs items={[{ label: "Documentation" }]} />
        <div className="grid gap-10 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <div className="sticky top-24 rounded-2xl border border-border bg-white p-5">
              <p className="mb-4 text-sm font-semibold">Categories</p>
              <nav className="space-y-1">
                {docCategories.map((cat) => (
                  <a
                    key={cat.id}
                    href={`#${cat.id}`}
                    className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    {cat.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <div className="lg:col-span-9">
            <SectionHeader
              align="left"
              className="mb-8"
              eyebrow="Documentation"
              title="Build with confidence"
              description="Guides and references for configuring workspaces, modules, permissions, and billing."
            />
            <div className="relative mb-10 max-w-xl">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search documentation..." className="pl-11 bg-white" />
            </div>

            <div className="space-y-8">
              {docCategories.map((cat, i) => (
                <AnimateIn key={cat.id} delay={i * 0.05}>
                  <Card id={cat.id}>
                    <CardHeader>
                      <CardTitle>{cat.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{cat.description}</p>
                    </CardHeader>
                    <CardContent>
                      <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                        {cat.articles.map((article) => (
                          <li key={article.href}>
                            <Link
                              href={article.href}
                              className="block px-4 py-3.5 text-sm font-medium hover:bg-muted transition-colors"
                            >
                              {article.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </AnimateIn>
              ))}
            </div>

            <div className="mt-10 space-y-6 scroll-mt-28" id="create-workspace">
              <article className="rounded-2xl border border-border bg-white p-6 md:p-8">
                <h2 className="text-xl font-semibold">Create your workspace</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  After signing up, name your workspace, choose your primary industry, and select starter modules.
                  You can invite administrators immediately and expand entitlements later from the customer portal.
                </p>
              </article>
              <article className="rounded-2xl border border-border bg-white p-6 md:p-8" id="invite-users">
                <h2 className="text-xl font-semibold">Invite users & roles</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  Assign roles such as Admin, Finance, Warehouse, Sales, and Viewer. Permissions are modular so
                  teams only see the workflows they need.
                </p>
              </article>
              <article className="rounded-2xl border border-border bg-white p-6 md:p-8" id="company-settings">
                <h2 className="text-xl font-semibold">Configure company settings</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  Set legal entities, currencies, tax profiles, warehouses, and fiscal calendars before going live.
                </p>
              </article>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

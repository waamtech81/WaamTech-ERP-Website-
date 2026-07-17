import type { Metadata } from "next";
import Link from "next/link";
import {
  CreditCard,
  Download,
  FileText,
  HeadphonesIcon,
  KeyRound,
  LayoutDashboard,
} from "lucide-react";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AnimateIn } from "@/components/shared/animate-in";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppLoginUrl } from "@/lib/auth/config";

export const metadata: Metadata = {
  title: "Customer Portal",
  description: "Manage licenses, subscriptions, invoices, support tickets, and downloads in the WaamTech customer portal.",
};

const portalModules = [
  { title: "Dashboard", description: "Workspace health, usage, and renewal overview.", icon: LayoutDashboard },
  { title: "Licenses", description: "Active seats, module entitlements, and assignments.", icon: KeyRound },
  { title: "Subscriptions", description: "Plan details, billing cycle, and upgrades.", icon: CreditCard },
  { title: "Invoices", description: "Download invoices and review payment history.", icon: FileText },
  { title: "Support tickets", description: "Track open issues and priority support status.", icon: HeadphonesIcon },
  { title: "Downloads", description: "Installers, connectors, and release notes.", icon: Download },
];

export default function PortalPage() {
  return (
    <>
      <Section className="!pb-10 !pt-12 md:!pt-16">
        <Container>
          <Breadcrumbs items={[{ label: "Customer Portal" }]} />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeader
              align="left"
              className="mb-0"
              eyebrow="Customer portal"
              title="Your control center for licenses and support"
              description="A clean preview of the portal experience — manage subscriptions, invoices, tickets, and downloads in one place."
            />
            <Button asChild size="lg" className="shrink-0 self-start">
              <a href={getAppLoginUrl()}>Open WAAMTO ERP</a>
            </Button>
          </div>
        </Container>
      </Section>

      <Section muted className="!pt-10">
        <Container>
          <AnimateIn>
            <Card className="mb-10 overflow-hidden">
              <CardHeader className="border-b border-border bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>Acme Operations workspace</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">Professional plan · Renews Aug 16, 2026</p>
                  </div>
                  <Badge variant="accent">Active</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4 bg-muted/40">
                {[
                  { label: "Licensed users", value: "18 / 25" },
                  { label: "Open tickets", value: "2" },
                  { label: "Next invoice", value: "$1,782" },
                  { label: "Modules", value: "ERP + POS + CRM" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-border bg-white p-4">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="mt-2 text-xl font-semibold tracking-tight">{stat.value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </AnimateIn>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {portalModules.map((m, i) => (
              <AnimateIn key={m.title} delay={i * 0.05}>
                <Card className="h-full hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
                  <CardHeader>
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 text-primary">
                      <m.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{m.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{m.description}</p>
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

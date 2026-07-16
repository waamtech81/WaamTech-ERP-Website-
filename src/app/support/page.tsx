import type { Metadata } from "next";
import Link from "next/link";
import { Headphones, Mail, MessageCircle, Ticket, Zap } from "lucide-react";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AnimateIn } from "@/components/shared/animate-in";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Support",
  description: "Get WaamTech support via tickets, email, WhatsApp, live chat, and priority enterprise support.",
};

const options = [
  {
    title: "Support ticket",
    description: "Create and track issues from the customer portal with full context.",
    icon: Ticket,
    href: "/portal",
    cta: "Open portal",
  },
  {
    title: "Email support",
    description: "Reach our team for non-urgent questions and account assistance.",
    icon: Mail,
    href: `mailto:${siteConfig.supportEmail}`,
    cta: "Email us",
  },
  {
    title: "WhatsApp",
    description: "Quick operational help for eligible Business and Enterprise plans.",
    icon: MessageCircle,
    href: "/contact?channel=whatsapp",
    cta: "Request WhatsApp",
  },
  {
    title: "Live chat",
    description: "Chat with support during business hours for guided troubleshooting.",
    icon: Headphones,
    href: "/contact?channel=chat",
    cta: "Start chat",
  },
  {
    title: "Priority support",
    description: "Dedicated response SLAs, escalation paths, and success management.",
    icon: Zap,
    href: "/contact?intent=priority-support",
    cta: "Talk to sales",
  },
];

export default function SupportPage() {
  return (
    <>
      <Section className="!pb-10 !pt-12 md:!pt-16">
        <Container>
          <Breadcrumbs items={[{ label: "Support" }]} />
          <SectionHeader
            align="left"
            eyebrow="Support"
            title="Help when your operations need it"
            description="Choose the channel that fits your urgency — from self-serve docs to priority enterprise support."
            className="mb-0 max-w-3xl"
          />
        </Container>
      </Section>

      <Section muted className="!pt-10">
        <Container>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {options.map((opt, i) => (
              <AnimateIn key={opt.title} delay={i * 0.05}>
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 text-primary">
                      <opt.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{opt.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col">
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">{opt.description}</p>
                    <Button asChild variant="outline" className="mt-6 w-full">
                      <Link href={opt.href}>{opt.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              </AnimateIn>
            ))}
          </div>

          <div className="mt-12 rounded-3xl border border-border bg-white p-8 md:p-10 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Prefer self-serve?</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Browse documentation and knowledge base articles before opening a ticket.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              <Button asChild>
                <Link href="/docs">Documentation</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/knowledge-base">Knowledge base</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

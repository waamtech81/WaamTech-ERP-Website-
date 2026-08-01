import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle, Ticket } from "lucide-react";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AnimateIn } from "@/components/shared/animate-in";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OpenLiveChatButton } from "@/components/support/open-live-chat-button";
import { getAppLoginUrl } from "@/lib/auth/config";

export const metadata: Metadata = {
  title: "Support — Help Center",
  description:
    "Get help from WAAMTO through our secure contact form, live chat, documentation, and ERP support workspace. Fast answers when operations need them.",
  alternates: { canonical: "/support" },
};

export default function SupportPage() {
  return (
    <>
      <Section className="!pb-10 !pt-12 md:!pt-16">
        <Container>
          <Breadcrumbs items={[{ label: "Support" }]} />
          <SectionHeader
            align="left"
            as="h1"
            eyebrow="Support"
            title="Help when your operations need it"
            description="Email our team, open live chat, or sign in to your ERP workspace for operational support on The Next-Generation ERP Cloud Platform."
            className="mb-0 max-w-3xl"
          />
        </Container>
      </Section>

      <Section muted className="!pt-10">
        <Container>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimateIn>
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 text-primary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Email support</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                    Reach our team for account help, billing questions, and non-urgent issues via the secure contact form.
                  </p>
                  <p className="mt-4 text-sm font-medium text-foreground">
                    Sign in to view support email, or use the contact form.
                  </p>
                  <Button asChild variant="outline" className="mt-6 w-full rounded-full">
                    <Link href="/contact">Contact us</Link>
                  </Button>
                </CardContent>
              </Card>
            </AnimateIn>

            <AnimateIn delay={0.05}>
              <Card className="h-full flex flex-col" data-live-chat-provider="tawk">
                <CardHeader>
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 text-primary">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Live chat</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                    Chat with WAAMTO support in real time. If the chat bubble is hidden, use the
                    button below to open live chat.
                  </p>
                  <div
                    id="waamto-live-chat-mount"
                    className="mt-4"
                    data-chat-status="ready"
                    aria-live="polite"
                  >
                    <OpenLiveChatButton />
                  </div>
                </CardContent>
              </Card>
            </AnimateIn>

            <AnimateIn delay={0.1}>
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 text-primary">
                    <Ticket className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Support tickets</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                    Create and track tickets inside the WAAMTO application. Sign in to your
                    workspace — support is not hosted in the customer portal.
                  </p>
                  <Button asChild className="mt-6 w-full rounded-full">
                    <a href={getAppLoginUrl()} target="_blank" rel="noopener noreferrer">
                      Sign in to WAAMTO
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </AnimateIn>
          </div>

          <div className="mt-12 rounded-3xl border border-border bg-white p-8 md:p-10 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Prefer self-serve?</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Use the complete WAAMTO ERP documentation or watch training videos before opening a ticket.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              <Button asChild className="rounded-full">
                <a href="https://doc.waamto.com">Open documentation</a>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <a href="https://youtube.com/@waamto" target="_blank" rel="noopener noreferrer">
                  Watch training videos
                </a>
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

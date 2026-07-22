import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { aiHighlights, siteConfig } from "@/lib/data/site";
import { getIcon } from "@/lib/icons";
import { Container, Section } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AiHighlightSection() {
  return (
    <Section className="wt-ai-section !py-16 md:!py-20 bg-[#0b1f3a] text-white">
      <Container>
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <Badge className="mb-4 border-white/[0.06] bg-white/10 text-white hover:bg-white/15">
            New · Built into {siteConfig.name}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-balance">
            AI that works with your ERP — privately
          </h2>
          <p className="mt-4 text-base md:text-lg text-white/70 leading-relaxed">
            Your built-in AI Assistant helps your team understand how to use WAAMTO, find the right
            workflow, scan documents, and get smart recommendations across Inventory, Sales, Finance,
            CRM, and more. Inference stays on your stack — no public AI API keys required.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {aiHighlights.map((item) => {
            const Icon = getIcon(item.icon);
            return (
              <Card
                key={item.title}
                className="wt-ai-card border-white/[0.06] bg-white/[0.06] text-white shadow-none transition-[box-shadow,border-color,background-color,transform] duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.1] hover:shadow-[0_16px_48px_rgba(56,189,248,0.22)]"
                style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}
              >
                <CardHeader className="pb-2">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/25 text-sky-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base text-white">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-white/65 leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="rounded-full bg-white text-[#0b1f3a] hover:bg-slate-100">
            <Link href="/products#ai">
              Explore AI Workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-full border-white/[0.08] bg-transparent text-white hover:bg-white/10 hover:text-white"
            style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}
          >
            <Link href="/pricing">See which plans include AI</Link>
          </Button>
        </div>
        <p className="mt-5 text-center text-sm text-white/65">
          Need step-by-step help?{" "}
          <a
            href="https://doc.waamto.com"
            className="font-medium text-sky-200 underline underline-offset-4 hover:text-white"
          >
            Browse the complete WAAMTO ERP documentation
          </a>
          {" "}or{" "}
          <a
            href={siteConfig.social.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sky-200 underline underline-offset-4 hover:text-white"
          >
            watch WAAMTO training on YouTube
          </a>
          .
        </p>
      </Container>
    </Section>
  );
}

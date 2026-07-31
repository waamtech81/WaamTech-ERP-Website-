import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { aiHighlights, siteConfig } from "@/lib/data/site";
import { getIcon } from "@/lib/icons";
import { Container, Section } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function AiHighlightSection() {
  return (
    <Section className="wt-ai-section !py-16 md:!py-24 bg-[#0b1220] text-white">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-16 items-start">
          <div className="max-w-xl">
            <Badge className="mb-5 border-white/10 bg-white/10 text-white hover:bg-white/15">
              New · Built into {siteConfig.name}
            </Badge>
            <h2 className="font-heading text-section font-semibold tracking-tight text-balance leading-[1.15]">
              AI that works with your ERP — privately
            </h2>
            <p className="mt-5 text-[1.0625rem] text-white/65 leading-relaxed text-pretty">
              Your built-in AI Assistant helps your team understand how to use WAAMTO, find the right
              workflow, scan documents, and get smart recommendations across Inventory, Sales, Finance,
              CRM, and more. Inference stays on your stack — no public AI API keys required.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full bg-white text-[#0b1220] hover:bg-slate-100">
                <Link href="/products#ai">
                  Explore AI Workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/pricing">See which plans include AI</Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-white/55">
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
                watch on YouTube
              </a>
              .
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {aiHighlights.map((item) => {
              const Icon = getIcon(item.icon);
              return (
                <div
                  key={item.title}
                  className="rounded-xl border border-white/10 bg-white/[0.04] p-5 transition-colors hover:bg-white/[0.07]"
                >
                  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/30 text-sky-200">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-heading text-[0.9375rem] font-semibold tracking-tight text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-white/55 leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </Section>
  );
}

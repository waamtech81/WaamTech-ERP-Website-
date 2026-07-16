import type { Metadata } from "next";
import { Container, Section } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { siteConfig } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "WaamTech Technologies terms of service.",
};

export default function TermsPage() {
  return (
    <Section className="!py-12 md:!py-16">
      <Container className="max-w-3xl">
        <Breadcrumbs items={[{ label: "Terms of Service" }]} />
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-4 text-muted-foreground">Last updated: July 16, 2026</p>
        <div className="mt-10 space-y-6 text-muted-foreground leading-relaxed">
          <p>
            These Terms govern your access to the {siteConfig.fullName} website and subscription services.
            By using WaamTech, you agree to these Terms.
          </p>
          <h2 className="text-xl font-semibold text-foreground">Accounts & workspaces</h2>
          <p>
            You are responsible for maintaining the security of your account credentials and for activity under your workspace.
          </p>
          <h2 className="text-xl font-semibold text-foreground">Subscriptions</h2>
          <p>
            Paid plans renew according to your selected billing cycle unless canceled. Enterprise agreements may include custom terms and SLAs.
          </p>
          <h2 className="text-xl font-semibold text-foreground">Acceptable use</h2>
          <p>
            You may not misuse the platform, attempt unauthorized access, or use WaamTech in violation of applicable laws.
          </p>
          <h2 className="text-xl font-semibold text-foreground">Contact</h2>
          <p>
            Questions about these Terms can be sent to {siteConfig.email}.
          </p>
        </div>
      </Container>
    </Section>
  );
}

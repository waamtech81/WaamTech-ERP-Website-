import type { Metadata } from "next";
import { Container, Section } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { siteConfig } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "WaamTech Technologies privacy policy.",
};

export default function PrivacyPage() {
  return (
    <Section className="!py-12 md:!py-16">
      <Container className="max-w-3xl">
        <Breadcrumbs items={[{ label: "Privacy Policy" }]} />
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-4 text-muted-foreground">Last updated: July 16, 2026</p>
        <div className="mt-10 space-y-6 text-muted-foreground leading-relaxed">
          <p>
            {siteConfig.fullName} (&ldquo;WaamTech,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) respects your privacy.
            This policy explains how we collect, use, and protect information when you visit our website or use our products.
          </p>
          <h2 className="text-xl font-semibold text-foreground">Information we collect</h2>
          <p>
            We may collect account information, contact details, usage data, device information, and communications you send to us.
          </p>
          <h2 className="text-xl font-semibold text-foreground">How we use information</h2>
          <p>
            We use information to provide and improve services, process subscriptions, support customers, secure our platform, and communicate product updates.
          </p>
          <h2 className="text-xl font-semibold text-foreground">Cookies</h2>
          <p>
            We use cookies and similar technologies for essential site functionality, preferences, and analytics. You can manage consent through our cookie banner.
          </p>
          <h2 className="text-xl font-semibold text-foreground">Contact</h2>
          <p>
            For privacy requests, use our{" "}
            <a href="/contact" className="text-primary hover:underline">
              secure contact form
            </a>
            .
          </p>
        </div>
      </Container>
    </Section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { siteConfig } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${siteConfig.companyName} collects, uses, and protects personal data for ${siteConfig.name} ERP.`,
};

export default function PrivacyPage() {
  return (
    <Section className="!py-12 md:!py-16">
      <Container className="max-w-3xl">
        <Breadcrumbs items={[{ label: "Privacy Policy" }]} />
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-4 text-muted-foreground">Last updated: July 18, 2026</p>
        <div className="mt-10 space-y-8 text-muted-foreground leading-relaxed">
          <p>
            {siteConfig.companyName} (&ldquo;WaamTech,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
            &ldquo;our&rdquo;) operates {siteConfig.fullName}, an Enterprise ERP platform, along with
            our marketing website ({siteConfig.url}), cloud application ({siteConfig.appUrl}),
            license and customer portal services ({siteConfig.licensePortalUrl}), and related support
            channels. This Privacy Policy explains how we collect, use, share, and protect personal
            information when you visit our sites, create an account, start a trial, subscribe, or
            contact us.
          </p>
          <p>
            Privacy is part of how WAAMTO is built: least-privilege access, clear tenant boundaries,
            and secure handling of business and account data. If you use WAAMTO to process your own
            customers&apos; or employees&apos; data, you are the controller of that Customer Data;
            WaamTech processes it to provide the Service as described in our{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
            .
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">1. Who we are</h2>
            <p>
              WaamTech has delivered software, ERP, and digital solutions since 2012. Product and
              support contacts:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>General: {siteConfig.email}</li>
              <li>Support: {siteConfig.supportEmail}</li>
              <li>Phone: {siteConfig.phone}</li>
              <li>Locations: {siteConfig.address}</li>
              <li>
                Company:{" "}
                <a
                  href={siteConfig.companyUrl}
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {siteConfig.companyUrl.replace(/^https?:\/\//, "")}
                </a>
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">2. Information we collect</h2>
            <h3 className="text-base font-semibold text-foreground">Account &amp; workspace information</h3>
            <p>
              When you sign up or manage a subscription we may collect name, business name, email,
              phone, password (stored securely), industry / business category selections, plan
              choices, billing details, license identifiers, and role assignments for invited users.
              Login and sensitive actions may use OTP verification codes sent to your email.
            </p>
            <h3 className="text-base font-semibold text-foreground">Customer Data in the ERP</h3>
            <p>
              Depending on the modules you enable, your workspace may store operational business
              records such as inventory, POS transactions, sales and purchasing documents, finance
              entries, CRM contacts, HR/payroll records, manufacturing data, warehouse movements,
              documents, projects, and related attachments. That Customer Data belongs to your
              organization; we process it to operate WAAMTO for you.
            </p>
            <h3 className="text-base font-semibold text-foreground">Usage, device &amp; technical data</h3>
            <p>
              We may collect IP address, browser and device type, pages viewed, referring URLs,
              approximate location derived from IP, session diagnostics, feature usage, and audit /
              activity logs needed for security, licensing validation, and product improvement.
            </p>
            <h3 className="text-base font-semibold text-foreground">Communications</h3>
            <p>
              When you contact sales or support (including contact forms, email, live chat, portal
              tickets, or WhatsApp where enabled), we collect the content of those communications
              and related metadata so we can respond and improve service quality.
            </p>
            <h3 className="text-base font-semibold text-foreground">Marketing preferences</h3>
            <p>
              At signup you may optionally opt in to product updates and marketing emails. You can
              unsubscribe at any time using links in those messages or by contacting us.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">3. How we use information</h2>
            <p>We use personal information to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>provide, host, maintain, and secure WAAMTO and related portals;</li>
              <li>create and administer workspaces, users, roles, trials, licenses, and subscriptions;</li>
              <li>process payments, invoices, renewals, upgrades, and plan changes;</li>
              <li>send transactional messages (OTP codes, password resets, trial notices, billing alerts);</li>
              <li>deliver support, onboarding, and customer success;</li>
              <li>operate AI Workspace features on your stack for eligible plans, with activity auditing;</li>
              <li>monitor reliability, prevent abuse, enforce Terms, and investigate security incidents;</li>
              <li>analyze aggregated usage to improve products and documentation; and</li>
              <li>send marketing communications only where you have opted in or where permitted by law.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">4. Legal bases (where applicable)</h2>
            <p>
              Where data-protection laws require a legal basis (for example GDPR-style regimes), we
              rely on: performance of a contract (providing the Service you request); legitimate
              interests (securing and improving the platform, preventing fraud); consent (optional
              marketing and non-essential cookies); and legal obligation (tax, accounting, or
              regulatory requirements).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">5. Cookies &amp; similar technologies</h2>
            <p>
              We use cookies and similar technologies for essential site functionality, remembering
              preferences (such as language or display currency), and analytics when you accept
              cookies through our cookie banner. Essential cookies are required for core operation.
              You can decline non-essential cookies via the banner and manage browser settings to
              block or delete cookies; some features may not work fully if cookies are disabled.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">6. How we share information</h2>
            <p>We do not sell your personal information. We may share information with:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-foreground font-medium">Service providers</strong> who help
                us host infrastructure, send email, process payments, provide analytics (with
                consent), or deliver support — under confidentiality and security obligations;
              </li>
              <li>
                <strong className="text-foreground font-medium">Deployment partners</strong> such as
                cloud providers or WaamHost when you choose own-cloud or hosted deployments;
              </li>
              <li>
                <strong className="text-foreground font-medium">Authorized users</strong> in your
                own workspace according to the roles your administrators assign;
              </li>
              <li>
                <strong className="text-foreground font-medium">Professional advisors</strong> and
                authorities when required by law, legal process, or to protect rights, safety, and
                security; and
              </li>
              <li>
                <strong className="text-foreground font-medium">Successors</strong> in connection
                with a merger, acquisition, or asset transfer, subject to appropriate confidentiality.
              </li>
            </ul>
            <p>
              Third-party integrations you enable (payment gateways, messaging, maps, e-commerce,
              accounting tools, APIs) receive data you choose to send them under their own privacy
              policies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">7. Security measures</h2>
            <p>
              We design WAAMTO with enterprise security practices described on our{" "}
              <Link href="/security" className="text-primary hover:underline">
                Security &amp; Trust
              </Link>{" "}
              page, including:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>HTTPS / TLS encryption for data in transit;</li>
              <li>multi-tenant business data isolation on Cloud SaaS;</li>
              <li>secure authentication, OTP verification for sensitive steps, and session controls;</li>
              <li>role-based access control (RBAC) within each workspace;</li>
              <li>automatic backups and ongoing platform security updates;</li>
              <li>activity logs and audit trails for accountability; and</li>
              <li>license and subscription validation to keep access aligned with entitlements.</li>
            </ul>
            <p>
              No method of transmission or storage is 100% secure. You are responsible for
              safeguarding account credentials and configuring user permissions appropriately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">8. Deployment options &amp; data location</h2>
            <p>
              Data handling depends on how you deploy WAAMTO:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-foreground font-medium">Cloud SaaS</strong> — Customer Data
                is hosted in WaamTech&apos;s managed cloud environment with automatic updates and
                backups.
              </li>
              <li>
                <strong className="text-foreground font-medium">Own cloud / WaamHost</strong> — data
                resides on the infrastructure you select; operational control follows that
                arrangement.
              </li>
              <li>
                <strong className="text-foreground font-medium">Local / on-premise</strong> — data
                remains on your local network or servers; WaamTech access is limited to what is needed
                for installation, licensing, and support you request.
              </li>
            </ul>
            <p>
              Because we serve customers internationally (including UAE, Pakistan, and other
              regions), information may be processed in countries where we or our providers operate.
              We take steps appropriate to the context to protect personal data during such
              transfers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">9. AI Workspace &amp; privacy</h2>
            <p>
              For eligible plans, AI Workspace features (Assistant, Document AI / OCR,
              recommendations, analytics assistance) are designed so inference stays on your stack —
              you are not required to provide external AI API keys. Prompts and related operational
              context may be processed to generate responses within your workspace. AI activity may
              be audited. Do not submit special-category or highly sensitive personal data to AI
              features unless necessary and lawful for your use case.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">10. Retention</h2>
            <p>
              We retain account, billing, and support records for as long as your relationship
              continues and thereafter as needed for legal, tax, dispute, and security purposes.
              Customer Data in active workspaces is retained while your subscription or deployment
              remains active. After termination or deletion requests, we delete or anonymize personal
              data within a reasonable period, subject to backup cycles and legal holds. On-premise
              and own-cloud customers control retention on systems they operate.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">11. Your rights &amp; choices</h2>
            <p>
              Depending on your location, you may have rights to access, correct, delete, or export
              personal information we hold about you; to object to or restrict certain processing;
              and to withdraw consent where processing is consent-based (such as marketing).
              Workspace admins can often update user profiles and permissions directly in the
              product or customer portal.
            </p>
            <p>
              To make a privacy request, use our{" "}
              <Link href="/contact" className="text-primary hover:underline">
                secure contact form
              </Link>{" "}
              or email {siteConfig.supportEmail} or {siteConfig.email}. We may verify your identity
              before fulfilling requests. If you are an end user of a customer&apos;s WAAMTO
              workspace, contact that organization first — they control Customer Data in their
              tenant.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">12. Children</h2>
            <p>
              WAAMTO is a business ERP platform and is not directed to children under 16. We do not
              knowingly collect personal information from children. If you believe a child has
              provided us information, contact us and we will take appropriate steps to delete it.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">13. Changes to this policy</h2>
            <p>
              We may update this Privacy Policy to reflect product, legal, or operational changes.
              The &ldquo;Last updated&rdquo; date at the top will be revised when we publish changes.
              Continued use of the website or Service after an update means you acknowledge the
              revised policy. For significant changes affecting paid customers, we may also provide
              additional notice by email or in-product messaging.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">14. Contact</h2>
            <p>
              Privacy questions and requests:{" "}
              <Link href="/contact" className="text-primary hover:underline">
                contact form
              </Link>
              , {siteConfig.email}, {siteConfig.supportEmail}, or {siteConfig.phone}. More about our
              security posture:{" "}
              <Link href="/security" className="text-primary hover:underline">
                Security &amp; Trust
              </Link>
              .
            </p>
          </section>
        </div>
      </Container>
    </Section>
  );
}

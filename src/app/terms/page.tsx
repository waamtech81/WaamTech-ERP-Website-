import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { siteConfig } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms governing use of ${siteConfig.name} — ${siteConfig.productLine} — and related WaamTech services.`,
};

export default function TermsPage() {
  return (
    <Section className="!py-12 md:!py-16">
      <Container className="max-w-3xl">
        <Breadcrumbs items={[{ label: "Terms of Service" }]} />
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-4 text-muted-foreground">Last updated: July 29, 2026</p>
        <div className="mt-10 space-y-8 text-muted-foreground leading-relaxed">
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the{" "}
            {siteConfig.fullName} website ({siteConfig.url}), customer portal ({siteConfig.url}/portal),
            Build Your Own ERP configurator, licensing services ({siteConfig.licensePortalUrl}),
            cloud ERP application ({siteConfig.appUrl}), mobile apps, and related products operated by{" "}
            {siteConfig.companyName} (&ldquo;WaamTech,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
            &ldquo;our&rdquo;). By creating an account, starting a trial, purchasing a subscription
            or license, configuring a custom ERP package, or otherwise using WAAMTO, you agree to these Terms.
          </p>
          <p>
            If you accept these Terms on behalf of a company or other legal entity, you represent
            that you have authority to bind that entity. In that case, &ldquo;you&rdquo; and
            &ldquo;Customer&rdquo; refer to that entity.
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">1. The WAAMTO service</h2>
            <p>
              WAAMTO is {siteConfig.productLine} by WaamTech. Depending on your plan and
              deployment option, the Service may include modules such as Inventory, POS, Sales,
              Purchasing, Finance, CRM, HR &amp; Payroll, Manufacturing, Warehouse &amp; Logistics,
              Documents, Service, Projects, industry packs, Mobile App access, and AI Workspace
              features (including AI Assistant, Document AI, recommendations, and analytics
              assistance).
            </p>
            <p>We offer several deployment models:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-foreground font-medium">Cloud SaaS</strong> — fully managed
                WaamTech cloud with automatic updates and backups.
              </li>
              <li>
                <strong className="text-foreground font-medium">Own cloud server</strong> — deployment
                on your dedicated cloud instance (for example AWS, Azure, DigitalOcean, or WaamHost).
              </li>
              <li>
                <strong className="text-foreground font-medium">Whitelabel / partner</strong> —
                resale under your brand under a separate partner arrangement.
              </li>
              <li>
                <strong className="text-foreground font-medium">Local / on-premise</strong> —
                installation on your local network where data must remain on-site.
              </li>
            </ul>
            <p>
              Feature availability, included user seats, modules, optional feature packs, limits,
              multi-company / multi-branch support, API access, support channels, and SLAs depend on
              your selected plan (Starter, Business, Lifetime, Enterprise, or a custom ERP package
              built through our configurator) and any written order or enterprise agreement shown at
              checkout or in the customer portal.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">2. Eligibility &amp; accounts</h2>
            <p>
              You must provide accurate registration information and keep it up to date. You are
              responsible for all activity under your workspace, including actions by users you
              invite. Protect credentials carefully. Where enabled, sensitive actions may require
              OTP verification in addition to password authentication.
            </p>
            <p>
              Workspace administrators are responsible for assigning role-based permissions (RBAC)
              so users only access modules and data appropriate to their role. You must promptly
              notify us of suspected unauthorized access via{" "}
              <Link href="/contact" className="text-primary hover:underline">
                our contact form
              </Link>{" "}
              or {siteConfig.supportEmail}.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">3. Free trials</h2>
            <p>
              Eligible Cloud SaaS plans may include a free trial period shown at signup or on the
              pricing page. A credit card is not required to start every trial. Trial length, included
              modules, and seat limits depend on the plan you select. When the trial ends, continued
              access requires an active paid subscription or license unless we agree otherwise in
              writing. Trial terms at the time of registration control what applies to your workspace.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">4. Subscriptions, licenses &amp; billing</h2>
            <p>
              Paid plans renew according to the billing cycle you select (monthly, yearly, or lifetime
              where offered) unless canceled or changed through the customer portal or as otherwise
              agreed. Plan upgrades may require immediate payment; approved downgrades generally take
              effect at the next billing cycle.
              Adding modules, feature packs, extra users, or other billable items may require immediate
              payment; removing items may apply as a credit on a future cycle as shown in the portal.
            </p>
            <p>
              Included seats vary by plan (for example Starter includes one user; Business and Lifetime
              include higher seat counts with optional extra users where enabled). Starter plans do not
              support extra-user purchases. Business and Lifetime extra-user pricing is shown at checkout
              and in the portal before you pay.
            </p>
            <p>
              Custom ERP packages configured through Build Your Own ERP are priced from your selected
              modules, optional feature packs, limits, and billing cycle. Checkout totals, taxes, and
              workspace activation follow the quote shown before payment.
            </p>
            <p>
              You may add additional businesses on the same customer account where the product allows.
              Each business may have its own subscription, license, and billing record.
            </p>
            <p>
              Lifetime licenses, Enterprise pricing, own-cloud, on-premise, and whitelabel arrangements
              may be subject to separate quotes, invoices, or contracts. License and subscription status
              are validated by our licensing services so product access stays aligned with your entitlements.
            </p>
            <p>
              You may cancel subscription renewal from the customer portal. Cancellation typically takes
              effect at the end of the current paid billing period unless stated otherwise at checkout.
              Fees already paid for the current period are non-refundable except where required by
              applicable law. Launch discounts and promotions are time-limited and may have additional
              conditions shown at purchase.
            </p>
            <p>
              Transactional emails — including OTP verification, welcome messages, trial reminders,
              billing alerts, and paid invoice PDFs — are sent to the email address registered on your
              account unless you update it in the portal or contact support.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">5. Customer data &amp; content</h2>
            <p>
              You retain ownership of business data you enter into WAAMTO (&ldquo;Customer
              Data&rdquo;), including inventory, sales, finance, CRM, HR, and related operational
              records. You grant WaamTech a limited license to host, process, transmit, and display
              Customer Data solely to provide, secure, support, and improve the Service.
            </p>
            <p>
              On multi-tenant Cloud SaaS, workspaces are isolated so one organization cannot access
              another&apos;s records. For own-cloud and on-premise deployments, data residency and
              operational control follow the deployment model and any written agreement.
            </p>
            <p>
              You are solely responsible for the legality, accuracy, and backup of Customer Data you
              control, for obtaining required consents from your employees and customers, and for
              configuring permissions within your workspace.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">6. AI Workspace</h2>
            <p>
              Where included in your plan, AI Workspace features help you query modules, process
              documents (including OCR), and receive operational recommendations. WAAMTO is designed
              so AI inference stays on your stack without requiring you to supply external AI API
              keys. AI outputs may be imperfect; you must review them before relying on them for
              business, financial, or compliance decisions. AI activity may be audited within the
              platform for security and accountability.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">7. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>misuse the platform, interfere with its operation, or attempt unauthorized access;</li>
              <li>probe, scan, or breach security or multi-tenant isolation controls;</li>
              <li>resell, sublicense, or white-label the Service except under an authorized partner agreement;</li>
              <li>use WAAMTO to violate applicable laws, regulations, or third-party rights;</li>
              <li>upload malware, unlawful content, or data you are not entitled to process;</li>
              <li>circumvent licensing, seat limits, or subscription validation; or</li>
              <li>reverse engineer the Service except to the extent permitted by law.</li>
            </ul>
            <p>
              We may suspend or terminate access for material breaches, unpaid fees, or security
              risk, and we may remove content that violates these Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">8. Third-party services &amp; integrations</h2>
            <p>
              The Service may integrate with third-party tools (for example payment gateways,
              messaging, maps, e-commerce, or accounting systems) and may offer API access on
              eligible plans. Third-party services are governed by their own terms and privacy
              policies. WaamTech is not responsible for third-party outages, policies, or data
              handling outside our control.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">9. Intellectual property</h2>
            <p>
              WAAMTO, WaamHost, the website, software, documentation, branding, and related
              materials are owned by WaamTech or its licensors. Except for the limited rights to use
              the Service under your subscription or license, no intellectual property rights are
              transferred to you. Feedback you provide may be used by WaamTech to improve products
              without obligation to you.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">10. Support &amp; availability</h2>
            <p>
              All plans include email support ({siteConfig.supportEmail}). Higher tiers may unlock
              priority response, WhatsApp support, dedicated success management, guided onboarding,
              training, and optional SLAs as described on Pricing or in an enterprise agreement.
              Cloud SaaS is designed for high availability with automatic updates and backups; we do
              not guarantee uninterrupted access and may perform maintenance as needed.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">11. Warranties &amp; disclaimers</h2>
            <p>
              The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis
              to the fullest extent permitted by law. WaamTech disclaims warranties of
              merchantability, fitness for a particular purpose, and non-infringement. We do not
              warrant that the Service will be error-free, that AI recommendations will be accurate,
              or that results will meet every business requirement.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">12. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, WaamTech and its affiliates will not be liable
              for indirect, incidental, special, consequential, or punitive damages, or for lost
              profits, revenue, goodwill, or data, arising from your use of the Service. Our
              aggregate liability under these Terms will not exceed the fees you paid to WaamTech for
              the Service in the twelve (12) months before the claim (or, for free trials, one
              hundred US dollars). Some jurisdictions do not allow certain limitations; in those
              cases our liability is limited to the fullest extent allowed.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">13. Indemnity</h2>
            <p>
              You will defend and indemnify WaamTech against claims arising from your Customer Data,
              your misuse of the Service, your violation of these Terms, or your infringement of
              third-party rights, except to the extent caused by our willful misconduct.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">14. Term &amp; termination</h2>
            <p>
              These Terms apply while you use the Service. You may stop using WAAMTO and cancel
              subscription renewal through the customer portal or by contacting us. Cancellation
              generally remains effective through the end of the current paid period; we do not
              provide refunds for unused time in that period unless required by law or stated in
              writing. We may terminate or suspend the Service for breach, non-payment, or legal
              risk. Upon termination, your right to access the Cloud SaaS Service ends. We may
              retain or delete Customer Data according to our Privacy Policy, backup cycles, and
              any written agreement for own-cloud or on-premise deployments.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">15. Changes</h2>
            <p>
              We may update these Terms from time to time. The &ldquo;Last updated&rdquo; date will
              change when we do. Continued use after changes become effective constitutes acceptance
              of the revised Terms. Material changes for paid customers may also be communicated by
              email or in-product notice where appropriate.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">16. Governing law</h2>
            <p>
              These Terms are governed by the laws applicable in the United Arab Emirates, without
              regard to conflict-of-law rules, unless a signed enterprise agreement specifies
              another governing law. Courts in Dubai, UAE, have exclusive jurisdiction over disputes,
              except that WaamTech may seek injunctive relief in any jurisdiction to protect its
              intellectual property or confidential information.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">17. Contact</h2>
            <p>
              Questions about these Terms:{" "}
              <Link href="/contact" className="text-primary hover:underline">
                contact form
              </Link>
              , {siteConfig.email}, {siteConfig.supportEmail}, or {siteConfig.phone}. Offices:{" "}
              {siteConfig.address}. Company site:{" "}
              <a
                href={siteConfig.companyUrl}
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {siteConfig.companyUrl.replace(/^https?:\/\//, "")}
              </a>
              .
            </p>
            <p>
              Related policy:{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </div>
      </Container>
    </Section>
  );
}

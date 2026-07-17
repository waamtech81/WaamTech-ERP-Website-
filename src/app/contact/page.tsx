import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPin, Clock, Phone, Mail } from "lucide-react";
import { siteConfig } from "@/lib/data/site";
import { hasPortalSession } from "@/lib/auth/session";
import {
  CONTACT_INTENTS,
  contactSubjectForIntent,
  parseContactIntent,
} from "@/lib/security/contact-intent";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AnimateIn } from "@/components/shared/animate-in";
import { ContactForm } from "@/components/sections/contact-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Official Google Maps embed — Dubai Free Zone (DAFZA) */
const DUBAI_FREEZONE_MAP_SRC =
  "https://www.google.com/maps?q=Dubai+Airport+Free+Zone+Authority+DAFZA&hl=en&z=14&output=embed";

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string | string[] }>;
}) {
  const showEmail = await hasPortalSession();
  const params = await searchParams;
  const rawIntent = Array.isArray(params.intent) ? params.intent[0] : params.intent;

  // Reject unknown / injected intent values — keep URL clean and safe
  if (rawIntent != null && String(rawIntent).trim() !== "") {
    const parsed = parseContactIntent(rawIntent);
    if (!parsed) {
      redirect("/contact");
    }
  }

  const intent = parseContactIntent(rawIntent);
  const initialSubject = contactSubjectForIntent(intent);

  return (
    <>
      <Section className="!pb-10 !pt-12 md:!pt-16">
        <Container>
          <Breadcrumbs items={[{ label: "Contact" }]} />
          <SectionHeader
            align="left"
            eyebrow="Contact"
            title="Let's talk about your operations"
            description="Tell us about your team, industry, and goals — we'll recommend the right plan and rollout path."
            className="mb-0 max-w-3xl"
          />
          {intent ? (
            <p className="mt-4 text-sm text-primary font-medium">
              Inquiry type: {CONTACT_INTENTS[intent].label}
            </p>
          ) : null}
        </Container>
      </Section>

      <Section muted className="!pt-10">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12">
            <AnimateIn className="lg:col-span-7">
              <Card>
                <CardHeader>
                  <CardTitle>Send a message</CardTitle>
                </CardHeader>
                <CardContent>
                  <ContactForm initialSubject={initialSubject} intent={intent} />
                </CardContent>
              </Card>
            </AnimateIn>

            <div className="lg:col-span-5 space-y-5">
              <AnimateIn delay={0.08}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Office</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <p className="flex gap-3">
                      <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {siteConfig.address}
                    </p>
                    <p className="flex gap-3">
                      <Phone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {siteConfig.phone}
                    </p>
                    {showEmail ? (
                      <p className="flex gap-3">
                        <Mail className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        {siteConfig.email}
                      </p>
                    ) : (
                      <p className="flex gap-3">
                        <Mail className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>
                          Prefer email after signing in.{" "}
                          <Link href="/login" className="text-primary hover:underline">
                            Log in
                          </Link>{" "}
                          or use the secure form.
                        </span>
                      </p>
                    )}
                    <p className="flex gap-3">
                      <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      Mon–Fri, 9:00 AM – 6:00 PM
                    </p>
                  </CardContent>
                </Card>
              </AnimateIn>

              <AnimateIn delay={0.12}>
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-lg">Map — Dubai Freezone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-hidden rounded-2xl border border-border bg-muted">
                      <iframe
                        title="Dubai Freezone map"
                        src={DUBAI_FREEZONE_MAP_SRC}
                        className="h-56 w-full border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        allowFullScreen
                      />
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Dubai Airport Free Zone (DAFZA), Dubai, UAE
                    </p>
                  </CardContent>
                </Card>
              </AnimateIn>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

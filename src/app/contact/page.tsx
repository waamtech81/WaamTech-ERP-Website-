"use client";

import { MapPin, Clock, Phone, Mail } from "lucide-react";
import { siteConfig } from "@/lib/data/site";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AnimateIn } from "@/components/shared/animate-in";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContactPage() {
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
                  <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full name</Label>
                        <Input id="name" placeholder="Alex Morgan" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Work email</Label>
                        <Input id="email" type="email" placeholder="alex@company.com" required />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input id="company" placeholder="Acme Operations" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" type="tel" placeholder="+1 555 0100" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input id="subject" placeholder="Demo request / Enterprise quote" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea id="message" placeholder="Tell us about your current systems and goals..." required />
                    </div>
                    <Button type="submit" size="lg">
                      Send message
                    </Button>
                  </form>
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
                    <p className="flex gap-3">
                      <Mail className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {siteConfig.email}
                    </p>
                    <p className="flex gap-3">
                      <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      Mon–Fri, 9:00 AM – 6:00 PM CST
                    </p>
                  </CardContent>
                </Card>
              </AnimateIn>

              <AnimateIn delay={0.12}>
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-lg">Map</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-border bg-muted text-sm text-muted-foreground">
                      Google Map placeholder
                    </div>
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

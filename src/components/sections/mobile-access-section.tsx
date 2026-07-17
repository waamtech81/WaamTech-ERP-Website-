"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Monitor, Smartphone, Tablet } from "lucide-react";
import { Container, Section } from "@/components/shared/section";
import { AnimateIn } from "@/components/shared/animate-in";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function MobileAccessSection() {
  return (
    <Section>
      <Container>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <AnimateIn>
            <Badge variant="accent" className="mb-4">
              <Smartphone className="h-3 w-3 mr-1" />
              Access anywhere
            </Badge>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#0b1f3a] text-balance">
              Responsive on every screen. Native app for the field.
            </h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
              WaamTech is a full responsive web app — use it on desktop, tablet, or phone anytime.
              For delivery, warehouse, service, and property teams, the native mobile app is included
              based on your business profile.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Same live data on web and mobile",
                "No install needed for responsive web access",
                "Native app when your profile needs field work",
                "Shown clearly when you pick a business type at signup",
              ].map((item) => (
                <li key={item} className="flex gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="rounded-full">
                <Link href="/mobile-app">
                  Explore mobile access
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/signup">Start free trial</Link>
              </Button>
            </div>
          </AnimateIn>

          <AnimateIn delay={0.1}>
            <div className="relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-border shadow-[0_20px_60px_rgba(15,23,42,0.1)]">
                <Image
                  src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fm=webp&fit=crop&w=1400&q=70"
                  alt="WaamTech mobile and tablet access"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { icon: Monitor, label: "Desktop" },
                  { icon: Tablet, label: "Tablet" },
                  { icon: Smartphone, label: "Phone" },
                ].map(({ icon: Icon, label }) => (
                  <Card key={label} className="border-border/80">
                    <CardContent className="flex flex-col items-center gap-1.5 py-4">
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="text-xs font-medium">{label}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </AnimateIn>
        </div>
      </Container>
    </Section>
  );
}

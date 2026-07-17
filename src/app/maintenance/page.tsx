import type { Metadata } from "next";
import Link from "next/link";
import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/section";
import { siteConfig } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Maintenance",
  description: `${siteConfig.name} is undergoing scheduled maintenance.`,
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <div className="relative flex min-h-[70vh] items-center">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <Container className="relative py-20 text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-700">
          <Wrench className="h-7 w-7" aria-hidden />
        </div>
        <p className="text-sm font-medium uppercase tracking-wide text-primary">Maintenance</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          We&apos;ll be right back
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          {siteConfig.name} is undergoing scheduled maintenance. Your data is safe — please check
          back shortly.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/">Refresh homepage</Link>
          </Button>
          <Button asChild variant="outline">
            <a href={`mailto:${siteConfig.supportEmail}`}>Contact support</a>
          </Button>
        </div>
      </Container>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/section";

export const metadata: Metadata = {
  title: "Account unavailable",
  robots: { index: false, follow: false },
};

export default function AccountUnavailablePage() {
  return (
    <div className="relative flex min-h-[70vh] items-center">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <Container className="relative py-20 text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600">
          <ShieldX className="h-7 w-7" aria-hidden />
        </div>
        <p className="text-sm font-medium uppercase tracking-wide text-primary">
          Account unavailable
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          This account cannot use the portal
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          Your user or license was deleted or disabled in the license system. Portal access is
          blocked. If you believe this is a mistake, contact support.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/support">Contact support</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </div>
      </Container>
    </div>
  );
}

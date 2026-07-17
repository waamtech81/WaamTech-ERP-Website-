import type { Metadata } from "next";
import Link from "next/link";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/section";

export const metadata: Metadata = {
  title: "Unauthorized",
  robots: { index: false, follow: false },
};

export default function UnauthorizedPage() {
  return (
    <div className="relative flex min-h-[70vh] items-center">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <Container className="relative py-20 text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600">
          <ShieldOff className="h-7 w-7" aria-hidden />
        </div>
        <p className="text-sm font-medium uppercase tracking-wide text-primary">401</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          Sign in required
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          Your session is missing or has expired. Sign in again to continue to the customer portal.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </Container>
    </div>
  );
}

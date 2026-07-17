import type { Metadata } from "next";
import Link from "next/link";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/section";

export const metadata: Metadata = {
  title: "Forbidden",
  robots: { index: false, follow: false },
};

export default function ForbiddenPage() {
  return (
    <div className="relative flex min-h-[70vh] items-center">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <Container className="relative py-20 text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600">
          <Ban className="h-7 w-7" aria-hidden />
        </div>
        <p className="text-sm font-medium uppercase tracking-wide text-primary">403</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          Access denied
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          You don&apos;t have permission to view this page. If you believe this is a mistake,
          contact support.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/">Back to home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/support">Get support</Link>
          </Button>
        </div>
      </Container>
    </div>
  );
}

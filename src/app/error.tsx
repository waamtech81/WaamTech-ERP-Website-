"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/section";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[site-error]", error?.digest || error?.message);
  }, [error]);

  return (
    <div className="relative flex min-h-[70vh] items-center">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <Container className="relative py-20 text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600">
          <AlertTriangle className="h-7 w-7" aria-hidden />
        </div>
        <p className="text-sm font-medium uppercase tracking-wide text-primary">500</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          Something went wrong
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          We hit an unexpected error loading this page. You can retry, or head back home.
        </p>
        {error?.digest ? (
          <p className="mt-2 text-xs text-muted-foreground/80">Reference: {error.digest}</p>
        ) : null}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" onClick={reset}>
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="h-4 w-4" />
              Back to home
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/support">
              <LifeBuoy className="h-4 w-4" />
              Get support
            </Link>
          </Button>
        </div>
      </Container>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/section";

/**
 * Self-contained colors so portal dark theme / muted tokens cannot wash out the copy.
 */
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
    <div
      className="relative flex min-h-[70vh] items-center"
      style={{ background: "#f8fafc", color: "#0f172a" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-hero-glow opacity-60" />
      <Container className="relative py-20 text-center">
        <div
          className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border"
          style={{
            borderColor: "#fecdd3",
            background: "#fff1f2",
            color: "#e11d48",
          }}
        >
          <AlertTriangle className="h-7 w-7" aria-hidden />
        </div>
        <p
          className="text-sm font-semibold uppercase tracking-wide"
          style={{ color: "#0549a4" }}
        >
          500
        </p>
        <h1
          className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl"
          style={{ color: "#0f172a" }}
        >
          Something went wrong
        </h1>
        <p
          className="mx-auto mt-4 max-w-md text-base leading-relaxed"
          style={{ color: "#334155" }}
        >
          We hit an unexpected error loading this page. You can retry, or head back home.
        </p>
        {error?.digest ? (
          <p className="mt-2 text-xs" style={{ color: "#64748b" }}>
            Reference: {error.digest}
          </p>
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

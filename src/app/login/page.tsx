"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Boxes, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/lib/data/site";
import { authConfig, getAppLoginUrl } from "@/lib/auth/config";

function LoginRedirect() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || searchParams.get("username") || "";
  const verified = searchParams.get("verified") === "1";
  const registered = searchParams.get("registered") === "1";

  const appLoginUrl = getAppLoginUrl({
    email: email || undefined,
    verified,
    registered,
  });

  useEffect(() => {
    // Auto-redirect to live ERP app — marketing site has no login system
    const timer = window.setTimeout(() => {
      window.location.assign(appLoginUrl);
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [appLoginUrl]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-muted">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="container-site relative flex justify-center py-12 sm:py-16 lg:py-20">
        <Card className="w-full max-w-md shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
          <CardHeader className="text-center space-y-2">
            <Link href="/" className="mx-auto mb-2 inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
                <Boxes className="h-4 w-4" />
              </span>
              <span className="font-[family-name:var(--font-poppins)] text-lg font-semibold">
                {siteConfig.name}
              </span>
            </Link>
            <CardTitle className="text-2xl">Open WAAMTO App</CardTitle>
            <CardDescription>
              Sign in happens on our live application — not on this marketing website.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {verified ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Email verified. Check your inbox for your <strong>license key</strong>, then open
                the app and paste it when prompted to start your trial.
              </div>
            ) : registered ? (
              <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                Account ready. Continue in the WAAMTO app to log in.
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm text-muted-foreground leading-relaxed">
                After your first login, the app will ask for the license key we emailed you. Copy it
                from your email and paste it in the app to activate your{" "}
                {authConfig.trialDays}-day trial.
              </div>
            )}

            <Button asChild size="lg" className="w-full rounded-full">
              <a href={appLoginUrl}>
                Continue to {authConfig.appUrl.replace(/^https?:\/\//, "")}
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Redirecting automatically in a moment…
            </p>

            <div className="border-t border-border pt-5 text-center text-sm text-muted-foreground">
              New here?{" "}
              <Link href="/signup" className="text-primary font-medium hover:underline inline-flex items-center gap-1">
                Start free trial
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
          Opening WAAMTO app...
        </div>
      }
    >
      <LoginRedirect />
    </Suspense>
  );
}

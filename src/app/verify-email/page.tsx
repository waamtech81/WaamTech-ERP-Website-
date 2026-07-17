"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Boxes, CheckCircle2, ExternalLink, KeyRound, Loader2, Mail, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/lib/data/site";
import { authConfig, getAppLoginUrl } from "@/lib/auth/config";

type Status = "loading" | "success" | "exists" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("Verifying your email…");

  const appLoginUrl = getAppLoginUrl({ verified: true });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!token) {
        setStatus("error");
        setMessage("This verification link is incomplete. Please open the link from your email.");
        return;
      }

      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const json = await res.json();
        if (cancelled) return;

        if (!json.success) {
          setStatus("error");
          setMessage(json.message || "Verification failed.");
          return;
        }

        setStatus(json.alreadyExists ? "exists" : "success");
        setMessage(
          json.message ||
            "Your email is verified. Your trial license has been sent — open WAAMTO ERP to activate it."
        );
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("Something went wrong while verifying. Please try again.");
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const ok = status === "success" || status === "exists";

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-muted">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="container-site relative flex justify-center py-16 lg:py-24">
        <Card className="w-full max-w-lg overflow-hidden shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div
            className={`h-1.5 w-full ${
              status === "loading"
                ? "bg-primary/40"
                : ok
                  ? "bg-gradient-to-r from-emerald-400 to-primary"
                  : "bg-rose-400"
            }`}
          />
          <CardContent className="px-6 py-10 sm:px-10 text-center">
            <Link href="/" className="mx-auto mb-6 inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
                <Boxes className="h-4 w-4" />
              </span>
              <span className="font-[family-name:var(--font-poppins)] text-lg font-semibold">
                {siteConfig.name}
              </span>
            </Link>

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-border">
              {status === "loading" ? (
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              ) : ok ? (
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              ) : (
                <XCircle className="h-8 w-8 text-rose-500" />
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0b1f3a]">
              {status === "loading"
                ? "Confirming your email"
                : ok
                  ? "Trial registered"
                  : "Verification needed"}
            </h1>
            <p className="mt-3 text-muted-foreground leading-relaxed">{message}</p>

            {ok ? (
              <div className="mt-6 space-y-3 text-left">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-4">
                  <div className="flex gap-3">
                    <Mail className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-emerald-900">License emailed</p>
                      <p className="mt-1 text-sm text-emerald-800/80 leading-relaxed">
                        Your {authConfig.trialDays}-day trial license key was sent to your email from
                        our license server. Keep that email — you will need the key in the app.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-white px-4 py-4">
                  <div className="flex gap-3">
                    <KeyRound className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-[#0b1f3a]">Next: open WAAMTO ERP</p>
                      <ol className="mt-2 space-y-1.5 text-sm text-muted-foreground list-decimal list-inside">
                        <li>Go to {authConfig.appUrl.replace(/^https?:\/\//, "")} and log in</li>
                        <li>When asked, paste your license key from email</li>
                        <li>After verification, your trial starts automatically</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              {ok ? (
                <Button asChild size="lg" className="rounded-full px-8">
                  <a href={appLoginUrl}>
                    Open WAAMTO ERP
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              ) : status === "error" ? (
                <>
                  <Button asChild size="lg" className="rounded-full px-8">
                    <Link href="/signup">Sign up again</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-full px-8">
                    <a href={getAppLoginUrl()}>Open app</a>
                  </Button>
                </>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
          Loading verification...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

const APP_LOGIN_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://app.waamto.com"
).replace(/\/$/, "") + "/login";

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") || "").trim();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");

  // Email link lands here with ?token= — show reset form (Signup-style UI).
  if (token) {
    if (token.length < 20) {
      return (
        <div className="relative min-h-[calc(100vh-4rem)] bg-muted">
          <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
          <div className="container-site relative flex justify-center py-20">
            <Card className="w-full max-w-md shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
              <CardHeader>
                <CardTitle>Invalid reset link</CardTitle>
                <CardDescription>
                  This reset link is incomplete. Request a new one below.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full rounded-full">
                  <Link href="/forgot-password">Request reset link</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }
    return <ResetPasswordForm token={token} />;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      setSent(true);
      setMessage(
        json.message ||
          "If an account exists for that email, a reset link has been sent."
      );
    } catch {
      setSent(true);
      setMessage("If an account exists for that email, a reset link has been sent.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-muted">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="container-site relative flex justify-center py-14 sm:py-20 lg:py-24">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Reset your password
            </h1>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              We&apos;ll email a secure, single-use link to set a new password.
            </p>
          </div>

          <Card className="shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Forgot password</CardTitle>
              <CardDescription>
                Works for Website, Customer Portal, and WAAMTO ERP — one identity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sent ? (
                <div className="space-y-5 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Mail className="h-6 w-6" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
                  <p className="text-xs text-muted-foreground">
                    Didn&apos;t get it? Check spam, or use our{" "}
                    <Link href="/contact" className="text-primary hover:underline">
                      contact form
                    </Link>
                    .
                  </p>
                  <Button asChild variant="outline" className="w-full rounded-full">
                    <a href={APP_LOGIN_URL}>Back to ERP login</a>
                  </Button>
                </div>
              ) : (
                <form className="space-y-5" onSubmit={onSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="email">Work email</Label>
                    <Input
                      id="email"
                      type="email"
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@company.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                  {error ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {error}
                    </div>
                  ) : null}
                  <Button type="submit" className="w-full rounded-full" size="lg" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send reset link"
                    )}
                  </Button>
                  <a
                    href={APP_LOGIN_URL}
                    className="inline-flex w-full items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to ERP login
                  </a>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
          Loading...
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}

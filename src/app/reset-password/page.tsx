"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const rules = [
  { id: "length", label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { id: "lower", label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { id: "upper", label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { id: "number", label: "One number", test: (v: string) => /\d/.test(v) },
];

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const checks = useMemo(
    () => rules.map((r) => ({ ...r, ok: r.test(password) })),
    [password]
  );
  const strongEnough = checks.every((c) => c.ok);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token || token.length < 20) {
      setError("This reset link is invalid or incomplete. Request a new one.");
      return;
    }
    if (!strongEnough) {
      setError("Please meet the password requirements.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
          confirm_password: confirm,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message || "Unable to reset password.");
        setLoading(false);
        return;
      }
      setSuccess(
        json.message ||
          "Password updated. You can now sign in on the Website, Portal, and ERP."
      );
      window.setTimeout(() => {
        router.replace(json.redirectUrl || "/login?reset=1");
      }, 1600);
    } catch {
      setError("Unable to reset password. Please try again.");
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="relative min-h-[calc(100vh-4rem)] bg-muted">
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <div className="container-site relative flex justify-center py-20">
          <Card className="w-full max-w-md shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
            <CardHeader>
              <CardTitle>Invalid reset link</CardTitle>
              <CardDescription>
                This page needs a secure token from your password reset email.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Request a new link, or use the{" "}
                <Link href="/contact" className="text-primary hover:underline">
                  contact form
                </Link>{" "}
                if you need help.
              </p>
              <Button asChild className="w-full rounded-full">
                <Link href="/forgot-password">Request reset link</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-muted">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="container-site relative flex justify-center py-14 sm:py-20 lg:py-24">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Choose a new password
            </h1>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Your License Engine identity password updates for Website, Portal, and ERP.
            </p>
          </div>

          <Card className="shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Reset password</CardTitle>
              <CardDescription>
                Link is single-use and time-limited. Tokens are never shown on this page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={onSubmit}>
                <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-muted/50 px-4 py-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Passwords are updated only by License Engine — never stored on this website.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      className="pr-11"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <ul className="space-y-1.5">
                  {checks.map((c) => (
                    <li
                      key={c.id}
                      className={`flex items-center gap-2 text-xs ${
                        c.ok ? "text-emerald-700" : "text-muted-foreground"
                      }`}
                    >
                      <Check className={`h-3.5 w-3.5 ${c.ok ? "opacity-100" : "opacity-30"}`} />
                      {c.label}
                    </li>
                  ))}
                </ul>

                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input
                    id="confirm"
                    type={showPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>

                {error ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                ) : null}
                {success ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {success}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  className="w-full rounded-full"
                  size="lg"
                  disabled={loading || !!success}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update password"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
          Loading...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

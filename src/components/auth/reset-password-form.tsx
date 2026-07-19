"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiMessageFromJson, friendlyNetworkError } from "@/lib/network/errors";

const passwordRules = [
  { id: "length", label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { id: "lower", label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { id: "upper", label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { id: "number", label: "One number", test: (v: string) => /\d/.test(v) },
  {
    id: "special",
    label: "One special character (!@#$…)",
    test: (v: string) => /[^A-Za-z0-9]/.test(v),
  },
];

const APP_LOGIN_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://app.waamto.com"
).replace(/\/$/, "") + "/login";

/**
 * Shared Reset Password form — used at /forgot-password?token=… (canonical)
 * and /reset-password?token=… (legacy alias).
 * UI aligned with Signup password fields.
 */
export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const checks = useMemo(
    () => passwordRules.map((r) => ({ ...r, ok: r.test(password) })),
    [password]
  );
  const strongEnough = checks.every((c) => c.ok);
  const passwordsMatch = confirm.length > 0 && password === confirm;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token || token.length < 20) {
      setError("This reset link is invalid or incomplete. Request a new one.");
      return;
    }
    if (!strongEnough) {
      setError("Please meet all password requirements.");
      return;
    }
    if (password !== confirm) {
      setError("Password and confirm password do not match.");
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
        setError(apiMessageFromJson(json, "Unable to reset password."));
        setLoading(false);
        return;
      }
      setSuccess(apiMessageFromJson(json, "Password updated successfully."));
      const redirectTo = json.redirectUrl || APP_LOGIN_URL;
      window.setTimeout(() => {
        if (String(redirectTo).startsWith("http")) {
          window.location.href = redirectTo;
        } else {
          router.replace(redirectTo);
        }
      }, 1600);
    } catch (err) {
      setError(friendlyNetworkError(err, "Unable to reset password. Please try again."));
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
              Choose a new password
            </h1>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              One identity password for Website, Customer Portal, and WAAMTO ERP Cloud.
            </p>
          </div>

          <Card className="shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Reset password</CardTitle>
              <CardDescription>
                Enter a strong new password, then confirm it. This link is single-use.
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
                      placeholder="Create a strong password"
                      className={`pr-11 ${
                        password.length > 0
                          ? strongEnough
                            ? "border-emerald-400 focus-visible:ring-emerald-400/40"
                            : "border-rose-300 focus-visible:ring-rose-300/40"
                          : ""
                      }`}
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
                  <div className="relative">
                    <Input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password"
                      placeholder="Re-enter password"
                      className={`pr-11 ${
                        confirm.length > 0
                          ? passwordsMatch
                            ? "border-emerald-400 focus-visible:ring-emerald-400/40"
                            : "border-rose-300 focus-visible:ring-rose-300/40"
                          : ""
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                      aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-black">
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

                <p className="text-center text-xs text-muted-foreground">
                  After update you&apos;ll be taken to{" "}
                  <Link href={APP_LOGIN_URL} className="text-primary hover:underline">
                    WAAMTO ERP login
                  </Link>
                  .
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

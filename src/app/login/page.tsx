"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Boxes, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/lib/data/site";
import { authConfig, buildHandoffUrl } from "@/lib/auth/config";

function LoginForm() {
  const searchParams = useSearchParams();
  const prefill = searchParams.get("username") || searchParams.get("email") || "";
  const registered = searchParams.get("registered") === "1";

  const [username, setUsername] = useState(prefill);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(
    registered ? "Account created. Please log in to open your WaamTech app." : ""
  );
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.message || "Login failed.");
        setLoading(false);
        return;
      }

      if (json.requiresSecurity) {
        // 2FA — send user to the app login which supports full security challenge UI
        setInfo("Extra security is enabled on your account. Continue in the WaamTech app.");
        window.location.assign(
          `${authConfig.appUrl.replace(/\/+$/, "")}/login?username=${encodeURIComponent(username)}`
        );
        return;
      }

      const accessToken = json.data?.accessToken as string | undefined;
      const refreshToken = json.data?.refreshToken as string | undefined;

      if (accessToken && refreshToken) {
        if (remember) {
          try {
            localStorage.setItem("waamtech_last_user", username);
          } catch {
            /* ignore */
          }
        }
        const url = buildHandoffUrl({
          accessToken,
          refreshToken,
          user: json.data?.user || { username },
        });
        window.location.assign(url);
        return;
      }

      setError("Login succeeded but no session tokens were returned. Please try the app login.");
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  function onForgot(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotMsg("Enter your email first.");
      return;
    }
    // Password reset lives in the SaaS app — deep-link there
    setForgotMsg("Opening WaamTech app password recovery...");
    window.location.assign(
      `${authConfig.appUrl.replace(/\/+$/, "")}/login?forgot=1&email=${encodeURIComponent(forgotEmail)}`
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-muted">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="container-site relative flex justify-center py-16 lg:py-24">
        <Card className="w-full max-w-md shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
          <CardHeader className="text-center">
            <Link href="/" className="mx-auto mb-4 inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
                <Boxes className="h-4 w-4" />
              </span>
              <span className="font-[family-name:var(--font-poppins)] text-lg font-semibold">
                {siteConfig.name}
              </span>
            </Link>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Log in and continue into your WaamTech workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="username">Email or username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="alex@company.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#forgot" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(v) => setRemember(v === true)}
                />
                <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
                  Remember me
                </Label>
              </div>

              {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}
              {info ? (
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                  {info}
                </div>
              ) : null}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Log in to WaamTech"
                )}
              </Button>
            </form>

            <div id="forgot" className="mt-8 rounded-2xl border border-border bg-muted p-4">
              <p className="text-sm font-medium">Forgot password</p>
              <p className="mt-1 text-xs text-muted-foreground mb-3">
                We&apos;ll open password recovery in the WaamTech app.
              </p>
              <form className="flex gap-2" onSubmit={onForgot}>
                <Input
                  type="email"
                  placeholder="Work email"
                  className="bg-white"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
                <Button type="submit" variant="outline">
                  Continue
                </Button>
              </form>
              {forgotMsg ? <p className="mt-2 text-xs text-muted-foreground">{forgotMsg}</p> : null}
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              New to WaamTech?{" "}
              <Link href="/signup" className="text-primary font-medium hover:underline">
                Start {authConfig.trialDays}-day free trial
              </Link>
            </p>
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
          Loading login...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

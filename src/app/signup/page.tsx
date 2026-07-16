"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Boxes, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/lib/data/site";
import { industriesServing } from "@/lib/data/industries";
import { authConfig, buildHandoffUrl } from "@/lib/auth/config";
import { Suspense } from "react";

const plans = [
  { id: "starter", name: "Starter" },
  { id: "professional", name: "Professional" },
  { id: "business", name: "Business" },
];

function SignUpForm() {
  const searchParams = useSearchParams();
  const defaultProfile = searchParams.get("profile") || "retail_store";
  const defaultPlan = searchParams.get("plan") || "professional";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileId, setProfileId] = useState(defaultProfile);
  const [plan, setPlan] = useState(defaultPlan);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedProfile = useMemo(
    () => industriesServing.find((i) => i.id === profileId),
    [profileId]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!agree) {
      setError("Please accept the Terms and Privacy Policy.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          phone: phone || undefined,
          company_name: companyName,
          profile_id: profileId,
          plan,
        }),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.message || "Signup failed.");
        setLoading(false);
        return;
      }

      const accessToken = json.data?.accessToken as string | undefined;
      const refreshToken = json.data?.refreshToken as string | undefined;

      setSuccess(
        json.message ||
          `Workspace created. Your ${authConfig.trialDays}-day free trial has started.`
      );

      if (accessToken && refreshToken) {
        // Hand off session into SaaS Core app, then land on dashboard
        const url = buildHandoffUrl({
          accessToken,
          refreshToken,
          user: json.data?.user || { email, name },
        });
        window.location.assign(url);
        return;
      }

      // Fallback: go to app login if tokens were not returned
      window.location.assign(
        `${authConfig.appUrl.replace(/\/+$/, "")}/login?registered=1&username=${encodeURIComponent(email)}`
      );
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-muted">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="container-site relative grid gap-10 py-12 lg:grid-cols-2 lg:items-start lg:py-20">
        <div className="max-w-lg lg:sticky lg:top-28">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
              <Boxes className="h-4 w-4" />
            </span>
            <span className="font-[family-name:var(--font-poppins)] text-lg font-semibold">
              {siteConfig.name}
            </span>
          </Link>
          <Badge variant="accent" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            {authConfig.trialDays}-day free trial
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-balance">
            Create your workspace in minutes
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Pick your business type, create your company, and open the WaamTech app — no credit card
            required for your free trial.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
            {[
              `${authConfig.trialDays}-day free trial on signup`,
              "Business profile from SaaS Core auto-provisions modules",
              "After signup you enter the WaamTech app automatically",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          {selectedProfile ? (
            <div className="mt-8 rounded-2xl border border-border bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Selected industry
              </p>
              <p className="mt-1 font-semibold text-[#0b1f3a]">{selectedProfile.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{selectedProfile.short}</p>
            </div>
          ) : null}
        </div>

        <Card className="mx-auto w-full max-w-lg shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
          <CardHeader>
            <CardTitle className="text-2xl">Sign up</CardTitle>
            <CardDescription>
              Start free · then continue into the WaamTech app
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Morgan"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company / workspace name</Label>
                <Input
                  id="company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Operations"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 0000000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile">Business type</Label>
                <select
                  id="profile"
                  value={profileId}
                  onChange={(e) => setProfileId(e.target.value)}
                  className="flex h-12 w-full rounded-xl border border-border bg-white px-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  {industriesServing.map((ind) => (
                    <option key={ind.id} value={ind.id}>
                      {ind.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan">Preferred plan</Label>
                <select
                  id="plan"
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="flex h-12 w-full rounded-xl border border-border bg-white px-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {authConfig.trialDays}-day trial
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  You start on trial. You can change plan anytime inside the app.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  className="mt-1"
                  checked={agree}
                  onCheckedChange={(v) => setAgree(v === true)}
                />
                <Label htmlFor="terms" className="text-sm font-normal text-muted-foreground leading-relaxed">
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </Label>
              </div>

              {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}
              {success ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {success}
                </div>
              ) : null}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating workspace...
                  </>
                ) : (
                  `Start ${authConfig.trialDays}-day free trial`
                )}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Log in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
          Loading signup...
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}

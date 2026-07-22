"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  KeyRound,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEVICE_KEY = "wt_workforce_device_fingerprint";

function deviceFingerprint(): string {
  try {
    const existing = localStorage.getItem(DEVICE_KEY);
    if (existing) return existing;
    const created =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Array.from(crypto.getRandomValues(new Uint8Array(24)), (byte) =>
            byte.toString(16).padStart(2, "0")
          ).join("");
    localStorage.setItem(DEVICE_KEY, created);
    return created;
  } catch {
    return "";
  }
}

async function responseJson(response: Response): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function messageFrom(
  value: Record<string, unknown>,
  fallback: string
): string {
  return typeof value.message === "string" && value.message.trim()
    ? value.message
    : fallback;
}

export function WorkforceAuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" />
      <div className="pointer-events-none absolute inset-0 bg-soft-grid opacity-50" />
      <div className="container-site relative flex min-h-[calc(100vh-4rem)] items-center justify-center py-14 sm:py-20">
        <div className="w-full max-w-md">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-blue-950/15">
              <Building2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              WAAMTO Workforce
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              {title}
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
          <Card className="border-slate-200/90 shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
            {children}
          </Card>
          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
            Protected by PKCE, MFA, and revocation-aware session validation.
          </p>
        </div>
      </div>
    </main>
  );
}

export function WorkforceLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/workforce/session", {
      cache: "no-store",
      credentials: "include",
    })
      .then((response) => {
        if (response.ok) window.location.replace("/control-center");
      })
      .catch(() => {
        // Stay on the sign-in page when silent validation is unavailable.
      });
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/workforce/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          device_fingerprint: deviceFingerprint(),
        }),
      });
      const result = await responseJson(response);
      const redirectUrl =
        typeof result.redirectUrl === "string" ? result.redirectUrl : "";
      if (!response.ok || !redirectUrl) {
        setError(messageFrom(result, "Unable to sign in. Please try again."));
        return;
      }
      setPassword("");
      window.location.assign(redirectUrl);
    } catch {
      setError("Workforce sign-in is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <CardHeader>
        <CardTitle>Enterprise sign in</CardTitle>
        <CardDescription>
          Use the Workforce identity assigned by your organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="workforce-email">Work email</Label>
            <Input
              id="workforce-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              autoComplete="username"
              maxLength={254}
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workforce-password">Password</Label>
            <Input
              id="workforce-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              maxLength={1024}
              required
            />
          </div>
          {error ? (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900"
            >
              {error}
            </div>
          ) : null}
          <Button
            type="submit"
            size="lg"
            className="w-full rounded-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                Securing session...
              </>
            ) : (
              <>
                Continue securely
                <ArrowRight aria-hidden="true" />
              </>
            )}
          </Button>
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Your password is sent only to the Workforce identity service and is
              never stored in Website cookies or browser storage.
            </p>
          </div>
        </form>
      </CardContent>
    </>
  );
}

export function WorkforceMfaForm() {
  const [code, setCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/workforce/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        credentials: "include",
        body: JSON.stringify({
          code: code || undefined,
          recovery_code: recoveryCode || undefined,
          trust_device: trustDevice,
          device_fingerprint: deviceFingerprint(),
        }),
      });
      const result = await responseJson(response);
      const redirectUrl =
        typeof result.redirectUrl === "string" ? result.redirectUrl : "";
      if (!response.ok) {
        if (result.code === "challenge_expired") {
          window.location.replace("/workforce/session-expired");
          return;
        }
        setError(messageFrom(result, "Verification failed. Try again."));
        return;
      }
      if (result.status === "mfa_required") {
        setCode("");
        setRecoveryCode("");
        setError("An additional verification step is required.");
        return;
      }
      if (!redirectUrl) {
        setError("The identity service returned an incomplete response.");
        return;
      }
      window.location.assign(redirectUrl);
    } catch {
      setError("Verification is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <CardHeader>
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <CardTitle>Verify your identity</CardTitle>
        <CardDescription>
          Enter the code from your approved verification method.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="workforce-code">Verification code</Label>
            <Input
              id="workforce-code"
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\s/g, "").slice(0, 32))
              }
              placeholder="Enter code"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="text-center text-lg font-semibold tracking-[0.3em]"
              disabled={Boolean(recoveryCode)}
              autoFocus
            />
          </div>
          <div className="relative flex items-center">
            <span className="h-px flex-1 bg-border" />
            <span className="px-3 text-xs text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workforce-recovery">Recovery code</Label>
            <Input
              id="workforce-recovery"
              value={recoveryCode}
              onChange={(event) =>
                setRecoveryCode(event.target.value.trim().slice(0, 128))
              }
              placeholder="Use a recovery code"
              autoComplete="off"
              disabled={Boolean(code)}
            />
          </div>
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="workforce-trust"
              checked={trustDevice}
              onCheckedChange={(value) => setTrustDevice(value === true)}
              className="mt-0.5"
            />
            <Label
              htmlFor="workforce-trust"
              className="font-normal leading-relaxed text-muted-foreground"
            >
              Trust this device when permitted by organization policy
            </Label>
          </div>
          {error ? (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900"
            >
              {error}
            </div>
          ) : null}
          <Button
            type="submit"
            size="lg"
            className="w-full rounded-full"
            disabled={loading || (!code && !recoveryCode)}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                Verifying...
              </>
            ) : (
              <>
                <KeyRound aria-hidden="true" />
                Verify and continue
              </>
            )}
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/workforce/login">
              <ArrowLeft aria-hidden="true" />
              Back to sign in
            </Link>
          </Button>
        </form>
      </CardContent>
    </>
  );
}

export function WorkforceStatusCard({
  icon,
  title,
  description,
  actionLabel = "Return to sign in",
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
}) {
  return (
    <WorkforceAuthShell title={title} description={description}>
      <CardContent className="p-6">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-primary">
          {icon}
        </div>
        <Button asChild size="lg" className="w-full rounded-full">
          <Link href="/workforce/login">
            {actionLabel}
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </WorkforceAuthShell>
  );
}

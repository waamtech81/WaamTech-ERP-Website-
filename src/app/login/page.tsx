"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authConfig, getAppLoginUrl } from "@/lib/auth/config";
import { safeInternalPath } from "@/lib/security/safe-redirect";
import { friendlyNetworkError } from "@/lib/network/errors";

type LoginStep = "credentials" | "otp" | "totp";
type AccountKind = "customer" | "platform";

function postPlatformSso(payload: {
  redirectUrl: string;
  accessToken: string;
  refreshToken: string;
  user: unknown;
}) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = payload.redirectUrl;
  form.style.display = "none";

  const fields: Record<string, string> = {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    user: JSON.stringify(payload.user ?? {}),
  };
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefill = searchParams.get("username") || searchParams.get("email") || "";
  const registered = searchParams.get("registered") === "1";
  const verified = searchParams.get("verified") === "1";
  const nextPath = safeInternalPath(
    searchParams.get("next") ||
      searchParams.get("redirect") ||
      searchParams.get("returnUrl") ||
      searchParams.get("callback")
  );

  const [step, setStep] = useState<LoginStep>("credentials");
  const [accountKind, setAccountKind] = useState<AccountKind>("customer");
  const [username, setUsername] = useState(prefill);
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [totp, setTotp] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(
    verified
      ? "Email verified. Sign in to continue."
      : registered
        ? "Account created. Sign in to continue."
        : searchParams.get("reset") === "1"
          ? "Password updated. Sign in with your new password."
          : ""
  );

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("waamtech_last_user");
      if (saved && !prefill) setUsername(saved);
    } catch {
      /* ignore */
    }
  }, [prefill]);

  useEffect(() => {
    fetch("/api/portal/dashboard", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success) router.replace(safeInternalPath(nextPath));
      })
      .catch(() => {
        /* stay on login */
      });
  }, [router, nextPath]);

  function finishLogin(json: {
    data?: {
      accountKind?: string;
      redirectUrl?: string;
      accessToken?: string;
      refreshToken?: string;
      user?: unknown;
    };
  }) {
    if (remember) {
      try {
        localStorage.setItem("waamtech_last_user", username);
      } catch {
        /* ignore */
      }
    }

    const kind = json.data?.accountKind;
    if (
      kind === "platform" &&
      json.data?.accessToken &&
      json.data?.refreshToken &&
      json.data?.redirectUrl
    ) {
      postPlatformSso({
        redirectUrl: json.data.redirectUrl,
        accessToken: json.data.accessToken,
        refreshToken: json.data.refreshToken,
        user: json.data.user,
      });
      return;
    }

    router.replace(safeInternalPath(json.data?.redirectUrl || nextPath));
  }

  async function submitCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    const requestUrl = "/api/auth/login";

    try {
      const res = await fetch(requestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, remember }),
        cache: "no-store",
      });
      const json = await res.json();

      const challengeTokenValue = String(json.data?.challenge_token || "").trim();
      const requiresEmailVerification = json.requires_email_verification === true;
      const requiresOtpFlag = json.requiresOtp === true;
      const accountType =
        json.accountKind === "platform" ||
        json.data?.accountKind === "platform" ||
        json.data?.account_kind === "platform"
          ? "platform"
          : "customer";

      // Temporary production diagnostics — remove after OTP migration is verified.
      console.info("[auth-login-debug]", {
        requestUrl,
        success: json.success,
        requires_email_verification: json.requires_email_verification,
        requiresOtp: json.requiresOtp,
        challenge_token: Boolean(challengeTokenValue),
        account_type: accountType,
        has_access_token: Boolean(json.data?.accessToken),
        redirectUrl: json.data?.redirectUrl || null,
        status: res.status,
      });

      if (!json.success) {
        console.info("[auth-login-debug]", {
          redirect_decision: "error",
          message: json.message,
        });
        setError(json.message || "Login failed.");
        setLoading(false);
        return;
      }

      if (json.data?.accountKind === "platform" && json.data?.accessToken) {
        console.info("[auth-login-debug]", { redirect_decision: "platform_sso" });
        finishLogin(json);
        return;
      }

      if (json.requires2fa || json.requires_2fa) {
        console.info("[auth-login-debug]", { redirect_decision: "totp" });
        setAccountKind("platform");
        setChallengeToken(challengeTokenValue);
        setStep("totp");
        setInfo(json.message || "Enter your authenticator app code.");
        setLoading(false);
        return;
      }

      // OTP only when backend explicitly requires verification AND issues a challenge.
      if (
        challengeTokenValue &&
        (requiresEmailVerification || requiresOtpFlag)
      ) {
        console.info("[auth-login-debug]", { redirect_decision: "otp" });
        setAccountKind(accountType);
        setChallengeToken(challengeTokenValue);
        setStep("otp");
        setCooldown(60);
        setInfo(
          json.message ||
            "Enter the verification code sent to your registered email."
        );
        setLoading(false);
        return;
      }

      // Verified customer / password-only success — session cookies already set by API.
      if (json.success) {
        console.info("[auth-login-debug]", {
          redirect_decision: "portal",
          next: json.data?.redirectUrl || nextPath,
        });
        finishLogin(json);
        return;
      }

      setError(json.message || "Login failed. Please try again.");
      setLoading(false);
    } catch (err) {
      setError(friendlyNetworkError(err, "Something went wrong. Please try again."));
      setLoading(false);
    }
  }

  async function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          challenge_token: challengeToken,
          email_code: otp,
          otp,
          remember,
          account_kind: accountKind,
        }),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.message || "Invalid verification code.");
        setLoading(false);
        return;
      }

      if (json.requires2fa || json.requires_2fa) {
        setAccountKind("platform");
        setChallengeToken(json.data?.challenge_token || challengeToken);
        setStep("totp");
        setInfo(json.message || "Enter your authenticator app code.");
        setLoading(false);
        return;
      }

      finishLogin(json);
    } catch (err) {
      setError(friendlyNetworkError(err, "Something went wrong. Please try again."));
      setLoading(false);
    }
  }

  async function submitTotp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          challenge_token: challengeToken,
          totp_code: totp,
          remember,
          account_kind: "platform",
        }),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.message || "Invalid authenticator code.");
        setLoading(false);
        return;
      }

      finishLogin(json);
    } catch (err) {
      setError(friendlyNetworkError(err, "Something went wrong. Please try again."));
      setLoading(false);
    }
  }

  async function resendOtp() {
    if (!challengeToken || cooldown > 0 || resending) return;
    setResending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/resend-login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge_token: challengeToken,
          account_kind: accountKind,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message || "Could not resend code.");
      } else {
        setInfo("A new verification code was sent.");
        setCooldown(60);
        setOtp("");
      }
    } catch (err) {
      setError(friendlyNetworkError(err, "Could not resend code."));
    } finally {
      setResending(false);
    }
  }

  function resetToCredentials() {
    setStep("credentials");
    setAccountKind("customer");
    setOtp("");
    setTotp("");
    setChallengeToken("");
    setError("");
    setInfo("");
  }

  const appLoginUrl = getAppLoginUrl({
    email: username.trim() || prefill || undefined,
    verified,
    registered,
  });

  const heading =
    step === "otp"
      ? "Verify your login"
      : step === "totp"
        ? "Two-factor authentication"
        : "Welcome back";
  const subheading =
    step === "otp"
      ? `Enter the code sent to ${username || "your email"}`
      : step === "totp"
        ? "Enter the 6-digit code from your authenticator app."
        : "Choose WAAMTO ERP app login or Customer Portal login. Platform Super Admins sign in with the same email here.";

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-muted">
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="container-site relative flex min-h-[calc(100vh-4rem)] items-center justify-center py-14 sm:py-20 lg:py-24">
        <div className="w-full max-w-5xl">
          <div className="mb-8 text-center sm:mb-10">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {heading}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground leading-relaxed">
              {subheading}
            </p>
          </div>

          <div className="mx-auto grid w-full max-w-5xl items-stretch gap-6 md:grid-cols-2 md:gap-8">
            {/* Left — WAAMTO ERP app login */}
            <Card className="flex h-full flex-col shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
              <CardHeader className="pb-4 text-center sm:text-left">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white mx-auto sm:mx-0">
                  <Boxes className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">WAAMTO ERP Login</CardTitle>
                <CardDescription>
                  Open the live ERP application to sign in and run your business workspace.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-5">
                <div className="rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm text-muted-foreground leading-relaxed">
                  Use this if you already activated your license and work inside the WAAMTO ERP
                  app at{" "}
                  <span className="font-medium text-foreground">
                    {authConfig.appUrl.replace(/^https?:\/\//, "")}
                  </span>
                  .
                </div>
                <Button asChild size="lg" className="w-full rounded-full">
                  <a
                    href={appLoginUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Continue to ERP Login
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  New here?{" "}
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    Start free trial
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </p>
              </CardContent>
            </Card>

            {/* Right — Customer Portal login (License Engine) */}
            <Card className="flex h-full flex-col shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">
                  {step === "otp"
                    ? "Login verification"
                    : step === "totp"
                      ? "Authenticator code"
                      : "Customer Portal Login"}
                </CardTitle>
                <CardDescription>
                  {step === "otp"
                    ? accountKind === "platform"
                      ? "Platform Super Admin email verification."
                      : "No OTP — no portal access."
                    : step === "totp"
                      ? "Required for Super Admin accounts with 2FA enabled."
                      : "Customers use License Engine identity. Platform Super Admins use the same staff email/password as License Engine Admin."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                {step === "credentials" ? (
                  <form className="flex flex-1 flex-col space-y-5" onSubmit={submitCredentials}>
                    <div className="space-y-2">
                      <Label htmlFor="username">Email or username</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="alex@company.com"
                        autoComplete="username"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="password">Password</Label>
                        <Link
                          href={`/forgot-password${username.trim() ? `?email=${encodeURIComponent(username.trim())}` : ""}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className="pr-11"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
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

                    <div className="mt-auto space-y-5 pt-1">
                      <Button type="submit" className="w-full rounded-full" size="lg" disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          "Continue"
                        )}
                      </Button>
                      <p className="text-center text-sm text-muted-foreground">
                        New here?{" "}
                        <Link href="/signup" className="text-primary font-medium hover:underline">
                          Start {authConfig.trialDays}-day free trial
                        </Link>
                      </p>
                    </div>
                  </form>
                ) : step === "totp" ? (
                  <form className="flex flex-1 flex-col space-y-5" onSubmit={submitTotp}>
                    <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-muted/50 px-4 py-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Enter the 6-digit code from your authenticator app.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totp">Authenticator code</Label>
                      <Input
                        id="totp"
                        value={totp}
                        onChange={(e) =>
                          setTotp(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        placeholder="123456"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        className="tracking-[0.35em] text-center text-lg font-semibold"
                        required
                      />
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

                    <div className="mt-auto space-y-5 pt-1">
                      <Button
                        type="submit"
                        className="w-full rounded-full"
                        size="lg"
                        disabled={loading || totp.length < 6}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          "Verify & open Admin Portal"
                        )}
                      </Button>
                      <button
                        type="button"
                        onClick={resetToCredentials}
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back
                      </button>
                    </div>
                  </form>
                ) : (
                  <form className="flex flex-1 flex-col space-y-5" onSubmit={submitOtp}>
                    <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-muted/50 px-4 py-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Enter the 6-digit Login OTP emailed to your account.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="otp">Verification code</Label>
                      <Input
                        id="otp"
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))
                        }
                        placeholder="123456"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        className="tracking-[0.35em] text-center text-lg font-semibold"
                        required
                      />
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

                    <div className="mt-auto space-y-5 pt-1">
                      <Button
                        type="submit"
                        className="w-full rounded-full"
                        size="lg"
                        disabled={loading || otp.length < 4}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : accountKind === "platform" ? (
                          "Verify & open Admin Portal"
                        ) : (
                          "Verify & continue"
                        )}
                      </Button>

                      <div className="flex items-center justify-between gap-3 text-sm">
                        <button
                          type="button"
                          onClick={resetToCredentials}
                          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={resendOtp}
                          disabled={resending || cooldown > 0}
                          className="font-medium text-primary hover:underline disabled:opacity-50 disabled:no-underline"
                        >
                          {resending
                            ? "Sending..."
                            : cooldown > 0
                              ? `Resend in ${cooldown}s`
                              : "Resend code"}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
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

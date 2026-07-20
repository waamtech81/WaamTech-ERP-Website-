"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { apiMessageFromJson, friendlyNetworkError } from "@/lib/network/errors";
import { wouldTriggerLoopbackPermission } from "@/lib/network/address-space";
import {
  executeRecaptcha,
  hasRecaptchaV3SiteKey,
  RecaptchaV3,
} from "@/components/security/recaptcha-v3";

type LoginStep = "credentials" | "otp" | "totp";
type AccountKind = "customer" | "platform";
type SecondFactor = "email_otp" | "totp" | "email_verification";

const TRUSTED_DEVICE_KEY = "waamtech_trusted_device";

function readTrustedDeviceToken(): string {
  try {
    return localStorage.getItem(TRUSTED_DEVICE_KEY) || "";
  } catch {
    return "";
  }
}

function saveTrustedDeviceToken(token: string) {
  try {
    if (token) localStorage.setItem(TRUSTED_DEVICE_KEY, token);
  } catch {
    /* ignore */
  }
}

/**
 * Platform Super Admin handoff — posts tokens to License Engine /sso.
 * Must never target localhost from a non-loopback page origin (Chrome
 * "Apps on device" / loopback-network permission).
 */
function postPlatformSso(payload: {
  redirectUrl: string;
  accessToken: string;
  refreshToken: string;
  user: unknown;
}): { ok: true } | { ok: false; message: string } {
  const pageOrigin = window.location.origin;
  if (wouldTriggerLoopbackPermission(pageOrigin, payload.redirectUrl)) {
    return {
      ok: false,
      message:
        "Blocked browser→localhost SSO handoff. Open this site via http://localhost for local Super Admin SSO.",
    };
  }

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
  return { ok: true };
}

function LoginForm() {
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
  const [secondFactor, setSecondFactor] = useState<SecondFactor>("email_verification");
  const [username, setUsername] = useState(prefill);
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [totp, setTotp] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);
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
    fetch("/api/portal/dashboard", { cache: "no-store", credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success) {
          // Full navigation so portal layout + topbar mount cleanly.
          window.location.replace(safeInternalPath(nextPath));
        }
      })
      .catch(() => {
        /* stay on login */
      });
  }, [nextPath]);

  function finishLogin(json: {
    data?: {
      accountKind?: string;
      redirectUrl?: string;
      accessToken?: string;
      refreshToken?: string;
      user?: unknown;
      device_token?: string;
    };
  }) {
    if (remember) {
      try {
        localStorage.setItem("waamtech_last_user", username);
      } catch {
        /* ignore */
      }
    }

    if (typeof json.data?.device_token === "string" && json.data.device_token) {
      saveTrustedDeviceToken(json.data.device_token);
    }

    const kind = json.data?.accountKind;
    if (
      kind === "platform" &&
      json.data?.accessToken &&
      json.data?.refreshToken &&
      json.data?.redirectUrl
    ) {
      const sso = postPlatformSso({
        redirectUrl: json.data.redirectUrl,
        accessToken: json.data.accessToken,
        refreshToken: json.data.refreshToken,
        user: json.data.user,
      });
      if (!sso.ok) {
        setError(sso.message);
        setLoading(false);
        return;
      }
      return;
    }

    // Full document navigation so SiteShell + PortalShell remount with cookies.
    window.location.assign(safeInternalPath(json.data?.redirectUrl || nextPath));
  }

  function openSecondFactor(json: {
    message?: string;
    requires_email_verification?: boolean;
    requires_email_otp?: boolean;
    requiresOtp?: boolean;
    requires2fa?: boolean;
    requires_2fa?: boolean;
    data?: {
      challenge_token?: string;
      account_kind?: string;
      active_second_factor?: string;
    };
  }) {
    const challengeTokenValue = String(json.data?.challenge_token || "").trim();
    const accountType =
      json.data?.account_kind === "platform" || accountKind === "platform"
        ? "platform"
        : "customer";
    const active = String(json.data?.active_second_factor || "");
    const useTotp =
      active === "totp" ||
      ((json.requires2fa || json.requires_2fa) &&
        !json.requiresOtp &&
        !json.requires_email_otp &&
        active !== "email_otp");

    setAccountKind(accountType);
    setChallengeToken(challengeTokenValue);

    if (useTotp) {
      setSecondFactor("totp");
      setStep("totp");
      setInfo(json.message || "Enter the code from your authenticator app.");
    } else {
      setSecondFactor(
        json.requires_email_verification
          ? "email_verification"
          : "email_otp"
      );
      setStep("otp");
      setCooldown(60);
      setInfo(
        json.message ||
          "Enter the verification code sent to your registered email."
      );
    }
  }

  async function submitCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      let captchaToken: string | null = null;
      if (hasRecaptchaV3SiteKey()) {
        captchaToken = await executeRecaptcha("portal_login");
        if (!captchaToken) {
          setError("Captcha failed to load. Please refresh and try again.");
          setLoading(false);
          return;
        }
      }

      const deviceToken = readTrustedDeviceToken();
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          remember,
          ...(captchaToken ? { captcha_token: captchaToken } : {}),
          ...(deviceToken ? { device_token: deviceToken } : {}),
        }),
        cache: "no-store",
        credentials: "include",
      });
      const json = await res.json();

      const challengeTokenValue = String(json.data?.challenge_token || "").trim();
      const requiresEmailVerification = json.requires_email_verification === true;
      const requiresOtpFlag = json.requiresOtp === true || json.requires_email_otp === true;
      const requires2fa = json.requires2fa === true || json.requires_2fa === true;

      if (!json.success) {
        setError(apiMessageFromJson(json, "Login failed."));
        setLoading(false);
        return;
      }

      // Platform Super Admin step-up — complete on License Engine Admin Portal.
      if (json.requiresStepUp === true && json.data?.redirectUrl) {
        window.location.assign(String(json.data.redirectUrl));
        return;
      }

      // Second factor always wins — never create a portal session until completed.
      if (challengeTokenValue && (requires2fa || requiresEmailVerification || requiresOtpFlag)) {
        openSecondFactor(json);
        setLoading(false);
        return;
      }

      if (json.data?.accountKind === "platform" && json.data?.accessToken) {
        finishLogin(json);
        return;
      }

      // Verified customer — session cookies already set by API.
      if (json.success) {
        finishLogin(json);
        return;
      }

      setError(apiMessageFromJson(json, "Login failed. Please try again."));
      setLoading(false);
    } catch (err) {
      setError(friendlyNetworkError(err, "Something went wrong. Please try again."));
      setLoading(false);
    }
  }

  async function withLoginCaptcha(
    action: string
  ): Promise<{ ok: true; token: string | null } | { ok: false }> {
    if (!hasRecaptchaV3SiteKey()) return { ok: true, token: null };
    const token = await executeRecaptcha(action);
    if (!token) {
      setError("Captcha failed to load. Please refresh and try again.");
      return { ok: false };
    }
    return { ok: true, token };
  }

  async function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const captcha = await withLoginCaptcha("portal_login_otp");
      if (!captcha.ok) {
        setLoading(false);
        return;
      }

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
          trust_device: trustDevice,
          account_kind: accountKind,
          ...(captcha.token ? { captcha_token: captcha.token } : {}),
        }),
        credentials: "include",
        cache: "no-store",
      });
      const json = await res.json();

      if (!json.success) {
        setError(apiMessageFromJson(json, "Invalid verification code."));
        setLoading(false);
        return;
      }

      if (json.requires2fa || json.requires_2fa) {
        openSecondFactor(json);
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
      const captcha = await withLoginCaptcha("portal_login_otp");
      if (!captcha.ok) {
        setLoading(false);
        return;
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          challenge_token: challengeToken,
          totp_code: totp || undefined,
          recovery_code: recoveryCode.trim() || undefined,
          remember,
          trust_device: accountKind === "customer" ? trustDevice : false,
          account_kind: accountKind,
          ...(captcha.token ? { captcha_token: captcha.token } : {}),
        }),
        credentials: "include",
        cache: "no-store",
      });
      const json = await res.json();

      if (!json.success) {
        setError(apiMessageFromJson(json, "Invalid authenticator code."));
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
      const captcha = await withLoginCaptcha("portal_login_resend_otp");
      if (!captcha.ok) return;

      const res = await fetch("/api/auth/resend-login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge_token: challengeToken,
          account_kind: accountKind,
          ...(captcha.token ? { captcha_token: captcha.token } : {}),
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(apiMessageFromJson(json, "Could not resend code."));
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
    setSecondFactor("email_verification");
    setOtp("");
    setTotp("");
    setRecoveryCode("");
    setChallengeToken("");
    setTrustDevice(false);
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
      <RecaptchaV3 />
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
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="remember"
                        checked={remember}
                        onCheckedChange={(v) => setRemember(v === true)}
                        className="mt-0.5"
                      />
                      <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
                        Keep me signed in on this device
                        <span className="mt-0.5 block text-xs text-muted-foreground/80">
                          Off by default — closing the browser ends your portal session.
                        </span>
                      </Label>
                    </div>

                    {error ? (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-black">
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
                        Enter the 6-digit code from your authenticator app
                        {accountKind === "customer"
                          ? ", or a one-time recovery code."
                          : "."}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totp">Authenticator code</Label>
                      <Input
                        id="totp"
                        value={totp}
                        onChange={(e) => {
                          setTotp(e.target.value.replace(/\D/g, "").slice(0, 6));
                          if (e.target.value) setRecoveryCode("");
                        }}
                        placeholder="123456"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        className="tracking-[0.35em] text-center text-lg font-semibold"
                      />
                    </div>
                    {accountKind === "customer" ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="recovery">Recovery code (optional)</Label>
                          <Input
                            id="recovery"
                            value={recoveryCode}
                            onChange={(e) => {
                              setRecoveryCode(e.target.value.toUpperCase());
                              if (e.target.value) setTotp("");
                            }}
                            placeholder="XXXX-XXXX"
                            autoComplete="off"
                            className="tracking-wider text-center font-semibold"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="trust-device-totp"
                            checked={trustDevice}
                            onCheckedChange={(v) => setTrustDevice(v === true)}
                          />
                          <Label
                            htmlFor="trust-device-totp"
                            className="text-sm font-normal text-muted-foreground"
                          >
                            Remember this device for 30 days
                          </Label>
                        </div>
                      </>
                    ) : null}

                    {error ? (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-black">
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
                        disabled={loading || (totp.length < 6 && recoveryCode.trim().length < 8)}
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

                    {accountKind === "customer" && secondFactor === "email_otp" ? (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="trust-device-otp"
                          checked={trustDevice}
                          onCheckedChange={(v) => setTrustDevice(v === true)}
                        />
                        <Label
                          htmlFor="trust-device-otp"
                          className="text-sm font-normal text-muted-foreground"
                        >
                          Remember this device for 30 days
                        </Label>
                      </div>
                    ) : null}

                    {error ? (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-black">
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

"use client";

import { useEffect, useState, useTransition } from "react";
import {
  KeyRound,
  Loader2,
  Mail,
  MonitorSmartphone,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatPortalDate, formatPortalDateTime } from "@/components/portal/use-portal-data";
import { apiMessageFromJson, friendlyNetworkError } from "@/lib/network/errors";
import { cn } from "@/lib/utils";
import type {
  IdentityMfaStatus,
  IdentitySecurityEvent,
  IdentitySession,
  IdentityTrustedDevice,
} from "@/lib/license/identity";

type Props = {
  sessions: IdentitySession[];
  onSessionsChanged?: () => Promise<void> | void;
};

export function PortalSecurityPanel({ sessions, onSessionsChanged }: Props) {
  const [status, setStatus] = useState<IdentityMfaStatus | null>(null);
  const [devices, setDevices] = useState<IdentityTrustedDevice[]>([]);
  const [events, setEvents] = useState<IdentitySecurityEvent[]>([]);
  const [loadError, setLoadError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [setupSecret, setSetupSecret] = useState("");
  const [setupUrl, setSetupUrl] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [showAuthenticatorSetup, setShowAuthenticatorSetup] = useState(false);

  const twoFactorOn = Boolean(
    status?.email_otp_enabled || status?.totp_enabled || status?.active_second_factor !== "none"
  );

  const refresh = async () => {
    setLoadError("");
    const [statusRes, devicesRes, eventsRes] = await Promise.all([
      fetch("/api/portal/security?view=status", { credentials: "include", cache: "no-store" }),
      fetch("/api/portal/security?view=trusted-devices", {
        credentials: "include",
        cache: "no-store",
      }),
      fetch("/api/portal/security?view=events&limit=15", {
        credentials: "include",
        cache: "no-store",
      }),
    ]);
    const statusJson = await statusRes.json();
    const devicesJson = await devicesRes.json();
    const eventsJson = await eventsRes.json();

    if (statusJson.success) setStatus(statusJson.data as IdentityMfaStatus);
    else setLoadError(apiMessageFromJson(statusJson, "Security status unavailable."));

    if (devicesJson.success) {
      setDevices(Array.isArray(devicesJson.data) ? devicesJson.data : []);
    }
    if (eventsJson.success) {
      const raw = eventsJson.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.items)
          ? raw.items
          : Array.isArray(raw?.events)
            ? raw.events
            : [];
      setEvents(list as IdentitySecurityEvent[]);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const postAction = async (payload: Record<string, unknown>) => {
    const res = await fetch("/api/portal/security", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      cache: "no-store",
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(apiMessageFromJson(json, "Security update failed."));
    }
    return json;
  };

  const run = (fn: () => Promise<void>) => {
    setError("");
    setFeedback("");
    startTransition(async () => {
      try {
        await fn();
        await refresh();
        await onSessionsChanged?.();
      } catch (err) {
        setError(friendlyNetworkError(err, "Security update failed."));
      }
    });
  };

  const qrSrc = setupUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(setupUrl)}`
    : "";

  const requirePassword = () => {
    if (!password.trim()) {
      setError("Enter your password to confirm this security change.");
      return false;
    }
    return true;
  };

  return (
    <div className="space-y-6">
      {(feedback || error || loadError) && (
        <div
          role="status"
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            error || loadError
              ? "border-rose-500/25 bg-rose-500/10 text-rose-900 dark:text-rose-200"
              : "border-emerald-500/25 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
          )}
        >
          {error || loadError || feedback}
        </div>
      )}

      {recoveryCodes?.length ? (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
          <h3 className="text-sm font-semibold text-[var(--portal-fg)]">
            Save your recovery codes
          </h3>
          <p className="mt-1 text-xs text-[var(--portal-muted)]">
            Shown once. Store them securely — each code works only one time.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {recoveryCodes.map((code) => (
              <li
                key={code}
                className="rounded-lg border border-[var(--portal-border)] bg-[var(--portal-panel)] px-3 py-2 font-mono text-sm tracking-wider"
              >
                {code}
              </li>
            ))}
          </ul>
          <Button
            type="button"
            variant="outline"
            className="mt-4 rounded-xl"
            onClick={() => setRecoveryCodes(null)}
          >
            I saved these codes
          </Button>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-panel)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--portal-accent)]" />
            <div>
              <h3 className="text-sm font-semibold text-[var(--portal-fg)]">
                Two-factor authentication
              </h3>
              <p className="mt-1 text-xs text-[var(--portal-muted)]">
                Turn on a second factor for portal login. Email OTP and authenticator work the same
                way as License Engine security.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-[var(--portal-muted)]">
              {twoFactorOn ? "On" : "Off"}
            </span>
            <Switch
              checked={twoFactorOn}
              disabled={pending}
              onCheckedChange={(checked) => {
                if (checked) {
                  setFeedback(
                    "Choose Email OTP or Authenticator below, confirm with your password, then complete setup."
                  );
                  return;
                }
                if (!requirePassword()) return;
                run(async () => {
                  if (status?.email_otp_enabled) {
                    await postAction({
                      action: "email-otp-disable",
                      password,
                      totp_code: totpCode || undefined,
                    });
                  }
                  if (status?.totp_enabled) {
                    await postAction({
                      action: "totp-disable",
                      password,
                      totp_code: totpCode || undefined,
                    });
                  }
                  setShowAuthenticatorSetup(false);
                  setSetupSecret("");
                  setSetupUrl("");
                  setPassword("");
                  setTotpCode("");
                  setFeedback("Two-factor authentication turned off.");
                });
              }}
              aria-label="Toggle two-factor authentication"
            />
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <Label htmlFor="sec-password">Confirm password</Label>
          <Input
            id="sec-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 max-w-md bg-[var(--portal-soft)]"
            autoComplete="current-password"
            placeholder="Required to enable or disable 2FA"
          />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {/* Email OTP */}
          <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-[var(--portal-accent)]" />
                <div>
                  <p className="text-sm font-semibold text-[var(--portal-fg)]">Email OTP</p>
                  <p className="mt-1 text-xs text-[var(--portal-muted)]">
                    Login sends a one-time code to {sessions.length ? "your registered email" : "your email"}.
                  </p>
                </div>
              </div>
              <Switch
                checked={Boolean(status?.email_otp_enabled)}
                disabled={pending}
                onCheckedChange={(checked) => {
                  if (!requirePassword()) return;
                  run(async () => {
                    if (checked) {
                      await postAction({ action: "email-otp-enable", password });
                      await postAction({
                        action: "active-method",
                        active_second_factor: "email_otp",
                      });
                      setFeedback("Email OTP enabled and set as your login second factor.");
                    } else {
                      await postAction({
                        action: "email-otp-disable",
                        password,
                        totp_code: totpCode || undefined,
                      });
                      setFeedback("Email OTP disabled.");
                    }
                    setPassword("");
                    setTotpCode("");
                  });
                }}
                aria-label="Toggle email OTP"
              />
            </div>
            {status?.email_otp_enabled ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={status.active_second_factor === "email_otp" ? "default" : "outline"}
                  className="rounded-lg"
                  disabled={pending || status.active_second_factor === "email_otp"}
                  onClick={() =>
                    run(async () => {
                      await postAction({
                        action: "active-method",
                        active_second_factor: "email_otp",
                      });
                      setFeedback("Email OTP is now required at login.");
                    })
                  }
                >
                  Use at login
                </Button>
                {status.active_second_factor === "email_otp" ? (
                  <span className="self-center text-xs text-emerald-700">Active at login</span>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Authenticator */}
          <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Smartphone className="mt-0.5 h-4 w-4 text-[var(--portal-accent)]" />
                <div>
                  <p className="text-sm font-semibold text-[var(--portal-fg)]">Authenticator app</p>
                  <p className="mt-1 text-xs text-[var(--portal-muted)]">
                    Scan a QR code, enter the 6-digit PIN, then save recovery keys.
                  </p>
                </div>
              </div>
              <Switch
                checked={Boolean(status?.totp_enabled) || showAuthenticatorSetup}
                disabled={pending}
                onCheckedChange={(checked) => {
                  if (checked) {
                    if (status?.totp_enabled) return;
                    run(async () => {
                      const json = await postAction({ action: "totp-setup" });
                      setSetupSecret(String(json.data?.secret || ""));
                      setSetupUrl(String(json.data?.otpauth_url || ""));
                      setShowAuthenticatorSetup(true);
                      setFeedback("Scan the QR code, then enter the code from your app.");
                    });
                    return;
                  }
                  if (!status?.totp_enabled) {
                    setShowAuthenticatorSetup(false);
                    setSetupSecret("");
                    setSetupUrl("");
                    return;
                  }
                  if (!requirePassword()) return;
                  run(async () => {
                    await postAction({
                      action: "totp-disable",
                      password,
                      totp_code: totpCode || undefined,
                    });
                    setShowAuthenticatorSetup(false);
                    setSetupSecret("");
                    setSetupUrl("");
                    setPassword("");
                    setTotpCode("");
                    setFeedback("Authenticator disabled.");
                  });
                }}
                aria-label="Toggle authenticator app"
              />
            </div>

            {(showAuthenticatorSetup || setupSecret || setupUrl) && !status?.totp_enabled ? (
              <div className="mt-4 space-y-3 rounded-lg border border-[var(--portal-border)] bg-[var(--portal-panel)] p-3">
                <p className="text-xs text-[var(--portal-muted)]">
                  1. Scan with Google Authenticator, Microsoft Authenticator, or Authy.
                </p>
                {qrSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrSrc}
                    alt="Authenticator QR code"
                    className="h-[160px] w-[160px] rounded-lg bg-white p-2"
                  />
                ) : null}
                {setupSecret ? (
                  <p className="break-all font-mono text-[11px] text-[var(--portal-fg)]">
                    Manual key: {setupSecret}
                  </p>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="sec-totp-setup">2. Enter 6-digit code</Label>
                  <Input
                    id="sec-totp-setup"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    className="h-11 bg-[var(--portal-soft)] tracking-[0.2em]"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-lg"
                    disabled={pending || totpCode.length < 6}
                    onClick={() =>
                      run(async () => {
                        const json = await postAction({
                          action: "totp-enable",
                          code: totpCode,
                        });
                        await postAction({
                          action: "active-method",
                          active_second_factor: "totp",
                        });
                        const codes = Array.isArray(json.data?.recovery_codes)
                          ? (json.data.recovery_codes as string[])
                          : null;
                        setRecoveryCodes(codes);
                        setSetupSecret("");
                        setSetupUrl("");
                        setShowAuthenticatorSetup(false);
                        setTotpCode("");
                        setFeedback(
                          "Authenticator enabled and set as your login second factor. Save your recovery codes."
                        );
                      })
                    }
                  >
                    {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Verify & enable
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    onClick={() => {
                      setShowAuthenticatorSetup(false);
                      setSetupSecret("");
                      setSetupUrl("");
                      setTotpCode("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}

            {status?.totp_enabled ? (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={status.active_second_factor === "totp" ? "default" : "outline"}
                    className="rounded-lg"
                    disabled={pending || status.active_second_factor === "totp"}
                    onClick={() =>
                      run(async () => {
                        await postAction({
                          action: "active-method",
                          active_second_factor: "totp",
                        });
                        setFeedback("Authenticator is now required at login.");
                      })
                    }
                  >
                    Use at login
                  </Button>
                  {status.active_second_factor === "totp" ? (
                    <span className="self-center text-xs text-emerald-700">Active at login</span>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sec-totp-manage">Authenticator code (for recovery / disable)</Label>
                  <Input
                    id="sec-totp-manage"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    className="h-11 bg-[var(--portal-panel)] tracking-[0.2em]"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    disabled={pending || !password || totpCode.length < 6}
                    onClick={() =>
                      run(async () => {
                        const json = await postAction({
                          action: "recovery-codes",
                          password,
                          totp_code: totpCode,
                        });
                        const codes = Array.isArray(json.data?.recovery_codes)
                          ? (json.data.recovery_codes as string[])
                          : null;
                        setRecoveryCodes(codes);
                        setPassword("");
                        setTotpCode("");
                        setFeedback("New recovery codes generated.");
                      })
                    }
                  >
                    <KeyRound className="h-4 w-4" />
                    Regenerate recovery codes
                  </Button>
                  {typeof status.recovery_codes_remaining === "number" ? (
                    <p className="self-center text-xs text-[var(--portal-muted)]">
                      {status.recovery_codes_remaining} recovery codes remaining
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-3 py-2">
            <dt className="text-xs text-[var(--portal-muted)]">Email OTP</dt>
            <dd className="mt-1 font-medium">
              {status?.email_otp_enabled ? "Enabled" : "Off"}
            </dd>
          </div>
          <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-3 py-2">
            <dt className="text-xs text-[var(--portal-muted)]">Authenticator</dt>
            <dd className="mt-1 font-medium">{status?.totp_enabled ? "Enabled" : "Off"}</dd>
          </div>
          <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-3 py-2">
            <dt className="text-xs text-[var(--portal-muted)]">Active at login</dt>
            <dd className="mt-1 font-medium">
              {status?.active_second_factor === "email_otp"
                ? "Email OTP"
                : status?.active_second_factor === "totp"
                  ? "Authenticator"
                  : "None"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-panel)] p-5">
        <div className="flex items-start gap-3">
          <MonitorSmartphone className="mt-0.5 h-5 w-5 shrink-0 text-[var(--portal-accent)]" />
          <div>
            <h3 className="text-sm font-semibold text-[var(--portal-fg)]">Trusted devices</h3>
            <p className="mt-1 text-xs text-[var(--portal-muted)]">
              Devices remembered for 30 days skip the second factor.
            </p>
          </div>
        </div>
        {devices.length ? (
          <ul className="mt-4 space-y-2">
            {devices.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-[var(--portal-fg)]">
                    {d.label || "Trusted device"}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--portal-muted)]">
                    {[d.ip_address, d.country, d.user_agent].filter(Boolean).join(" · ") ||
                      "No device details"}
                    {d.expires_at ? ` · Expires ${formatPortalDate(d.expires_at)}` : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  disabled={pending}
                  onClick={() =>
                    run(async () => {
                      await postAction({ action: "revoke-device", device_id: d.id });
                      setFeedback("Trusted device revoked.");
                    })
                  }
                >
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-[var(--portal-muted)]">No trusted devices.</p>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-[var(--portal-fg)]">Active sessions</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg"
            disabled={pending}
            onClick={() =>
              run(async () => {
                const res = await fetch("/api/auth/logout", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ allDevices: true }),
                });
                const json = await res.json();
                if (!json.success) {
                  throw new Error(apiMessageFromJson(json, "Unable to sign out other devices."));
                }
                window.location.assign("/login");
              })
            }
          >
            Logout all devices
          </Button>
        </div>
        {sessions.length ? (
          <ul className="space-y-2">
            {sessions.map((s, i) => (
              <li
                key={s.id || String(i)}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-[var(--portal-fg)]">
                    {[s.browser, s.os].filter(Boolean).join(" · ") ||
                      formatPortalDateTime(s.created_at) ||
                      `Session ${i + 1}`}
                    {s.is_current ? " · Current" : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--portal-muted)]">
                    {[s.ip_address, s.country].filter(Boolean).join(" · ")}
                    {s.last_activity_at
                      ? ` · Last active ${formatPortalDateTime(s.last_activity_at)}`
                      : s.expires_at
                        ? ` · Expires ${formatPortalDate(s.expires_at)}`
                        : ""}
                  </p>
                </div>
                {s.id && !s.is_current ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    disabled={pending}
                    onClick={() =>
                      run(async () => {
                        await postAction({ action: "revoke-session", session_id: s.id });
                        setFeedback("Session revoked.");
                      })
                    }
                  >
                    Logout
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--portal-muted)]">No active sessions listed.</p>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--portal-fg)]">Security activity</h3>
        {events.length ? (
          <ul className="space-y-2">
            {events.map((ev) => (
              <li
                key={ev.id}
                className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3 text-sm"
              >
                <p className="font-medium text-[var(--portal-fg)]">
                  {ev.event_type.replace(/_/g, " ")}
                </p>
                <p className="mt-0.5 text-xs text-[var(--portal-muted)]">
                  {[formatPortalDateTime(ev.created_at), ev.ip_address]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--portal-muted)]">No recent security events.</p>
        )}
      </section>
    </div>
  );
}

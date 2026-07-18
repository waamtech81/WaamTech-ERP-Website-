"use client";

import { useEffect, useState, useTransition } from "react";
import {
  KeyRound,
  Loader2,
  MonitorSmartphone,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--portal-accent)]" />
          <div>
            <h3 className="text-sm font-semibold text-[var(--portal-fg)]">Two-factor authentication</h3>
            <p className="mt-1 text-xs text-[var(--portal-muted)]">
              Choose one active second factor. Login will require that method only.
            </p>
          </div>
        </div>

        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
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
            <dt className="text-xs text-[var(--portal-muted)]">Active method</dt>
            <dd className="mt-1 font-medium">
              {status?.active_second_factor === "email_otp"
                ? "Email OTP"
                : status?.active_second_factor === "totp"
                  ? "Authenticator"
                  : "None"}
            </dd>
          </div>
        </dl>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sec-password">Confirm password</Label>
            <Input
              id="sec-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 bg-[var(--portal-soft)]"
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sec-totp">Authenticator / OTP code</Label>
            <Input
              id="sec-totp"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
              className="h-11 bg-[var(--portal-soft)] tracking-[0.2em]"
              inputMode="numeric"
              autoComplete="one-time-code"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={pending || !password}
            onClick={() =>
              run(async () => {
                await postAction({ action: "email-otp-enable", password });
                setFeedback("Email OTP enabled. Set it as your active method to use at login.");
                setPassword("");
              })
            }
          >
            Enable Email OTP
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={pending || !password || !status?.email_otp_enabled}
            onClick={() =>
              run(async () => {
                await postAction({
                  action: "email-otp-disable",
                  password,
                  totp_code: totpCode || undefined,
                });
                setFeedback("Email OTP disabled.");
                setPassword("");
                setTotpCode("");
              })
            }
          >
            Disable Email OTP
          </Button>
          <Button
            type="button"
            className="rounded-xl"
            disabled={pending || status?.totp_enabled}
            onClick={() =>
              run(async () => {
                const json = await postAction({ action: "totp-setup" });
                setSetupSecret(String(json.data?.secret || ""));
                setSetupUrl(String(json.data?.otpauth_url || ""));
                setFeedback("Scan the QR code, then enter the first authenticator code.");
              })
            }
          >
            <Smartphone className="h-4 w-4" />
            Set up authenticator
          </Button>
          {status?.email_otp_enabled ? (
            <Button
              type="button"
              variant={status.active_second_factor === "email_otp" ? "default" : "outline"}
              className="rounded-xl"
              disabled={pending || status.active_second_factor === "email_otp"}
              onClick={() =>
                run(async () => {
                  await postAction({
                    action: "active-method",
                    active_second_factor: "email_otp",
                  });
                  setFeedback("Email OTP is now your active second factor.");
                })
              }
            >
              Use Email OTP at login
            </Button>
          ) : null}
          {status?.totp_enabled ? (
            <Button
              type="button"
              variant={status.active_second_factor === "totp" ? "default" : "outline"}
              className="rounded-xl"
              disabled={pending || status.active_second_factor === "totp"}
              onClick={() =>
                run(async () => {
                  await postAction({
                    action: "active-method",
                    active_second_factor: "totp",
                  });
                  setFeedback("Authenticator is now your active second factor.");
                })
              }
            >
              Use Authenticator at login
            </Button>
          ) : null}
        </div>

        {(setupSecret || setupUrl) && !status?.totp_enabled ? (
          <div className="mt-5 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] p-4">
            <p className="text-sm text-[var(--portal-muted)]">
              Scan with Google Authenticator, Microsoft Authenticator, Authy, or any RFC 6238 app.
            </p>
            {qrSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrSrc}
                alt="Authenticator QR code"
                className="mt-3 h-[180px] w-[180px] rounded-lg bg-white p-2"
              />
            ) : null}
            {setupSecret ? (
              <p className="mt-3 break-all font-mono text-xs text-[var(--portal-fg)]">
                Manual key: {setupSecret}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                className="rounded-xl"
                disabled={pending || totpCode.length < 6}
                onClick={() =>
                  run(async () => {
                    const json = await postAction({
                      action: "totp-enable",
                      code: totpCode,
                    });
                    const codes = Array.isArray(json.data?.recovery_codes)
                      ? (json.data.recovery_codes as string[])
                      : null;
                    setRecoveryCodes(codes);
                    setSetupSecret("");
                    setSetupUrl("");
                    setTotpCode("");
                    setFeedback("Authenticator enabled.");
                  })
                }
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Verify & enable
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setSetupSecret("");
                  setSetupUrl("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        {status?.totp_enabled ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
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
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={pending || !password}
              onClick={() =>
                run(async () => {
                  await postAction({
                    action: "totp-disable",
                    password,
                    totp_code: totpCode || undefined,
                  });
                  setPassword("");
                  setTotpCode("");
                  setFeedback("Authenticator disabled.");
                })
              }
            >
              Disable authenticator
            </Button>
            {typeof status.recovery_codes_remaining === "number" ? (
              <p className="self-center text-xs text-[var(--portal-muted)]">
                {status.recovery_codes_remaining} recovery codes remaining
              </p>
            ) : null}
          </div>
        ) : null}
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

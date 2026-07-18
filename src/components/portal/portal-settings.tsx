"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, User } from "lucide-react";
import { usePortalContext } from "@/components/portal/portal-data-provider";
import { PortalDataRow } from "@/components/portal/portal-ui";
import { PortalSecurityPanel } from "@/components/portal/portal-security";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiMessageFromJson, friendlyNetworkError } from "@/lib/network/errors";
import { cn } from "@/lib/utils";
function resolvePhotoUrl(photoUrl?: string | null) {
  if (!photoUrl) return null;
  if (/^https?:\/\//i.test(photoUrl) || photoUrl.startsWith("data:")) return photoUrl;
  const engine =
    process.env.NEXT_PUBLIC_LICENSE_ENGINE_URL || "https://api.license.waamtech.com";
  const base = engine.replace(/\/+$/, "").replace(/\/api$/i, "");
  if (photoUrl.startsWith("/")) return `${base}${photoUrl}`;
  return `${base}/${photoUrl.replace(/^\/+/, "")}`;
}

export function PortalSettingsView() {
  const { data, reload } = usePortalContext();
  const identity = data!.identity;
  const customerId = identity.customer_id || data!.customer?.id || "—";

  const [fullName, setFullName] = useState(identity.full_name || "");
  const [phone, setPhone] = useState(identity.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setFullName(identity.full_name || "");
    setPhone(identity.phone || "");
  }, [identity.full_name, identity.phone]);

  const photoPreview = resolvePhotoUrl(identity.photo_url);

  const patchSettings = async (payload: Record<string, unknown>) => {
    const res = await fetch("/api/portal/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      cache: "no-store",
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(apiMessageFromJson(json, "Unable to update account."));
    }
    return json;
  };

  const saveProfile = () => {
    setError("");
    setFeedback("");
    startTransition(async () => {
      try {
        await patchSettings({
          action: "profile",
          full_name: fullName.trim(),
          phone: phone.trim() || undefined,
        });
        setFeedback("Profile updated.");
        await reload();
      } catch (err) {
        setError(friendlyNetworkError(err, "Unable to update profile."));
      }
    });
  };

  const savePassword = () => {
    setError("");
    setFeedback("");
    startTransition(async () => {
      try {
        await patchSettings({
          action: "password",
          current_password: currentPassword,
          new_password: newPassword,
        });
        setFeedback("Password updated.");
        setCurrentPassword("");
        setNewPassword("");
      } catch (err) {
        setError(friendlyNetworkError(err, "Unable to update password."));
      }
    });
  };

  return (
    <div className="space-y-8">
      {(feedback || error) && (
        <div
          role="status"
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            error
              ? "border-rose-500/25 bg-rose-500/10 text-rose-900 dark:text-rose-200"
              : "border-emerald-500/25 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
          )}
        >
          {error || feedback}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="settings-profile-heading"
          className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-panel)] p-5"
        >
          <h3 id="settings-profile-heading" className="text-sm font-semibold text-[var(--portal-fg)]">
            Profile
          </h3>
          <p className="mt-1 text-xs text-[var(--portal-muted)]">
            Shared with License Engine and WAAMTO SaaS. Profile photo is managed in SaaS only.
          </p>

          <div className="mt-5 flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-soft)]">
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[var(--portal-muted)]">
                  <User className="h-7 w-7" aria-hidden />
                </span>
              )}
            </div>
            <div className="min-w-0 text-sm text-[var(--portal-muted)]">
              <p className="font-medium text-[var(--portal-fg)]">Photo preview</p>
              <p className="mt-0.5">Update photo from WAAMTO SaaS — it syncs here automatically.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <PortalDataRow label="Email (read only)" value={identity.email} />
            <PortalDataRow label="Customer ID (read only)" value={customerId} />
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="settings-name">Full name</Label>
            <Input
              id="settings-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-11 bg-[var(--portal-soft)]"
              autoComplete="name"
            />
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="settings-phone">Phone</Label>
            <Input
              id="settings-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-11 bg-[var(--portal-soft)]"
              autoComplete="tel"
            />
          </div>
          <Button
            type="button"
            className="mt-5 rounded-xl"
            disabled={pending}
            onClick={saveProfile}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save profile
          </Button>
        </section>

        <section
          aria-labelledby="settings-password-heading"
          className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-panel)] p-5"
        >
          <h3 id="settings-password-heading" className="text-sm font-semibold text-[var(--portal-fg)]">
            Password
          </h3>
          <p className="mt-1 text-xs text-[var(--portal-muted)]">
            Password changes sync through License Engine identity.
          </p>
          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="settings-current-password">Current password</Label>
              <Input
                id="settings-current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-11 bg-[var(--portal-soft)]"
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-new-password">New password</Label>
              <Input
                id="settings-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-11 bg-[var(--portal-soft)]"
                autoComplete="new-password"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={pending || !currentPassword || !newPassword}
              onClick={savePassword}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Update password
            </Button>
          </div>
        </section>
      </div>

      <section aria-labelledby="settings-security-heading" className="space-y-4">
        <h3 id="settings-security-heading" className="text-sm font-semibold text-[var(--portal-fg)]">
          Security
        </h3>
        <p className="text-xs text-[var(--portal-muted)]">
          Password authentication, Email OTP, authenticator app, recovery codes, trusted devices,
          and active sessions — managed through License Engine identity.
        </p>
        <PortalSecurityPanel sessions={data!.sessions} onSessionsChanged={reload} />
      </section>
    </div>
  );
}

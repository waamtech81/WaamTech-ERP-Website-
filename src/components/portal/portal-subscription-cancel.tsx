"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { formatPortalDate } from "@/components/portal/use-portal-data";
import { apiMessageFromJson, friendlyNetworkError } from "@/lib/network/errors";
import type { CommercialSubscription } from "@/lib/commercial/types";
import { cn } from "@/lib/utils";

export function subscriptionCancelEligible(sub: CommercialSubscription): boolean {
  const status = String(sub.status || "").toLowerCase();
  const cycle = String(sub.billing_cycle || "").toLowerCase();
  return ["active", "trial", "trialing", "suspended", "grace"].includes(status) && cycle !== "lifetime";
}

/** Auto-renewal off with a scheduled period-end date (not merely default-off). */
export function subscriptionCancelScheduled(sub: CommercialSubscription): boolean {
  const status = String(sub.status || "").toLowerCase();
  if (["cancelled", "expired", "terminated"].includes(status)) return false;
  if (sub.auto_renewal !== false) return false;
  if (!sub.cancellation_date) return false;
  return ["active", "trial", "trialing", "grace", "suspended"].includes(status);
}

export function subscriptionActionsLocked(sub: CommercialSubscription | null | undefined): boolean {
  return Boolean(sub && subscriptionCancelScheduled(sub));
}

export function extractSubscriptionCancelReason(notes?: string | null): string | null {
  if (!notes) return null;
  const lines = String(notes).split("\n");
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i]?.trim() || "";
    const match = line.match(/^\[Cancel scheduled\]\s*(.+)$/i);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

export function subscriptionAccessUntil(sub: CommercialSubscription): string | null {
  return (
    formatPortalDate(sub.cancellation_date) ||
    formatPortalDate(sub.renewal_date || sub.expiry_date) ||
    null
  );
}

export function formatAutoRenewLabel(sub: CommercialSubscription): string {
  if (subscriptionCancelScheduled(sub)) {
    const when = subscriptionAccessUntil(sub);
    return when ? `Off · access until ${when}` : "Off";
  }
  return sub.auto_renewal ? "On" : "Off";
}

export function subscriptionScheduledMessage(sub: CommercialSubscription): string | null {
  if (!subscriptionCancelScheduled(sub)) return null;
  const when = subscriptionAccessUntil(sub);
  return when
    ? `Auto-renewal is off. Access continues until ${when}.`
    : "Auto-renewal is off. Access continues until the end of the current billing period.";
}

function notifyPortalRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("portal-notifications-refresh"));
  }
}

function AutoRenewOffConfirmModal({
  open,
  periodEnd,
  pending,
  error,
  onClose,
  onConfirm,
}: {
  open: boolean;
  periodEnd: string | null;
  pending: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pending, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        aria-label="Close dialog"
        onClick={() => {
          if (!pending) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="portal-auto-renew-off-title"
        className="relative z-[1] w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="portal-auto-renew-off-title"
              className="text-lg font-semibold text-slate-900"
            >
              Turn off auto-renewal?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Access continues until{" "}
              {periodEnd || "the end of your current billing period"}. Automatic renewal and
              auto-payment stop. No refund is issued for the current period.
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
            disabled={pending}
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-xl"
            disabled={pending}
            onClick={onClose}
          >
            Keep on
          </Button>
          <Button
            type="button"
            size="sm"
            className="rounded-xl bg-rose-600 text-white hover:bg-rose-700"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Updating…
              </>
            ) : (
              "Turn off"
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/** Portal self-service auto-renewal toggle (also controls auto-payment via Engine). */
export function PortalSubscriptionCancelActions({
  subscription,
  size = "sm",
  className,
}: {
  subscription: CommercialSubscription;
  size?: "sm" | "default";
  className?: string;
}) {
  const router = useRouter();
  const [confirmOff, setConfirmOff] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (!subscriptionCancelEligible(subscription)) return null;

  const enabled = Boolean(subscription.auto_renewal);
  const periodEnd = subscriptionAccessUntil(subscription);
  const scheduledMessage = subscriptionScheduledMessage(subscription);

  function applyRenewal(nextEnabled: boolean) {
    setError("");
    setMessage("");

    startTransition(async () => {
      try {
        const endpoint = nextEnabled
          ? "/api/portal/billing/resume-renewal"
          : "/api/portal/billing/cancel";
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify({
            subscription_id: subscription.id,
            ...(nextEnabled
              ? {}
              : { notes: "Auto-renewal disabled by customer" }),
          }),
        });
        const json = await res.json();
        if (!json.success) {
          setError(apiMessageFromJson(json, "Unable to update auto-renewal."));
          return;
        }
        setConfirmOff(false);
        setMessage(
          String(
            json.message ||
              (nextEnabled
                ? "Auto-renewal is on. Your subscription and license will renew automatically."
                : scheduledMessage ||
                  "Auto-renewal is off. Access continues until the end of the current billing period.")
          )
        );
        notifyPortalRefresh();
        router.refresh();
      } catch (err) {
        setError(friendlyNetworkError(err));
      }
    });
  }

  return (
    <div className={cn("inline-flex flex-col items-start gap-1.5", className)}>
      <div className="flex items-center gap-2 rounded-xl border border-[var(--portal-border)] bg-[var(--portal-panel)] px-2.5 py-1.5">
        <Switch
          id={`auto-renew-${subscription.id}`}
          checked={enabled}
          disabled={pending}
          onCheckedChange={(checked) => {
            setError("");
            setMessage("");
            if (checked) {
              applyRenewal(true);
              return;
            }
            setConfirmOff(true);
          }}
          className="data-[state=checked]:bg-[var(--portal-primary,#0549a4)]"
          aria-label="Auto-renewal"
        />
        <label
          htmlFor={`auto-renew-${subscription.id}`}
          className={cn(
            "cursor-pointer select-none text-xs font-medium text-[var(--portal-fg)]",
            size === "default" && "text-sm"
          )}
        >
          {pending ? "Updating…" : enabled ? "Auto-renewal on" : "Auto-renewal off"}
        </label>
      </div>

      <AutoRenewOffConfirmModal
        open={confirmOff}
        periodEnd={periodEnd}
        pending={pending}
        error={error}
        onClose={() => {
          if (!pending) {
            setConfirmOff(false);
            setError("");
          }
        }}
        onConfirm={() => applyRenewal(false)}
      />

      {scheduledMessage ? (
        <p className="max-w-xs text-xs leading-relaxed text-teal-700">{scheduledMessage}</p>
      ) : null}
      {message ? <p className="max-w-xs text-xs text-emerald-700">{message}</p> : null}
      {!confirmOff && error ? (
        <p className="max-w-xs text-xs text-rose-600">{error}</p>
      ) : null}
    </div>
  );
}

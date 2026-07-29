"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatPortalDate } from "@/components/portal/use-portal-data";
import { apiMessageFromJson, friendlyNetworkError } from "@/lib/network/errors";
import type { CommercialSubscription } from "@/lib/commercial/types";
import { cn } from "@/lib/utils";

export function subscriptionCancelEligible(sub: CommercialSubscription): boolean {
  const status = String(sub.status || "").toLowerCase();
  const cycle = String(sub.billing_cycle || "").toLowerCase();
  return ["active", "trial", "trialing", "suspended", "grace"].includes(status) && cycle !== "lifetime";
}

/** Auto-renewal off while subscription is still active until period end. */
export function subscriptionCancelScheduled(sub: CommercialSubscription): boolean {
  const status = String(sub.status || "").toLowerCase();
  if (["cancelled", "expired", "terminated"].includes(status)) return false;
  if (sub.auto_renewal !== false) return false;
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
    return when ? `Cancels ${when}` : "Cancel scheduled";
  }
  return sub.auto_renewal ? "Enabled" : "Off";
}

export function subscriptionScheduledMessage(sub: CommercialSubscription): string | null {
  if (!subscriptionCancelScheduled(sub)) return null;
  const when = subscriptionAccessUntil(sub);
  return when
    ? `Auto-renewal cancelled. Your subscription remains active until ${when}.`
    : "Auto-renewal cancelled. Your subscription remains active until the end of the current billing period.";
}

function notifyPortalRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("portal-notifications-refresh"));
  }
}

function CancelSubscriptionModal({
  open,
  periodEnd,
  cancelReason,
  onCancelReason,
  pending,
  error,
  onClose,
  onConfirm,
}: {
  open: boolean;
  periodEnd: string | null;
  cancelReason: string;
  onCancelReason: (value: string) => void;
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
    <>
      <button
        type="button"
        className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-[1px]"
        aria-label="Close cancel subscription dialog"
        onClick={() => {
          if (!pending) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="portal-cancel-subscription-title"
        className="fixed left-1/2 top-1/2 z-[121] w-[min(100%-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-panel)] p-5 shadow-[var(--portal-shadow)] sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="portal-cancel-subscription-title"
              className="text-lg font-semibold text-[var(--portal-fg)]"
            >
              Cancel at period end?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--portal-muted)]">
              Access continues until{" "}
              {periodEnd || "the end of your current billing period"}. Auto-renewal stops and no
              refund is issued for the current period.
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg p-1.5 text-[var(--portal-muted)] hover:bg-[var(--portal-soft)]"
            aria-label="Close"
            disabled={pending}
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mt-4 block">
          <span className="text-sm font-medium text-[var(--portal-fg)]">
            Why are you cancelling?
          </span>
          <Textarea
            value={cancelReason}
            onChange={(e) => onCancelReason(e.target.value)}
            placeholder="Tell us what we could improve…"
            rows={4}
            maxLength={500}
            className="mt-2 min-h-[96px] resize-none"
          />
        </label>

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
            Keep subscription
          </Button>
          <Button
            type="button"
            size="sm"
            className="rounded-xl bg-rose-600 hover:bg-rose-700"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Submitting…
              </>
            ) : (
              "Submit cancellation"
            )}
          </Button>
        </div>
      </div>
    </>,
    document.body
  );
}

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
  const [modalOpen, setModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (!subscriptionCancelEligible(subscription)) return null;

  const scheduled = subscriptionCancelScheduled(subscription);
  const periodEnd = subscriptionAccessUntil(subscription);
  const scheduledMessage = subscriptionScheduledMessage(subscription);

  function run(action: "cancel" | "resume") {
    setError("");
    setMessage("");
    const reason = cancelReason.trim();
    if (action === "cancel" && reason.length < 3) {
      setError("Please tell us why you are cancelling (at least a few words).");
      return;
    }

    startTransition(async () => {
      try {
        const endpoint =
          action === "cancel"
            ? "/api/portal/billing/cancel"
            : "/api/portal/billing/resume-renewal";
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify({
            subscription_id: subscription.id,
            ...(action === "cancel" ? { notes: reason.slice(0, 500) } : {}),
          }),
        });
        const json = await res.json();
        if (!json.success) {
          setError(apiMessageFromJson(json, "Unable to update subscription."));
          return;
        }
        setModalOpen(false);
        setCancelReason("");
        setMessage(
          String(
            json.message ||
              (action === "cancel"
                ? scheduledMessage ||
                  "Auto-renewal cancelled. Your subscription remains active until the end of the current billing period."
                : "Auto-renewal has been re-enabled for this subscription.")
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
    <div className={cn("inline-flex flex-col items-start gap-1", className)}>
      {scheduled ? (
        <Button
          type="button"
          size={size}
          variant="outline"
          className="h-8 rounded-lg border-emerald-200 text-emerald-800 hover:bg-emerald-50"
          disabled={pending}
          onClick={() => run("resume")}
        >
          {pending ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Updating…
            </>
          ) : (
            "Keep subscription"
          )}
        </Button>
      ) : (
        <>
          <Button
            type="button"
            size={size}
            variant="outline"
            className="h-8 rounded-lg border-rose-200 text-rose-700 hover:bg-rose-50"
            onClick={() => {
              setError("");
              setMessage("");
              setCancelReason("");
              setModalOpen(true);
            }}
          >
            Cancel subscription
          </Button>
          <CancelSubscriptionModal
            open={modalOpen}
            periodEnd={periodEnd}
            cancelReason={cancelReason}
            onCancelReason={setCancelReason}
            pending={pending}
            error={error}
            onClose={() => {
              if (!pending) {
                setModalOpen(false);
                setCancelReason("");
                setError("");
              }
            }}
            onConfirm={() => run("cancel")}
          />
        </>
      )}
      {scheduledMessage && scheduled ? (
        <p className="max-w-xs text-xs leading-relaxed text-teal-700">{scheduledMessage}</p>
      ) : null}
      {message ? <p className="max-w-xs text-xs text-emerald-700">{message}</p> : null}
      {!modalOpen && error && !scheduled ? (
        <p className="max-w-xs text-xs text-rose-600">{error}</p>
      ) : null}
    </div>
  );
}

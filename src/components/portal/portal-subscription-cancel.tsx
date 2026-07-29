"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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

export function subscriptionCancelScheduled(sub: CommercialSubscription): boolean {
  const status = String(sub.status || "").toLowerCase();
  if (status === "cancelled" || status === "expired") return false;
  return sub.auto_renewal === false && Boolean(sub.cancellation_date);
}

export function formatAutoRenewLabel(sub: CommercialSubscription): string {
  if (subscriptionCancelScheduled(sub)) {
    const when = formatPortalDate(sub.cancellation_date);
    return when ? `Cancels ${when}` : "Cancel scheduled";
  }
  return sub.auto_renewal ? "Enabled" : "Off";
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (!subscriptionCancelEligible(subscription)) return null;

  const scheduled = subscriptionCancelScheduled(subscription);
  const periodEnd =
    formatPortalDate(subscription.cancellation_date) ||
    formatPortalDate(subscription.renewal_date || subscription.expiry_date);

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
        setConfirmOpen(false);
        setCancelReason("");
        setMessage(String(json.message || "Subscription updated."));
        router.refresh();
      } catch (err) {
        setError(friendlyNetworkError(err));
      }
    });
  }

  if (scheduled) {
    return (
      <div className={cn("inline-flex flex-col items-start gap-1", className)}>
        <Button
          type="button"
          size={size}
          variant="outline"
          className="rounded-lg h-8 border-emerald-200 text-emerald-800 hover:bg-emerald-50"
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
        {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
        {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className={cn("inline-flex flex-col items-start gap-1", className)}>
      {!confirmOpen ? (
        <Button
          type="button"
          size={size}
          variant="outline"
          className="rounded-lg h-8 border-rose-200 text-rose-700 hover:bg-rose-50"
          onClick={() => {
            setError("");
            setMessage("");
            setCancelReason("");
            setConfirmOpen(true);
          }}
        >
          Cancel subscription
        </Button>
      ) : (
        <div className="max-w-sm rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-950">
          <p className="font-semibold">Cancel at period end?</p>
          <p className="mt-1 leading-relaxed text-rose-900/90">
            Access continues until{" "}
            {periodEnd || "the end of your current billing period"}. Auto-renewal stops and
            no refund is issued for the current period.
          </p>
          <label className="mt-3 block">
            <span className="font-medium text-rose-950">Why are you cancelling?</span>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Tell us what we could improve…"
              rows={3}
              maxLength={500}
              className="mt-1.5 min-h-[72px] resize-none border-rose-200 bg-white text-xs text-foreground placeholder:text-muted-foreground"
            />
          </label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="default"
              className="h-7 rounded-lg bg-rose-600 px-2.5 text-xs hover:bg-rose-700"
              disabled={pending}
              onClick={() => run("cancel")}
            >
              {pending ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Cancelling…
                </>
              ) : (
                "Confirm cancel"
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 rounded-lg px-2.5 text-xs"
              disabled={pending}
              onClick={() => {
                setConfirmOpen(false);
                setCancelReason("");
                setError("");
              }}
            >
              Keep subscription
            </Button>
          </div>
        </div>
      )}
      {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

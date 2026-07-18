"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortalPanel, PortalSkeleton } from "@/components/portal/portal-ui";
import { apiMessageFromJson, friendlyNetworkError } from "@/lib/network/errors";
import { useLocale } from "@/components/providers/locale-provider";

function PortalCheckoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = String(searchParams.get("session") || "").trim();
  const { formatPrice } = useLocale();
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [checkout, setCheckout] = useState<{
    session_token?: string;
    status?: string;
    purpose?: string;
    amount?: number | null;
    currency?: string | null;
    gateway?: string | null;
  } | null>(null);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      setError("Missing checkout session.");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/portal/billing/checkout/${encodeURIComponent(session)}`,
          { cache: "no-store", credentials: "include" }
        );
        const json = await res.json();
        if (cancelled) return;
        if (!json.success) {
          setError(apiMessageFromJson(json, "Unable to load checkout."));
          setCheckout(null);
        } else {
          setCheckout(json.data || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(friendlyNetworkError(err, "Unable to load checkout."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session]);

  async function confirmPayment() {
    if (!session || confirming) return;
    setConfirming(true);
    setError("");
    try {
      const res = await fetch(
        `/api/portal/billing/checkout/${encodeURIComponent(session)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify({}),
        }
      );
      const json = await res.json();
      if (!json.success) {
        setError(apiMessageFromJson(json, "Payment could not be confirmed."));
        setConfirming(false);
        return;
      }
      router.replace(
        `/portal/checkout/success?session=${encodeURIComponent(session)}`
      );
    } catch (err) {
      setError(friendlyNetworkError(err, "Payment could not be confirmed."));
      setConfirming(false);
    }
  }

  if (loading) return <PortalSkeleton rows={2} />;

  return (
    <PortalPanel
      title="Complete checkout"
      description="Confirm payment to finish your renewal or upgrade. You stay inside the portal."
    >
      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </div>
      ) : null}

      {checkout ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
              Purpose
            </p>
            <p className="mt-1 text-sm font-medium capitalize">
              {checkout.purpose || "—"}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
              Amount
            </p>
            <p className="mt-1 text-sm font-medium tabular-nums">
              {checkout.amount != null
                ? formatPrice(Number(checkout.amount))
                : "—"}
              {checkout.currency ? ` ${checkout.currency}` : ""}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
              Status
            </p>
            <p className="mt-1 text-sm font-medium capitalize">
              {checkout.status || "—"}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
              Gateway
            </p>
            <p className="mt-1 text-sm font-medium capitalize">
              {checkout.gateway || "simulated"}
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="rounded-xl"
          disabled={!session || confirming || Boolean(error && !checkout)}
          onClick={() => void confirmPayment()}
        >
          {confirming ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Confirming…
            </>
          ) : (
            "Confirm payment"
          )}
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/portal/plans">Back to plans</Link>
        </Button>
        <Button asChild variant="ghost" className="rounded-xl">
          <Link href="/portal/subscriptions">Cancel</Link>
        </Button>
      </div>
    </PortalPanel>
  );
}

export default function PortalCheckoutPage() {
  return (
    <Suspense fallback={<PortalSkeleton rows={2} />}>
      <PortalCheckoutInner />
    </Suspense>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortalPaymentMethodPicker } from "@/components/portal/portal-payment-methods";
import { PortalFlash, PortalPanel, PortalSkeleton } from "@/components/portal/portal-ui";
import { usePortalContext } from "@/components/portal/portal-data-provider";
import { apiMessageFromJson, friendlyNetworkError } from "@/lib/network/errors";
import { useLocale } from "@/components/providers/locale-provider";
import {
  buildPaymentReference,
  engineGatewayForMethod,
  PORTAL_PAYMENT_METHODS,
} from "@/lib/portal/payment-methods";

function PortalCheckoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = String(searchParams.get("session") || "").trim();
  const mode = String(searchParams.get("mode") || "").trim();
  const planName = String(searchParams.get("plan") || "").trim();
  const { formatPrice } = useLocale();
  const { data: portal } = usePortalContext();
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [checkout, setCheckout] = useState<{
    session_token?: string;
    status?: string;
    purpose?: string;
    amount?: number | null;
    currency?: string | null;
    gateway?: string | null;
    plan_name?: string | null;
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
          const data = json.data || null;
          setCheckout(data);
          const gw = String(data?.gateway || "").toLowerCase();
          if (gw === "paypal") setSelectedMethod("paypal");
          else if (gw === "stripe") setSelectedMethod("stripe");
          else if (gw === "bank") setSelectedMethod("bank");
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

  const selectedMeta = PORTAL_PAYMENT_METHODS.find((m) => m.id === selectedMethod);
  const needsTxn = Boolean(selectedMeta?.requiresTransactionId);

  async function confirmPayment() {
    if (!session || confirming) return;
    if (needsTxn && !transactionId.trim()) {
      setError("Enter the transaction ID after you complete the transfer.");
      return;
    }
    setConfirming(true);
    setError("");
    try {
      const reference = needsTxn
        ? buildPaymentReference({
            methodId: selectedMethod,
            transactionId: transactionId.trim(),
            amount: checkout?.amount,
            currency: checkout?.currency,
          })
        : selectedMethod || undefined;

      const res = await fetch(
        `/api/portal/billing/checkout/${encodeURIComponent(session)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify({
            reference,
            gateway: engineGatewayForMethod(selectedMethod),
            payment_method: selectedMethod || undefined,
            transaction_id: transactionId.trim() || undefined,
          }),
        }
      );
      const json = await res.json();
      if (!json.success) {
        setError(apiMessageFromJson(json, "Payment could not be confirmed."));
        setConfirming(false);
        return;
      }
      const qs = new URLSearchParams({ session });
      if (mode) qs.set("mode", mode);
      if (planName) qs.set("plan", planName);
      router.replace(`/portal/checkout/success?${qs.toString()}`);
    } catch (err) {
      setError(friendlyNetworkError(err, "Payment could not be confirmed."));
      setConfirming(false);
    }
  }

  if (loading) return <PortalSkeleton rows={2} />;

  return (
    <PortalPanel
      title="Complete payment"
      description="Choose how you want to pay. Pakistan wallets appear for PK visitors; PayPal, Stripe/card, Standard Chartered, and Wise are available internationally and in Pakistan."
    >
      {error ? (
        <div className="mb-4">
          <PortalFlash tone="error">{error}</PortalFlash>
        </div>
      ) : null}

      {checkout ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
              Plan
            </p>
            <p className="mt-1 text-sm font-medium text-[var(--portal-fg)]">
              {planName || checkout.plan_name || checkout.purpose || "—"}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
              Amount due
            </p>
            <p className="mt-1 text-sm font-medium tabular-nums text-[var(--portal-fg)]">
              {checkout.amount != null
                ? formatPrice(Number(checkout.amount))
                : "—"}
              {checkout.currency ? ` ${checkout.currency}` : ""}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
              Purpose
            </p>
            <p className="mt-1 text-sm font-medium capitalize text-[var(--portal-fg)]">
              {mode || checkout.purpose || "—"}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
              Status
            </p>
            <p className="mt-1 text-sm font-medium capitalize text-[var(--portal-fg)]">
              {checkout.status || "—"}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mb-6">
        <PortalPaymentMethodPicker
          value={selectedMethod}
          onChange={setSelectedMethod}
          transactionId={transactionId}
          onTransactionIdChange={setTransactionId}
          country={portal?.overview?.country}
          amount={checkout?.amount}
          currency={checkout?.currency}
        />
      </div>

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
              Submitting…
            </>
          ) : needsTxn ? (
            "Submit transaction ID"
          ) : (
            "Pay now"
          )}
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/portal/plans">Back to plans</Link>
        </Button>
        <Button asChild variant="ghost" className="rounded-xl">
          <Link href="/portal/billing">Billing</Link>
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

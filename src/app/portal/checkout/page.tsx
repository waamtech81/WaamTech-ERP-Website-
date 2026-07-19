"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PortalPanel, PortalSkeleton } from "@/components/portal/portal-ui";
import { usePortalContext } from "@/components/portal/portal-data-provider";
import { apiMessageFromJson, friendlyNetworkError } from "@/lib/network/errors";
import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

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
  const [selectedGateway, setSelectedGateway] = useState("");
  const [checkout, setCheckout] = useState<{
    session_token?: string;
    status?: string;
    purpose?: string;
    amount?: number | null;
    currency?: string | null;
    gateway?: string | null;
    plan_name?: string | null;
  } | null>(null);

  const gateways = (portal?.gateways || []).filter((g) => g.configured || g.online);

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
          if (data?.gateway) setSelectedGateway(String(data.gateway));
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

  useEffect(() => {
    if (!selectedGateway && gateways[0]?.id) {
      setSelectedGateway(gateways[0].id);
    }
  }, [gateways, selectedGateway]);

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
          body: JSON.stringify({
            reference: selectedGateway || undefined,
            gateway: selectedGateway || undefined,
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
      description="Pay for the plan you selected. Available payment methods come from License Engine billing gateways."
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
              Plan
            </p>
            <p className="mt-1 text-sm font-medium">
              {planName || checkout.plan_name || checkout.purpose || "—"}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--portal-muted)]">
              Amount due
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
              Purpose
            </p>
            <p className="mt-1 text-sm font-medium capitalize">
              {mode || checkout.purpose || "—"}
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
        </div>
      ) : null}

      {gateways.length ? (
        <div className="mb-6 space-y-3">
          <Label>Payment method</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {gateways.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGateway(g.id)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left text-sm",
                  selectedGateway === g.id
                    ? "border-[var(--portal-primary)] bg-[var(--portal-primary-soft)]"
                    : "border-[var(--portal-border)] bg-[var(--portal-soft)]"
                )}
              >
                <p className="font-medium capitalize">{g.label || g.id}</p>
                <p className="mt-0.5 text-xs text-[var(--portal-muted)]">
                  {g.online ? "Online" : "Configured"}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : checkout?.gateway ? (
        <p className="mb-6 text-sm text-[var(--portal-muted)]">
          Gateway: <span className="capitalize">{checkout.gateway}</span>
        </p>
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

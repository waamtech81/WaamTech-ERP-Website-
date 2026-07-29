"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PayPalCheckout } from "@/components/portal/paypal-checkout";
import { PortalPaymentMethodDetails } from "@/components/portal/portal-payment-method-details";
import { PortalPaymentMethodIcon } from "@/components/portal/portal-payment-method-icon";
import { PortalFlash, PortalSkeleton, PortalStatusBadge } from "@/components/portal/portal-ui";
import { TrustBadgeStrip } from "@/components/trust-badges";
import { usePortalContext } from "@/components/portal/portal-data-provider";
import { apiMessageFromJson, friendlyNetworkError } from "@/lib/network/errors";
import { useLocale } from "@/components/providers/locale-provider";
import { formatUsdAs } from "@/lib/currency/format";
import {
  buildPaymentReference,
  engineGatewayForMethod,
  paymentMethodsForCountry,
  PORTAL_PAYMENT_METHODS,
} from "@/lib/portal/payment-methods";
import { formatPortalStatus } from "@/lib/portal/display-labels";
import { cn } from "@/lib/utils";
import {
  clearCheckoutSessionToken,
  resolveCheckoutSessionToken,
} from "@/lib/portal/checkout-session";

type CheckoutSession = {
  session_token?: string;
  status?: string;
  purpose?: string;
  amount?: number | null;
  currency?: string | null;
  gateway?: string | null;
  plan_name?: string | null;
};

function purposeLabel(mode: string, purpose?: string | null) {
  const raw = (mode || purpose || "subscription").toLowerCase();
  if (raw === "renew") return "Subscription renewal";
  if (raw === "upgrade") return "Plan upgrade";
  if (raw === "new_place") return "New business / place";
  if (raw === "trial-convert" || raw === "trial_convert") return "Trial activation";
  if (raw === "signup") return "New account purchase";
  return raw.replace(/_/g, " ");
}

export function PortalCheckoutView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionFromUrl = searchParams.get("session");
  const mode = String(searchParams.get("mode") || "").trim();
  const checkoutReason = String(searchParams.get("reason") || "").trim();
  const planName = String(searchParams.get("plan") || "").trim();
  const methodFromUrl = String(searchParams.get("method") || "").trim().toLowerCase();
  const { formatPrice, rates, country: visitorCountry } = useLocale();
  const { data: portal } = usePortalContext();

  const [sessionToken, setSessionToken] = useState("");

  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [selectedMethod, setSelectedMethod] = useState(() => {
    if (!methodFromUrl) return "";
    return PORTAL_PAYMENT_METHODS.some((m) => m.id === methodFromUrl)
      ? methodFromUrl
      : "";
  });
  const [methodReady, setMethodReady] = useState(Boolean(selectedMethod));
  const [transactionId, setTransactionId] = useState("");
  const [checkout, setCheckout] = useState<CheckoutSession | null>(null);
  const [geoCountry, setGeoCountry] = useState<string | null>(visitorCountry);

  useEffect(() => {
    const token = resolveCheckoutSessionToken(sessionFromUrl);
    setSessionToken(token);
    if (sessionFromUrl) {
      const params = new URLSearchParams();
      if (mode) params.set("mode", mode);
      if (planName) params.set("plan", planName);
      if (methodFromUrl) params.set("method", methodFromUrl);
      const qs = params.toString();
      router.replace(qs ? `/portal/checkout?${qs}` : "/portal/checkout", { scroll: false });
    }
  }, [sessionFromUrl, mode, planName, methodFromUrl, router]);

  // Payment methods follow visitor geolocation (IP), not billing profile country.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/geo", { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        const c = json?.extra?.country || json?.data?.country || visitorCountry || null;
        if (c) setGeoCountry(String(c).trim().toUpperCase());
      } catch {
        if (!cancelled && visitorCountry) setGeoCountry(visitorCountry);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visitorCountry]);

  const methods = useMemo(
    () => paymentMethodsForCountry(geoCountry),
    [geoCountry]
  );

  useEffect(() => {
    if (!sessionToken) {
      setLoading(false);
      setError("Missing checkout session.");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/portal/billing/checkout/${encodeURIComponent(sessionToken)}`,
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
          const urlMethod = PORTAL_PAYMENT_METHODS.some((m) => m.id === methodFromUrl)
            ? methodFromUrl
            : "";
          const gw = String(data?.gateway || "").toLowerCase();
          const fromGateway =
            gw === "paypal"
              ? "paypal"
              : gw === "stripe"
                ? "stripe"
                : gw === "bank"
                  ? "bank"
                  : "";
          setSelectedMethod((prev) => urlMethod || fromGateway || prev);
          setMethodReady(true);
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
  }, [sessionToken, methodFromUrl]);

  useEffect(() => {
    if (!methodReady || methodFromUrl || !methods.length) return;
    const firstId = methods[0]?.id;
    if (!firstId) return;
    if (!selectedMethod) setSelectedMethod(firstId);
    else if (!methods.some((m) => m.id === selectedMethod)) setSelectedMethod(firstId);
  }, [methods, selectedMethod, methodReady, methodFromUrl]);

  const selectedMeta = methods.find((m) => m.id === selectedMethod);
  const needsTxn = Boolean(selectedMeta?.requiresTransactionId);

  const displayPlan = planName || checkout?.plan_name || checkout?.purpose || "WAAMTO subscription";
  const displayPurpose = purposeLabel(mode, checkout?.purpose);
  const usdAmount =
    checkout?.amount != null && Number.isFinite(Number(checkout.amount))
      ? Number(checkout.amount)
      : null;
  const displayAmountLabel =
    usdAmount != null ? formatPrice(usdAmount, { showCode: true }) : "—";
  const paymentUsdLabel =
    usdAmount != null ? formatUsdAs(usdAmount, "USD", rates, { showCode: true }) : "—";

  async function confirmPayment() {
    if (!sessionToken || confirming) return;
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
            amount: usdAmount,
            currency: "USD",
          })
        : selectedMethod || undefined;

      const res = await fetch(
        `/api/portal/billing/checkout/${encodeURIComponent(sessionToken)}`,
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
      clearCheckoutSessionToken();
      const qs = new URLSearchParams();
      if (mode) qs.set("mode", mode);
      const successPlan = planName || checkout?.plan_name || "";
      if (successPlan) qs.set("plan", successPlan);
      router.replace(qs.toString() ? `/portal/checkout/success?${qs.toString()}` : "/portal/checkout/success");
    } catch (err) {
      setError(friendlyNetworkError(err, "Payment could not be confirmed."));
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-1 py-2">
        <PortalSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/portal/billing"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--portal-muted)] transition-colors hover:text-[var(--portal-fg)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to billing
        </Link>
        <div className="inline-flex items-center gap-2 text-xs text-[var(--portal-muted)]">
          <Lock className="h-3.5 w-3.5" />
          Secure checkout
        </div>
      </div>

      {error ? (
        <PortalFlash tone="error">{error}</PortalFlash>
      ) : null}

      {mode === "trial-convert" ||
      mode === "trial_convert" ||
      checkoutReason === "trial_expired" ||
      checkout?.purpose === "trial_convert" ? (
        <div
          role="status"
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-black"
        >
          <p className="font-semibold text-black">Your trial has ended</p>
          <p className="mt-1 text-black">
            Pay below to continue with the same license and plan. After payment, WAAMTO ERP Cloud
            access is restored and a paid invoice is emailed to you.
          </p>
        </div>
      ) : checkoutReason === "subscription_expired" || checkoutReason === "subscription_suspended" ? (
        <div
          role="status"
          className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-black"
        >
          <p className="font-semibold text-black">Subscription renewal required</p>
          <p className="mt-1 text-black">
            Your billing period ended without payment. Complete checkout to restore app access at
            app.waamto.com. This portal stays available for account management.
          </p>
        </div>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(520px,680px)] xl:items-start">
        {/* Left — order summary */}
        <section className="order-2 xl:order-1">
          <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-panel)] p-6 shadow-sm sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--portal-muted)]">
              Order summary
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--portal-fg)]">
              Complete your purchase
            </h1>
            <p className="mt-2 text-sm text-[var(--portal-muted)]">
              Review what you are paying for before confirming payment on the right.
            </p>

            <div className="mt-8 space-y-4 border-t border-[var(--portal-border)] pt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--portal-muted)]">
                    Product
                  </p>
                  <p className="mt-1 text-base font-semibold text-[var(--portal-fg)]">
                    {displayPlan}
                  </p>
                  <p className="mt-0.5 text-sm text-[var(--portal-muted)]">{displayPurpose}</p>
                </div>
                {checkout?.status ? (
                  <PortalStatusBadge status={checkout.status} />
                ) : null}
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-[var(--portal-soft)] px-4 py-3">
                  <dt className="text-xs text-[var(--portal-muted)]">Account</dt>
                  <dd className="mt-1 text-sm font-medium text-[var(--portal-fg)]">
                    {portal?.overview?.company || "—"}
                  </dd>
                </div>
                <div className="rounded-xl bg-[var(--portal-soft)] px-4 py-3">
                  <dt className="text-xs text-[var(--portal-muted)]">Billing contact</dt>
                  <dd className="mt-1 text-sm font-medium text-[var(--portal-fg)]">
                    {portal?.overview?.customerName || "—"}
                  </dd>
                </div>
                <div className="rounded-xl bg-[var(--portal-soft)] px-4 py-3">
                  <dt className="text-xs text-[var(--portal-muted)]">Checkout type</dt>
                  <dd className="mt-1 text-sm font-medium capitalize text-[var(--portal-fg)]">
                    {displayPurpose}
                  </dd>
                </div>
                <div className="rounded-xl bg-[var(--portal-soft)] px-4 py-3">
                  <dt className="text-xs text-[var(--portal-muted)]">Session status</dt>
                  <dd className="mt-1 text-sm font-medium text-[var(--portal-fg)]">
                    {formatPortalStatus(checkout?.status) || "Pending"}
                  </dd>
                </div>
              </dl>

              <div className="flex items-end justify-between gap-4 border-t border-dashed border-[var(--portal-border)] pt-5">
                <div>
                  <p className="text-sm text-[var(--portal-muted)]">Total due today</p>
                  <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-[var(--portal-fg)]">
                    {displayAmountLabel}
                  </p>
                  {usdAmount != null ? (
                    <p className="mt-2 text-sm text-[var(--portal-muted)]">
                      Payment amount:{" "}
                      <span className="font-medium tabular-nums text-[var(--portal-fg)]">
                        {paymentUsdLabel}
                      </span>
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Your subscription activates after we confirm your payment. You will receive a
                notification once it is processed.
              </p>
            </div>

            <div className="mt-6 border-t border-[var(--portal-border)] pt-5">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                <p className="text-sm font-semibold text-[var(--portal-fg)]">Secure checkout</p>
              </div>
              <p className="mt-1 text-xs text-[var(--portal-muted)]">
                Encrypted connection · verified payment · privacy protected
              </p>
              <TrustBadgeStrip
                ids={[
                  "encrypted-connection",
                  "secure-authentication",
                  "privacy-focused",
                  "license-protected",
                ]}
                tone="auto"
                size="xs"
                href={false}
                showLabel={false}
                showTooltip
                layout="row"
                className="mt-3 justify-start"
              />
            </div>
          </div>
        </section>

        {/* Right — payment (methods + details side by side) */}
        <aside className="order-1 xl:order-2 xl:sticky xl:top-6">
          <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-panel)] p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-[var(--portal-fg)]">Payment</h2>
            <p className="mt-1 text-sm text-[var(--portal-muted)]">
              Choose a method on the left, then complete payment on the right.
            </p>

            <div className="mt-5 grid gap-5 md:grid-cols-[minmax(168px,200px)_minmax(0,1fr)] md:items-start">
              <div className="space-y-2">
                {methods.map((m) => {
                  const active = selectedMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMethod(m.id)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2.5 text-left transition-all",
                        active
                          ? "border-[var(--portal-primary)] bg-[var(--portal-primary-soft)] ring-1 ring-[var(--portal-primary)]/20"
                          : "border-[var(--portal-border)] bg-white hover:border-[var(--portal-primary)]/40"
                      )}
                    >
                      <PortalPaymentMethodIcon methodId={m.id} label={m.label} size="md" />
                      <span className="min-w-0 flex-1 text-sm font-semibold leading-tight text-[var(--portal-fg)]">
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)]/40 p-4 sm:p-5">
                {selectedMeta ? (
                  <>
                    <PortalPaymentMethodDetails
                      method={selectedMeta}
                      transactionId={transactionId}
                      onTransactionIdChange={setTransactionId}
                      amount={checkout?.amount}
                      currency={checkout?.currency}
                    />

                    <div className="mt-5 space-y-3 border-t border-[var(--portal-border)] pt-5">
                      {selectedMethod === "paypal" && usdAmount != null ? (
                        <PayPalCheckout
                          sessionToken={sessionToken}
                          amount={usdAmount}
                          currency="USD"
                          mode={mode}
                          planName={planName}
                          onError={setError}
                        />
                      ) : selectedMethod !== "paypal" ? (
                        <Button
                          type="button"
                          className="h-11 w-full rounded-xl text-base"
                          disabled={!sessionToken || confirming || Boolean(error && !checkout)}
                          onClick={() => void confirmPayment()}
                        >
                          {confirming ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Processing…
                            </>
                          ) : needsTxn ? (
                            "Submit payment confirmation"
                          ) : (
                            `Pay ${paymentUsdLabel !== "—" ? paymentUsdLabel : "now"}`
                          )}
                        </Button>
                      ) : null}

                      <p className="text-center text-[11px] leading-relaxed text-[var(--portal-muted)]">
                        By completing payment you authorize WAAMTO to charge the selected
                        method for this purchase.
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-[var(--portal-muted)]">
                    Select a payment method to see instructions.
                  </p>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

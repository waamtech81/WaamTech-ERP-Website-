"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  PAYPAL_RECEIVE_EMAIL,
  PK_MOBILE_WALLET_ACCOUNT,
  WISE_PAYMENT_ID,
  paymentMethodsForCountry,
  paypalCheckoutUrl,
  standardCharteredDetails,
  walletTransferMessage,
  type PortalPaymentMethod,
} from "@/lib/portal/payment-methods";

type Props = {
  value: string;
  onChange: (methodId: string) => void;
  transactionId: string;
  onTransactionIdChange: (value: string) => void;
  country?: string | null;
  amount?: number | null;
  currency?: string | null;
  className?: string;
};

export function PortalPaymentMethodPicker({
  value,
  onChange,
  transactionId,
  onTransactionIdChange,
  country: countryProp,
  amount,
  currency,
  className,
}: Props) {
  const [geoCountry, setGeoCountry] = useState<string | null>(countryProp ?? null);

  useEffect(() => {
    if (countryProp) {
      setGeoCountry(countryProp);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/geo", { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        const c = json?.extra?.country || json?.data?.country || null;
        if (c) setGeoCountry(String(c));
      } catch {
        /* geo optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [countryProp]);

  const methods = useMemo(
    () => paymentMethodsForCountry(geoCountry),
    [geoCountry]
  );

  useEffect(() => {
    if (!methods.length) return;
    const firstId = methods[0]?.id;
    if (!firstId) return;
    if (!value) {
      onChange(firstId);
      return;
    }
    if (!methods.some((m) => m.id === value)) {
      onChange(firstId);
    }
    // Intentionally omit onChange from deps — parent setters are stable; including it can loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [methods, value]);

  const selected: PortalPaymentMethod | undefined = methods.find((m) => m.id === value);
  const bank = standardCharteredDetails();
  const isWallet =
    selected?.id === "jazzcash" ||
    selected?.id === "easypaisa" ||
    selected?.id === "ufone";

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <Label>Payment method</Label>
        <p className="mt-1 text-xs text-[var(--portal-muted)]">
          {geoCountry
            ? `Methods for your location (${geoCountry}). Pakistan wallets appear only for PK visitors.`
            : "Detecting location for available methods…"}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {methods.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m.id)}
            className={cn(
              "rounded-xl border px-4 py-3 text-left text-sm transition-colors",
              value === m.id
                ? "border-[var(--portal-primary)] bg-[var(--portal-primary-soft)]"
                : "border-[var(--portal-border)] bg-[var(--portal-soft)] hover:border-[var(--portal-primary)]/50"
            )}
          >
            <p className="font-medium text-[var(--portal-fg)]">{m.label}</p>
            <p className="mt-0.5 text-xs text-[var(--portal-muted)]">{m.shortHint}</p>
          </button>
        ))}
      </div>

      {isWallet && selected ? (
        <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3 text-sm text-[var(--portal-fg)]">
          <p className="font-semibold">{selected.label} transfer</p>
          <p className="mt-2 leading-relaxed">{walletTransferMessage(selected.label)}</p>
          <p className="mt-3 font-mono text-base font-semibold tracking-wide">
            {PK_MOBILE_WALLET_ACCOUNT}
          </p>
        </div>
      ) : null}

      {selected?.id === "wise" ? (
        <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3 text-sm text-[var(--portal-fg)]">
          <p className="font-semibold">Wise payment</p>
          <p className="mt-2 leading-relaxed">
            Send the exact amount to this Wise payment ID / email, then enter the
            transaction ID below.
          </p>
          <p className="mt-3 font-mono text-base font-semibold">{WISE_PAYMENT_ID}</p>
        </div>
      ) : null}

      {selected?.id === "bank" ? (
        <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3 text-sm text-[var(--portal-fg)]">
          <p className="font-semibold">Standard Chartered bank transfer</p>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-[var(--portal-muted)]">Bank</dt>
              <dd className="font-medium">{bank.bankName}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--portal-muted)]">Account title</dt>
              <dd className="font-medium">{bank.accountTitle}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--portal-muted)]">Account number</dt>
              <dd className="font-mono font-medium">{bank.accountNumber}</dd>
            </div>
            {bank.iban ? (
              <div>
                <dt className="text-xs text-[var(--portal-muted)]">IBAN</dt>
                <dd className="font-mono font-medium">{bank.iban}</dd>
              </div>
            ) : null}
            {bank.swift ? (
              <div>
                <dt className="text-xs text-[var(--portal-muted)]">SWIFT</dt>
                <dd className="font-mono font-medium">{bank.swift}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs text-[var(--portal-muted)]">Branch</dt>
              <dd className="font-medium">{bank.branch}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-[var(--portal-muted)]">
            After transfer, enter the bank transaction / reference ID and submit.
          </p>
        </div>
      ) : null}

      {selected?.id === "paypal" ? (
        <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3 text-sm text-[var(--portal-fg)]">
          <p className="font-semibold">PayPal</p>
          <p className="mt-2 leading-relaxed">
            Complete payment to <span className="font-mono font-semibold">{PAYPAL_RECEIVE_EMAIL}</span>,
            then paste the PayPal transaction ID below.
          </p>
          <a
            href={paypalCheckoutUrl(amount, currency)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--portal-primary)] hover:underline"
          >
            Open PayPal
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      ) : null}

      {selected?.requiresTransactionId ? (
        <div className="space-y-2">
          <Label htmlFor="payment-txn-id">Transaction ID</Label>
          <Input
            id="payment-txn-id"
            value={transactionId}
            onChange={(e) => onTransactionIdChange(e.target.value.trimStart())}
            className="h-11 bg-[var(--portal-soft)] font-mono"
            placeholder="Paste transaction / reference ID after transfer"
            autoComplete="off"
          />
          <p className="text-xs text-[var(--portal-muted)]">
            Required after you send the payment. This is stored on License Engine with your
            checkout and triggers a payment notification.
          </p>
        </div>
      ) : null}
    </div>
  );
}

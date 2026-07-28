"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  easypaisaTransferMessage,
  jazzcashTransferMessage,
  PK_MOBILE_WALLET_ACCOUNT,
  EASYPAYSA_IBAN,
  WISE_PAYMENT_ID,
  paymentMethodsForCountry,
  standardCharteredDetails,
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
  /** When false, do not auto-pick the first geo method (checkout preserves user choice). */
  autoSelectFirst?: boolean;
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
  autoSelectFirst = true,
  className,
}: Props) {
  const [geoCountry, setGeoCountry] = useState<string | null>(null);

  // Visitor geolocation only — Pakistan wallets / bank transfer are PK-only.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/geo", { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        const c = json?.extra?.country || json?.data?.country || null;
        if (c) setGeoCountry(String(c).trim().toUpperCase());
      } catch {
        /* geo optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const methods = useMemo(
    () => paymentMethodsForCountry(geoCountry),
    [geoCountry]
  );

  useEffect(() => {
    if (!autoSelectFirst || !methods.length) return;
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
  }, [methods, value, autoSelectFirst]);

  const selected: PortalPaymentMethod | undefined = methods.find((m) => m.id === value);
  const bank = standardCharteredDetails();

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <Label>Payment method</Label>
        <p className="mt-1 text-xs text-[var(--portal-muted)]">
          {geoCountry
            ? `Methods for your location (${geoCountry}). JazzCash, EasyPaisa, and bank transfer are available in Pakistan only.`
            : "Detecting your location for available payment methods…"}
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

      {selected?.id === "jazzcash" ? (
        <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3 text-sm text-[var(--portal-fg)]">
          <p className="font-semibold">JazzCash transfer</p>
          <p className="mt-2 leading-relaxed">{jazzcashTransferMessage()}</p>
          <p className="mt-3 font-mono text-base font-semibold tracking-wide">
            {PK_MOBILE_WALLET_ACCOUNT}
          </p>
        </div>
      ) : null}

      {selected?.id === "easypaisa" ? (
        <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3 text-sm text-[var(--portal-fg)]">
          <p className="font-semibold">EasyPaisa transfer</p>
          <p className="mt-2 leading-relaxed">{easypaisaTransferMessage()}</p>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--portal-muted)]">
            IBAN
          </p>
          <p className="mt-1 font-mono text-base font-semibold tracking-wide">
            {EASYPAYSA_IBAN}
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
          <p className="font-semibold">Direct bank transfer</p>
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
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[var(--portal-primary)]" />
            <p className="font-semibold">PayPal secure checkout</p>
          </div>
          <p className="mt-2 leading-relaxed text-[var(--portal-muted)]">
            PayPal&apos;s checkout will appear below. You can pay with your PayPal
            account or enter a debit / credit card — no PayPal account required for
            card payments.
          </p>
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

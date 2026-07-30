"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PortalSkeleton } from "@/components/portal/portal-ui";
import { cn } from "@/lib/utils";
import {
  easypaisaTransferMessage,
  jazzcashTransferMessage,
  paymentMethodsForCountry,
  type PortalPaymentMethod,
  type PortalPaymentMethodConfig,
} from "@/lib/portal/payment-methods";

type Props = {
  value: string;
  onChange: (methodId: string) => void;
  transactionId: string;
  onTransactionIdChange: (value: string) => void;
  country?: string | null;
  amount?: number | null;
  currency?: string | null;
  paymentConfig?: PortalPaymentMethodConfig | null;
  loadingConfig?: boolean;
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
  paymentConfig = null,
  loadingConfig = false,
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
        const c = json?.extra?.country || json?.data?.country || countryProp || null;
        if (c) setGeoCountry(String(c).trim().toUpperCase());
      } catch {
        if (!cancelled && countryProp) setGeoCountry(String(countryProp).trim().toUpperCase());
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

      {loadingConfig || !paymentConfig ? (
        <PortalSkeleton rows={3} />
      ) : selected?.id === "jazzcash" ? (
        <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3 text-sm text-[var(--portal-fg)]">
          <p className="font-semibold">JazzCash transfer</p>
          <p className="mt-2 leading-relaxed">
            {jazzcashTransferMessage(paymentConfig.jazzcash.account_number)}
          </p>
          <p className="mt-3 font-mono text-base font-semibold tracking-wide">
            {paymentConfig.jazzcash.account_number}
          </p>
        </div>
      ) : null}

      {!loadingConfig && paymentConfig && selected?.id === "easypaisa" ? (
        <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3 text-sm text-[var(--portal-fg)]">
          <p className="font-semibold">EasyPaisa transfer</p>
          <p className="mt-2 leading-relaxed">
            {easypaisaTransferMessage(paymentConfig.easypaisa.iban)}
          </p>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--portal-muted)]">
            IBAN
          </p>
          <p className="mt-1 font-mono text-base font-semibold tracking-wide">
            {paymentConfig.easypaisa.iban}
          </p>
        </div>
      ) : null}

      {!loadingConfig && paymentConfig && selected?.id === "wise" ? (
        <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3 text-sm text-[var(--portal-fg)]">
          <p className="font-semibold">Wise payment</p>
          <p className="mt-2 leading-relaxed">
            Send the exact amount to this Wise payment ID / email, then enter the
            transaction ID below.
          </p>
          <p className="mt-3 font-mono text-base font-semibold">
            {paymentConfig.wise.payment_id}
          </p>
        </div>
      ) : null}

      {!loadingConfig && paymentConfig && selected?.id === "bank" ? (
        <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-3 text-sm text-[var(--portal-fg)]">
          <p className="font-semibold">Direct bank transfer</p>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-[var(--portal-muted)]">Bank</dt>
              <dd className="font-medium">{paymentConfig.bank.bank_name}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--portal-muted)]">Account title</dt>
              <dd className="font-medium">{paymentConfig.bank.account_title}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--portal-muted)]">Account number</dt>
              <dd className="font-mono font-medium">{paymentConfig.bank.account_number}</dd>
            </div>
            {paymentConfig.bank.iban ? (
              <div>
                <dt className="text-xs text-[var(--portal-muted)]">IBAN</dt>
                <dd className="font-mono font-medium">{paymentConfig.bank.iban}</dd>
              </div>
            ) : null}
            {paymentConfig.bank.swift ? (
              <div>
                <dt className="text-xs text-[var(--portal-muted)]">SWIFT</dt>
                <dd className="font-mono font-medium">{paymentConfig.bank.swift}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs text-[var(--portal-muted)]">Branch</dt>
              <dd className="font-medium">{paymentConfig.bank.branch}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--portal-muted)]">Currency</dt>
              <dd className="font-medium">{paymentConfig.bank.currency}</dd>
            </div>
          </dl>
          {paymentConfig.bank.instructions ? (
            <p className="mt-3 text-sm text-[var(--portal-muted)]">
              {paymentConfig.bank.instructions}
            </p>
          ) : (
            <p className="mt-3 text-xs text-[var(--portal-muted)]">
              After transfer, enter the bank transaction / reference ID and submit.
            </p>
          )}
        </div>
      ) : null}

      {!loadingConfig && paymentConfig && selected?.id === "paypal" ? (
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
            disabled={!paymentConfig}
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

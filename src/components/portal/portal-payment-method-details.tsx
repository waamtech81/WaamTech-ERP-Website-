"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PortalPaymentMethodIcon } from "@/components/portal/portal-payment-method-icon";
import { PortalSkeleton } from "@/components/portal/portal-ui";
import {
  easypaisaTransferMessage,
  jazzcashTransferMessage,
  type PortalPaymentMethod,
  type PortalPaymentMethodConfig,
} from "@/lib/portal/payment-methods";

type Props = {
  method: PortalPaymentMethod;
  transactionId: string;
  onTransactionIdChange: (value: string) => void;
  amount?: number | null;
  currency?: string | null;
  paymentConfig: PortalPaymentMethodConfig | null;
  loadingConfig?: boolean;
};

export function PortalPaymentMethodDetails({
  method,
  transactionId,
  onTransactionIdChange,
  paymentConfig,
  loadingConfig = false,
}: Props) {
  if (loadingConfig || !paymentConfig) {
    return (
      <div className="space-y-4">
        <PortalSkeleton rows={2} />
      </div>
    );
  }

  const config = paymentConfig;
  const bank = config.bank;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b border-[var(--portal-border)] pb-4">
        <PortalPaymentMethodIcon methodId={method.id} label={method.label} size="lg" />
        <div>
          <p className="font-semibold text-[var(--portal-fg)]">{method.label}</p>
          <p className="text-sm text-[var(--portal-muted)]">{method.shortHint}</p>
        </div>
      </div>

      {method.id === "jazzcash" ? (
        <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-4 text-sm">
          <p className="font-semibold text-[var(--portal-fg)]">JazzCash transfer</p>
          <p className="mt-2 leading-relaxed text-[var(--portal-muted)]">
            {jazzcashTransferMessage(config.jazzcash.account_number)}
          </p>
          <p className="mt-3 font-mono text-lg font-semibold tracking-wide text-[var(--portal-fg)]">
            {config.jazzcash.account_number}
          </p>
        </div>
      ) : null}

      {method.id === "easypaisa" ? (
        <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-4 text-sm">
          <p className="font-semibold text-[var(--portal-fg)]">EasyPaisa transfer</p>
          <p className="mt-2 leading-relaxed text-[var(--portal-muted)]">
            {easypaisaTransferMessage(config.easypaisa.iban)}
          </p>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--portal-muted)]">
            IBAN
          </p>
          <p className="mt-1 font-mono text-lg font-semibold tracking-wide text-[var(--portal-fg)]">
            {config.easypaisa.iban}
          </p>
        </div>
      ) : null}

      {method.id === "wise" ? (
        <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-4 text-sm">
          <p className="font-semibold text-[var(--portal-fg)]">Wise payment</p>
          <p className="mt-2 leading-relaxed text-[var(--portal-muted)]">
            Send the exact amount to this Wise payment ID / email, then enter the
            transaction ID below.
          </p>
          <p className="mt-3 font-mono text-lg font-semibold text-[var(--portal-fg)]">
            {config.wise.payment_id}
          </p>
        </div>
      ) : null}

      {method.id === "bank" ? (
        <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-4 text-sm">
          <p className="font-semibold text-[var(--portal-fg)]">Direct bank transfer</p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-[var(--portal-muted)]">Bank</dt>
              <dd className="font-medium">{bank.bank_name}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--portal-muted)]">Account title</dt>
              <dd className="font-medium">{bank.account_title}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--portal-muted)]">Account number</dt>
              <dd className="font-mono font-medium">{bank.account_number}</dd>
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
            <div>
              <dt className="text-xs text-[var(--portal-muted)]">Currency</dt>
              <dd className="font-medium">{bank.currency}</dd>
            </div>
          </dl>
          {bank.instructions ? (
            <p className="mt-3 text-sm text-[var(--portal-muted)]">{bank.instructions}</p>
          ) : null}
        </div>
      ) : null}

      {method.id === "paypal" ? (
        <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-4 text-sm text-[var(--portal-muted)]">
          Pay with your PayPal account or debit / credit card in the secure PayPal window
          below. You will not be charged until you confirm on PayPal.
        </div>
      ) : null}

      {method.id === "stripe" || method.id === "card" ? (
        <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-4 text-sm text-[var(--portal-muted)]">
          Card payments are processed securely through Stripe when enabled on your checkout
          session.
        </div>
      ) : null}

      {method.requiresTransactionId ? (
        <div className="space-y-2">
          <Label htmlFor="portal-payment-txn">Transaction / reference ID</Label>
          <Input
            id="portal-payment-txn"
            value={transactionId}
            onChange={(e) => onTransactionIdChange(e.target.value)}
            placeholder="Enter the ID from your payment receipt"
            autoComplete="off"
          />
        </div>
      ) : null}
    </div>
  );
}

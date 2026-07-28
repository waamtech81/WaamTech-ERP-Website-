"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PortalPaymentMethodIcon } from "@/components/portal/portal-payment-method-icon";
import {
  easypaisaTransferMessage,
  jazzcashTransferMessage,
  PK_MOBILE_WALLET_ACCOUNT,
  EASYPAYSA_IBAN,
  WISE_PAYMENT_ID,
  standardCharteredDetails,
  type PortalPaymentMethod,
} from "@/lib/portal/payment-methods";

type Props = {
  method: PortalPaymentMethod;
  transactionId: string;
  onTransactionIdChange: (value: string) => void;
  amount?: number | null;
  currency?: string | null;
};

export function PortalPaymentMethodDetails({
  method,
  transactionId,
  onTransactionIdChange,
}: Props) {
  const bank = standardCharteredDetails();

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
            {jazzcashTransferMessage()}
          </p>
          <p className="mt-3 font-mono text-lg font-semibold tracking-wide text-[var(--portal-fg)]">
            {PK_MOBILE_WALLET_ACCOUNT}
          </p>
        </div>
      ) : null}

      {method.id === "easypaisa" ? (
        <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-4 text-sm">
          <p className="font-semibold text-[var(--portal-fg)]">EasyPaisa transfer</p>
          <p className="mt-2 leading-relaxed text-[var(--portal-muted)]">
            {easypaisaTransferMessage()}
          </p>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--portal-muted)]">
            IBAN
          </p>
          <p className="mt-1 font-mono text-lg font-semibold tracking-wide text-[var(--portal-fg)]">
            {EASYPAYSA_IBAN}
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
            {WISE_PAYMENT_ID}
          </p>
        </div>
      ) : null}

      {method.id === "bank" ? (
        <div className="rounded-xl border border-[var(--portal-border)] bg-[var(--portal-soft)] px-4 py-4 text-sm">
          <p className="font-semibold text-[var(--portal-fg)]">Direct bank transfer</p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
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
          Card checkout is processed when Stripe is enabled on your billing profile. Submit
          payment confirmation after completing the card charge.
        </div>
      ) : null}

      {method.requiresTransactionId ? (
        <div className="space-y-2">
          <Label htmlFor="checkout-payment-txn-id">Transaction ID</Label>
          <Input
            id="checkout-payment-txn-id"
            value={transactionId}
            onChange={(e) => onTransactionIdChange(e.target.value.trimStart())}
            className="h-11 bg-white font-mono"
            placeholder="Paste transaction / reference ID after transfer"
            autoComplete="off"
          />
          <p className="text-xs text-[var(--portal-muted)]">
            Required after you send the payment. License Engine records this with your checkout.
          </p>
        </div>
      ) : null}
    </div>
  );
}

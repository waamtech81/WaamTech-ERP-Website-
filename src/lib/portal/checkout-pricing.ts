import type { BillingCheckoutSession } from "@/lib/commercial/client";

export type CheckoutPricingSnapshot = {
  currency?: string | null;
  base_currency?: string | null;
  grand_total?: number | null;
  subtotal?: number | null;
  discount_amount?: number | null;
  tax_amount?: number | null;
  tax_label?: string | null;
  discount_code?: string | null;
  billing_cycle?: string | null;
  monthly?: number | null;
  yearly?: number | null;
  lifetime?: number | null;
  frozen_at?: string | null;
};

export type ResolvedCheckoutCharge = {
  /** USD billing amount (Engine SSOT) used for display parity with Builder/Signup. */
  usdAmount: number | null;
  /** Currency the checkout session will charge (from Engine). */
  chargeCurrency: string;
  /** Frozen commercial snapshot when present on the checkout session. */
  pricingSummary: CheckoutPricingSnapshot | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function finiteNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Parse Engine checkout metadata.pricing_summary (or equivalent). */
export function parseCheckoutPricingSummary(
  metadata: unknown
): CheckoutPricingSnapshot | null {
  const meta = asRecord(metadata);
  if (!meta) return null;
  const raw = asRecord(meta.pricing_summary) ?? meta;
  if (!raw) return null;

  const grandTotal = finiteNumber(raw.grand_total);
  if (grandTotal == null || grandTotal <= 0) return null;

  return {
    currency: raw.currency != null ? String(raw.currency).toUpperCase().slice(0, 3) : null,
    base_currency:
      raw.base_currency != null
        ? String(raw.base_currency).toUpperCase().slice(0, 3)
        : null,
    grand_total: grandTotal,
    subtotal: finiteNumber(raw.subtotal),
    discount_amount: finiteNumber(raw.discount_amount),
    tax_amount: finiteNumber(raw.tax_amount),
    tax_label: raw.tax_label != null ? String(raw.tax_label) : null,
    discount_code: raw.discount_code != null ? String(raw.discount_code) : null,
    billing_cycle: raw.billing_cycle != null ? String(raw.billing_cycle) : null,
    monthly: finiteNumber(raw.monthly),
    yearly: finiteNumber(raw.yearly),
    lifetime: finiteNumber(raw.lifetime),
    frozen_at: raw.frozen_at != null ? String(raw.frozen_at) : null,
  };
}

function snapshotUsdAmount(snapshot: CheckoutPricingSnapshot | null): number | null {
  if (!snapshot?.grand_total || snapshot.grand_total <= 0) return null;
  const base = String(snapshot.base_currency || snapshot.currency || "USD")
    .toUpperCase()
    .slice(0, 3);
  if (base === "USD") return snapshot.grand_total;
  return null;
}

/**
 * Resolve the payable amount for checkout display and payment handoff.
 * Uses Engine checkout metadata.pricing_summary only — never browser storage.
 */
export function resolveCheckoutCharge(input: {
  checkout: BillingCheckoutSession | null | undefined;
}): ResolvedCheckoutCharge {
  const checkout = input.checkout;
  const pricingSummary = parseCheckoutPricingSummary(checkout?.metadata);

  const sessionCurrency = String(checkout?.currency || "USD")
    .toUpperCase()
    .slice(0, 3);
  const sessionAmount = finiteNumber(checkout?.amount);

  const snapshotUsd = snapshotUsdAmount(pricingSummary);
  if (snapshotUsd != null && snapshotUsd > 0) {
    return {
      usdAmount: snapshotUsd,
      chargeCurrency: "USD",
      pricingSummary,
    };
  }

  if (sessionAmount != null && sessionAmount > 0 && sessionCurrency === "USD") {
    return {
      usdAmount: sessionAmount,
      chargeCurrency: sessionCurrency,
      pricingSummary,
    };
  }

  return {
    usdAmount: sessionAmount,
    chargeCurrency: sessionCurrency,
    pricingSummary,
  };
}

export function billingCycleSuffix(cycle?: string | null): string {
  const raw = String(cycle || "").toLowerCase();
  if (raw === "lifetime") return "one-time";
  if (raw === "yearly") return "/ year";
  if (raw === "monthly") return "/ month";
  return "";
}

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
  /** USD billing amount (frozen commercial SSOT) for display + payment handoff. */
  usdAmount: number | null;
  /** Currency the checkout session will charge (from Engine session). */
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

function isoCurrency(value: unknown, fallback = "USD"): string {
  const raw = String(value || fallback)
    .trim()
    .toUpperCase()
    .slice(0, 3);
  return raw || fallback;
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
    currency: raw.currency != null ? isoCurrency(raw.currency) : null,
    base_currency:
      raw.base_currency != null ? isoCurrency(raw.base_currency) : null,
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

/**
 * Frozen Signup/Builder Grand Total as USD.
 * Never use incomplete monthly/yearly cycle fields when grand_total is the USD SSOT —
 * those fields can be module-only list prices and do not include seats/packs/tax.
 */
function frozenUsdGrandTotal(
  snapshot: CheckoutPricingSnapshot | null
): number | null {
  if (!snapshot?.grand_total || snapshot.grand_total <= 0) return null;

  const currency = isoCurrency(snapshot.currency, "USD");
  const base = isoCurrency(snapshot.base_currency || currency, "USD");

  // Website freezes Custom ERP as USD/USD. Engine preserves that as charge SSOT.
  if (base === "USD" || currency === "USD") {
    return snapshot.grand_total;
  }

  // Non-USD snapshot without USD base — cannot safely treat grand_total as USD.
  return null;
}

/**
 * Resolve the payable USD amount for checkout display and payment handoff.
 * Uses Engine checkout metadata.pricing_summary.grand_total only — never
 * recalculates Custom ERP pricing and never prefers incomplete cycle fields.
 */
export function resolveCheckoutCharge(input: {
  checkout: BillingCheckoutSession | null | undefined;
}): ResolvedCheckoutCharge {
  const checkout = input.checkout;
  const pricingSummary = parseCheckoutPricingSummary(checkout?.metadata);

  const sessionCurrency = isoCurrency(checkout?.currency, "USD");
  const sessionAmount = finiteNumber(checkout?.amount);

  const frozenUsd = frozenUsdGrandTotal(pricingSummary);
  if (frozenUsd != null && frozenUsd > 0) {
    return {
      usdAmount: frozenUsd,
      // Gateways (PayPal / card / Wise) always charge this frozen USD SSOT.
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
    usdAmount: sessionCurrency === "USD" ? sessionAmount : null,
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

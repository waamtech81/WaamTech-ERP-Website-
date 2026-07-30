import type { BillingCheckoutSession } from "@/lib/commercial/client";
import {
  convertUsd,
  type RateMap,
} from "@/lib/currency/format";
import {
  normalizeCurrency,
  type CurrencyCode,
} from "@/lib/currency/config";

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
  exchange_rate?: number | null;
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
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  }
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

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function isUsdSnapshot(snapshot: CheckoutPricingSnapshot): boolean {
  const currency = isoCurrency(snapshot.currency, "USD");
  const base = isoCurrency(snapshot.base_currency || currency, "USD");
  return base === "USD" || currency === "USD";
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
  const subtotal = finiteNumber(raw.subtotal);
  const discountAmount = finiteNumber(raw.discount_amount) ?? 0;
  const taxAmount = finiteNumber(raw.tax_amount) ?? 0;

  const fromParts =
    subtotal != null && subtotal > 0
      ? roundMoney(subtotal - discountAmount + taxAmount)
      : null;

  // Prefer the larger of grand_total vs reconstructed parts — never undercharge.
  const resolvedGrand =
    grandTotal != null && grandTotal > 0 && fromParts != null && fromParts > 0
      ? Math.max(grandTotal, fromParts)
      : grandTotal != null && grandTotal > 0
        ? grandTotal
        : fromParts;

  if (resolvedGrand == null || resolvedGrand <= 0) return null;

  return {
    currency: raw.currency != null ? isoCurrency(raw.currency) : null,
    base_currency:
      raw.base_currency != null ? isoCurrency(raw.base_currency) : null,
    grand_total: resolvedGrand,
    subtotal,
    discount_amount: finiteNumber(raw.discount_amount),
    tax_amount: finiteNumber(raw.tax_amount),
    tax_label: raw.tax_label != null ? String(raw.tax_label) : null,
    discount_code: raw.discount_code != null ? String(raw.discount_code) : null,
    billing_cycle: raw.billing_cycle != null ? String(raw.billing_cycle) : null,
    monthly: finiteNumber(raw.monthly),
    yearly: finiteNumber(raw.yearly),
    lifetime: finiteNumber(raw.lifetime),
    frozen_at: raw.frozen_at != null ? String(raw.frozen_at) : null,
    exchange_rate: finiteNumber(raw.exchange_rate),
  };
}

function cycleAmountFromSnapshot(
  snapshot: CheckoutPricingSnapshot
): number | null {
  const cycle = String(snapshot.billing_cycle || "").toLowerCase();
  if (cycle === "lifetime") return finiteNumber(snapshot.lifetime);
  if (cycle === "yearly") return finiteNumber(snapshot.yearly);
  if (cycle === "monthly") return finiteNumber(snapshot.monthly);
  return null;
}

/**
 * Frozen Signup/Builder Grand Total as USD.
 * Never use incomplete monthly/yearly cycle fields alone when grand_total exists.
 */
function frozenUsdCandidates(
  snapshot: CheckoutPricingSnapshot | null,
  sessionAmount: number | null,
  sessionCurrency: string
): number[] {
  const out: number[] = [];

  if (snapshot?.grand_total && snapshot.grand_total > 0 && isUsdSnapshot(snapshot)) {
    out.push(snapshot.grand_total);
  }

  if (snapshot && isUsdSnapshot(snapshot)) {
    const cycleAmt = cycleAmountFromSnapshot(snapshot);
    if (cycleAmt != null && cycleAmt > 0) out.push(cycleAmt);

    const fromParts =
      snapshot.subtotal != null && snapshot.subtotal > 0
        ? roundMoney(
            snapshot.subtotal -
              (snapshot.discount_amount ?? 0) +
              (snapshot.tax_amount ?? 0)
          )
        : null;
    if (fromParts != null && fromParts > 0) out.push(fromParts);
  }

  if (
    sessionAmount != null &&
    sessionAmount > 0 &&
    isoCurrency(sessionCurrency, "USD") === "USD"
  ) {
    out.push(sessionAmount);
  }

  return out;
}

/**
 * Resolve the payable USD amount for checkout display and payment handoff.
 * Uses the highest USD candidate so a stale/incomplete freeze cannot undercharge
 * vs the Custom ERP cart grand total that was already shown to the customer.
 */
export function resolveCheckoutCharge(input: {
  checkout: BillingCheckoutSession | null | undefined;
}): ResolvedCheckoutCharge {
  const checkout = input.checkout;
  const pricingSummary = parseCheckoutPricingSummary(checkout?.metadata);

  const sessionCurrency = isoCurrency(checkout?.currency, "USD");
  const sessionAmount = finiteNumber(checkout?.amount);

  const candidates = frozenUsdCandidates(
    pricingSummary,
    sessionAmount,
    sessionCurrency
  );
  if (candidates.length) {
    return {
      usdAmount: roundMoney(Math.max(...candidates)),
      chargeCurrency: "USD",
      pricingSummary,
    };
  }

  return {
    usdAmount: null,
    chargeCurrency: sessionCurrency,
    pricingSummary,
  };
}

/** Convert frozen USD checkout amount to the payment-method display currency (live rates). */
export function convertCheckoutUsdToDisplay(
  usdAmount: number | null | undefined,
  displayCurrency: CurrencyCode,
  rates?: RateMap
): number | null {
  if (usdAmount == null || !Number.isFinite(usdAmount) || usdAmount <= 0) {
    return null;
  }
  if (displayCurrency === "USD") return roundMoney(usdAmount);
  return roundMoney(convertUsd(usdAmount, displayCurrency, rates));
}

export function billingCycleSuffix(cycle?: string | null): string {
  const raw = String(cycle || "").toLowerCase();
  if (raw === "lifetime") return "one-time";
  if (raw === "yearly") return "/ year";
  if (raw === "monthly") return "/ month";
  return "";
}

export function normalizeCheckoutDisplayCurrency(code?: string | null): CurrencyCode {
  return normalizeCurrency(code);
}

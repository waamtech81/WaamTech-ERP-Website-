/**
 * Portal BFF helper — Custom ERP upgrade payable amount from License Engine quotes.
 * Mirrors Engine `upgradeForCustomer` delta: max(0, newQuote.grand_total − currentQuote.grand_total).
 * Never invents catalog prices; both grands come from RPIE `/custom-packages/quote`.
 */
import { fetchCustomPackageQuote } from "@/lib/commercial/client";
import {
  buildCustomPackageQuotePayload,
  engineMoneyFromQuote,
} from "@/lib/commercial/custom-package-quote";
import type {
  BillingCycle,
  CustomPackageQuotePayload,
  CustomPackageQuoteResult,
} from "@/lib/commercial/types";
import {
  normalizePortalCommercialSnapshot,
  resolvePurchasedLimits,
  type PortalCommercialSnapshot,
} from "@/lib/portal/commercial-snapshot";

export type CustomUpgradeQuoteRequest = {
  product_slug?: string;
  billing_cycle: BillingCycle;
  selected_modules: string[];
  selected_feature_packs?: string[];
  user_limit?: number | null;
  company_limit?: number | null;
  branch_limit?: number | null;
  warehouse_limit?: number | null;
  discount_code?: string | null;
};

export type CustomUpgradeQuoteResult = {
  /** Engine payable upgrade amount (same formula as checkout/invoice). */
  amount: number;
  currency: string;
  /** Proposed-configuration Engine quote (RPIE SSOT for package lines). */
  quote: CustomPackageQuoteResult;
  /** Current-package Engine quote used as baseline (null when none). */
  current_quote: CustomPackageQuoteResult | null;
  pricing: CustomPackageQuoteResult["pricing"];
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function positiveSeat(value: number | null | undefined, floor = 1): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < floor) {
    return floor;
  }
  return Math.floor(value);
}

function grandFromQuote(quote: CustomPackageQuoteResult | null | undefined): number | null {
  if (!quote?.pricing) return null;
  const money = engineMoneyFromQuote(quote);
  const n = Number(money?.grand_total ?? quote.pricing.grand_total);
  return Number.isFinite(n) ? roundMoney(n) : null;
}

function codesFromSnapshot(snap: PortalCommercialSnapshot | null): {
  modules: string[];
  packs: string[];
} {
  if (!snap) return { modules: [], packs: [] };
  const modules =
    (snap.selected_modules?.length ? snap.selected_modules : null) ||
    snap.effective_modules ||
    snap.modules ||
    [];
  const packs = snap.feature_packs || [];
  return {
    modules: modules.map(String).filter(Boolean),
    packs: packs.map(String).filter(Boolean),
  };
}

export async function quoteCustomErpUpgradePayable(input: {
  company: Record<string, unknown> | null;
  body: CustomUpgradeQuoteRequest;
}): Promise<{ ok: true; data: CustomUpgradeQuoteResult } | { ok: false; status: number; message: string }> {
  const cycle = input.body.billing_cycle || "monthly";
  const productSlug = input.body.product_slug || "waamto-erp";
  const selectedModules = (input.body.selected_modules || []).filter(Boolean);
  if (!selectedModules.length) {
    return { ok: false, status: 400, message: "At least one module is required." };
  }

  const proposedPayload: CustomPackageQuotePayload = buildCustomPackageQuotePayload({
    product_slug: productSlug,
    billing_cycle: cycle,
    selected_module_codes: selectedModules,
    selected_feature_packs: input.body.selected_feature_packs || [],
    discount_code: input.body.discount_code || null,
    user_limit: positiveSeat(input.body.user_limit),
    company_limit: positiveSeat(input.body.company_limit),
    branch_limit: positiveSeat(input.body.branch_limit),
    warehouse_limit: positiveSeat(input.body.warehouse_limit),
  });

  const proposed = await fetchCustomPackageQuote(proposedPayload);
  if (!proposed.ok || !proposed.data?.pricing) {
    return {
      ok: false,
      status: proposed.status || 502,
      message: proposed.message || "Unable to quote proposed Custom ERP package.",
    };
  }

  const newGrand = grandFromQuote(proposed.data);
  if (newGrand == null) {
    return {
      ok: false,
      status: 502,
      message: "License Engine quote missing grand_total.",
    };
  }

  const snap = normalizePortalCommercialSnapshot(input.company);
  const currentCodes = codesFromSnapshot(snap);
  const currentLimits = resolvePurchasedLimits(snap, null);

  let currentQuote: CustomPackageQuoteResult | null = null;
  let amount = newGrand;

  if (currentCodes.modules.length > 0) {
    const currentPayload = buildCustomPackageQuotePayload({
      product_slug: productSlug,
      billing_cycle: cycle,
      selected_module_codes: currentCodes.modules,
      selected_feature_packs: currentCodes.packs,
      user_limit: positiveSeat(currentLimits.users),
      company_limit: positiveSeat(currentLimits.companies),
      branch_limit: positiveSeat(currentLimits.branches),
      warehouse_limit: positiveSeat(currentLimits.warehouses),
    });
    const current = await fetchCustomPackageQuote(currentPayload);
    if (current.ok && current.data?.pricing) {
      currentQuote = current.data;
      const oldGrand = grandFromQuote(current.data);
      if (oldGrand != null) {
        // Same delta rule as License Engine upgradeForCustomer.
        amount = roundMoney(Math.max(0, newGrand - oldGrand));
      }
    }
  }

  return {
    ok: true,
    data: {
      amount,
      currency: String(proposed.data.pricing.currency || "USD"),
      quote: proposed.data,
      current_quote: currentQuote,
      pricing: proposed.data.pricing,
    },
  };
}

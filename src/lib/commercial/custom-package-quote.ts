/**
 * License Engine custom-package quote — presentation helpers only.
 * Never invent prices; normalize Engine payloads for UI/handoff.
 */
import type {
  BillingCycle,
  CustomPackageBundleOffer,
  CustomPackageQuotePayload,
  CustomPackageQuotePricing,
  CustomPackageQuoteResult,
  CustomPackageQuoteSeatLine,
} from "@/lib/commercial/types";
import { moneyFromEnginePricing } from "@/lib/signup/custom-package";

const CLOSE_MATCH_THRESHOLD = Number(
  process.env.NEXT_PUBLIC_BUNDLE_MATCH_THRESHOLD || 70
);

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function str(value: unknown): string | null {
  const s = String(value ?? "").trim();
  return s || null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function normalizeSeatLines(raw: unknown): CustomPackageQuoteSeatLine[] {
  if (!raw || typeof raw !== "object") return [];
  const row = raw as Record<string, unknown>;
  const lines = Array.isArray(row.lines) ? row.lines : [];
  return lines
    .map((line) => {
      const item = asRecord(line);
      if (!item) return null;
      const kind = str(item.kind);
      if (!kind) return null;
      return {
        kind,
        included: num(item.included),
        requested: num(item.requested),
        extra_qty: num(item.extra_qty),
        unit_price: num(item.unit_price),
        amount: num(item.amount),
      };
    })
    .filter(Boolean) as CustomPackageQuoteSeatLine[];
}

function normalizePricing(raw: unknown): CustomPackageQuotePricing | null {
  const row = asRecord(raw);
  if (!row) return null;
  const seat = asRecord(row.seat_overage);
  const additional = asRecord(row.additional_charges);
  return {
    currency: str(row.currency) || "USD",
    monthly_total: num(row.monthly_total),
    yearly_total: num(row.yearly_total),
    lifetime_total: num(row.lifetime_total),
    module_count: num(row.module_count),
    selected_billing_cycle: (str(row.selected_billing_cycle || row.billing_cycle) ||
      "monthly") as BillingCycle,
    selected_total: num(row.selected_total ?? row.subtotal),
    subtotal: num(row.subtotal ?? row.selected_total),
    modules_subtotal:
      row.modules_subtotal == null ? undefined : num(row.modules_subtotal),
    feature_pack_total: num(row.feature_pack_total),
    seat_overage_total: num(row.seat_overage_total ?? seat?.total),
    addons_total: num(row.addons_total),
    discount_code: str(row.discount_code),
    discount_id: str(row.discount_id),
    discount_type: (str(row.discount_type) as CustomPackageQuotePricing["discount_type"]) || null,
    discount_value: row.discount_value == null ? null : num(row.discount_value),
    discount_amount: num(row.discount_amount ?? row.discount),
    tax_id: str(row.tax_id),
    tax_amount: num(row.tax_amount),
    taxes: Array.isArray(row.taxes)
      ? row.taxes.map((t) => {
          const tax = asRecord(t) || {};
          return {
            tax_id: str(tax.tax_id) || "",
            code: str(tax.code) || "",
            name: str(tax.name) || "Tax",
            rate: num(tax.rate),
            mode: (str(tax.mode) as "inclusive" | "exclusive") || "exclusive",
            amount: num(tax.amount),
          };
        })
      : [],
    grand_total: num(row.grand_total ?? row.final_price),
    seat_overage: {
      lines: normalizeSeatLines(row.seat_overage),
      total: num(seat?.total ?? row.seat_overage_total),
    },
    additional_charges: additional
      ? {
          users: asRecord(additional.users)
            ? {
                qty: num(asRecord(additional.users)?.qty),
                unit_price: num(asRecord(additional.users)?.unit_price),
                amount: num(asRecord(additional.users)?.amount),
              }
            : undefined,
          companies: asRecord(additional.companies)
            ? {
                qty: num(asRecord(additional.companies)?.qty),
                unit_price: num(asRecord(additional.companies)?.unit_price),
                amount: num(asRecord(additional.companies)?.amount),
              }
            : undefined,
          branches: asRecord(additional.branches)
            ? {
                qty: num(asRecord(additional.branches)?.qty),
                unit_price: num(asRecord(additional.branches)?.unit_price),
                amount: num(asRecord(additional.branches)?.amount),
              }
            : undefined,
          warehouses: asRecord(additional.warehouses)
            ? {
                qty: num(asRecord(additional.warehouses)?.qty),
                unit_price: num(asRecord(additional.warehouses)?.unit_price),
                amount: num(asRecord(additional.warehouses)?.amount),
              }
            : undefined,
        }
      : undefined,
  };
}

function normalizeBundleOffer(
  raw: unknown,
  root: Record<string, unknown>
): CustomPackageBundleOffer {
  const nested = asRecord(raw) || {};
  const matched =
    asRecord(nested.matched_plan) ||
    asRecord(root.matched_plan) ||
    null;
  const matchedId =
    str(nested.matched_plan_id) ||
    str(root.matched_plan_id) ||
    str(matched?.id) ||
    null;
  const matchedName =
    str(nested.matched_plan_name) ||
    str(root.matched_plan_name) ||
    str(matched?.name) ||
    null;
  const matchedSlug = str(matched?.slug) || str(nested.matched_plan_slug) || null;
  const matchScore = num(nested.match_score ?? root.match_score);
  const show =
    Boolean(nested.show_bundle_offer ?? root.show_bundle_offer) && Boolean(matchedId);
  const close =
    Boolean(nested.close_match ?? root.close_match) ||
    (!show && matchScore >= CLOSE_MATCH_THRESHOLD && Boolean(matchedId));

  return {
    show_bundle_offer: show,
    close_match: close,
    exact_match: Boolean(nested.exact_match ?? root.exact_match),
    match_score: matchScore,
    matched_plan_id: matchedId,
    matched_plan_name: matchedName,
    matched_plan_slug: matchedSlug,
    matched_plan_price: num(nested.matched_plan_price ?? root.matched_plan_price),
    custom_price: num(nested.custom_price ?? root.custom_price),
    bundle_savings: num(nested.bundle_savings ?? root.bundle_savings),
    bundle_percentage: num(nested.bundle_percentage ?? root.bundle_percentage),
    continue_custom: nested.continue_custom !== false && root.continue_custom !== false,
    switch_to_plan: Boolean(nested.switch_to_plan ?? root.switch_to_plan) || show,
    message: str(nested.message ?? root.recommendation) || null,
    match_reason: str(nested.match_reason),
    enable_savings_banner: Boolean(
      nested.enable_savings_banner ?? root.enable_savings_banner ?? true
    ),
    included_modules: Array.isArray(matched?.modules)
      ? (matched!.modules as unknown[])
          .map((m) => {
            if (typeof m === "string") return m;
            const row = asRecord(m);
            return str(row?.name) || str(row?.code) || "";
          })
          .filter(Boolean)
      : Array.isArray(matched?.module_names)
        ? (matched!.module_names as unknown[]).map((n) => String(n)).filter(Boolean)
        : [],
    included_feature_packs: Array.isArray(matched?.feature_packs)
      ? (matched!.feature_packs as unknown[])
          .map((p) => {
            if (typeof p === "string") return p;
            const row = asRecord(p);
            return str(row?.name) || str(row?.code) || "";
          })
          .filter(Boolean)
      : [],
    included_limits: (() => {
      const limits =
        asRecord(matched?.included_limits) ||
        asRecord(matched?.limits) ||
        asRecord(nested.included_limits) ||
        null;
      if (!limits) return null;
      return {
        users: num(limits.users ?? limits.max_users),
        companies: num(limits.companies ?? limits.max_companies),
        branches: num(limits.branches ?? limits.max_branches),
        warehouses: num(limits.warehouses ?? limits.max_warehouses),
      };
    })(),
    matched_plan: matched,
  };
}

/** Normalize any Engine quote envelope into the Website quote shape. */
export function normalizeCustomPackageQuote(
  raw: unknown
): CustomPackageQuoteResult | null {
  const root = asRecord(raw);
  if (!root) return null;
  const pricing = normalizePricing(root.pricing);
  if (!pricing) return null;

  const selected = Array.isArray(root.selected_modules)
    ? root.selected_modules.map((c) => String(c))
    : Array.isArray(root.effective_modules)
      ? (root.effective_modules as unknown[]).map((c) => String(c))
      : [];
  const deps = Array.isArray(root.dependency_modules)
    ? root.dependency_modules.map((c) => String(c))
    : Array.isArray(root.required_modules)
      ? (root.required_modules as unknown[]).map((c) => String(c))
      : [];
  const recommended = Array.isArray(root.recommended_modules)
    ? root.recommended_modules.map((c) => String(c))
    : [];

  const included =
    asRecord(root.included_limits) ||
    asRecord(root.purchased_limits) ||
    asRecord(root.limits);

  return {
    package_type: "custom",
    selected_modules: selected,
    dependency_modules: deps,
    recommended_modules: recommended,
    effective_modules: Array.isArray(root.effective_modules)
      ? (root.effective_modules as unknown[]).map((c) => String(c))
      : Array.from(new Set([...selected, ...deps])),
    selected_feature_packs: Array.isArray(root.selected_feature_packs)
      ? (root.selected_feature_packs as unknown[]).map((c) => String(c))
      : [],
    pricing,
    included_limits: included
      ? {
          users: num(included.users ?? included.max_users),
          companies: num(included.companies ?? included.max_companies),
          branches: num(included.branches ?? included.max_branches),
          warehouses: num(included.warehouses ?? included.max_warehouses),
        }
      : null,
    show_bundle_offer: Boolean(root.show_bundle_offer),
    match_score: num(root.match_score),
    close_match: Boolean(root.close_match),
    exact_match: Boolean(root.exact_match),
    matched_plan_id: str(root.matched_plan_id),
    matched_plan_name: str(root.matched_plan_name),
    matched_plan_price:
      root.matched_plan_price == null ? null : num(root.matched_plan_price),
    custom_price: root.custom_price == null ? null : num(root.custom_price),
    bundle_savings: num(root.bundle_savings),
    bundle_offer: normalizeBundleOffer(root.bundle_offer, root),
  };
}

export function buildCustomPackageQuotePayload(input: {
  product_slug?: string;
  billing_cycle: BillingCycle;
  selected_module_codes: string[];
  discount_code?: string | null;
  industry_id?: string | null;
  category_id?: string | null;
  selected_feature_packs?: string[];
  user_limit?: number;
  company_limit?: number;
  branch_limit?: number;
  warehouse_limit?: number;
}): CustomPackageQuotePayload {
  return {
    product_slug: input.product_slug || "waamto-erp",
    billing_cycle: input.billing_cycle,
    selected_module_codes: [...input.selected_module_codes],
    discount_code: input.discount_code || null,
    industry_id: input.industry_id || null,
    category_id: input.category_id || null,
    selected_feature_packs: input.selected_feature_packs?.length
      ? [...input.selected_feature_packs]
      : [],
    user_limit: input.user_limit,
    company_limit: input.company_limit,
    branch_limit: input.branch_limit,
    warehouse_limit: input.warehouse_limit,
  };
}

export function engineMoneyFromQuote(quote: CustomPackageQuoteResult | null) {
  return quote?.pricing ? moneyFromEnginePricing(quote.pricing) : null;
}

export function quoteCycleTotals(quote: CustomPackageQuoteResult | null): {
  monthly: number;
  yearly: number;
  lifetime: number;
} | null {
  if (!quote?.pricing) return null;
  return {
    monthly: num(quote.pricing.monthly_total),
    yearly: num(quote.pricing.yearly_total),
    lifetime: num(quote.pricing.lifetime_total),
  };
}

export function shouldShowBundleOffer(quote: CustomPackageQuoteResult | null): boolean {
  return Boolean(quote?.bundle_offer?.show_bundle_offer && quote.bundle_offer.matched_plan_id);
}

export function shouldShowCloseMatch(quote: CustomPackageQuoteResult | null): boolean {
  if (!quote?.bundle_offer) return false;
  if (shouldShowBundleOffer(quote)) return false;
  return Boolean(quote.bundle_offer.close_match && quote.bundle_offer.matched_plan_id);
}

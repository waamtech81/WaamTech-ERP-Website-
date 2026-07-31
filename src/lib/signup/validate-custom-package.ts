import {
  fetchCustomPackageQuote,
  fetchPublicModules,
  fetchPublicProducts,
} from "@/lib/commercial/client";
import {
  normalizeCatalogModules,
  resolveRecommendedModules,
  resolveRequiredDependencies,
} from "@/lib/commercial/module-builder";
import {
  validateCustomErpBillingCycle,
} from "@/lib/commercial/custom-erp-billing";
import type { BillingCycle, CatalogProduct } from "@/lib/commercial/types";
import {
  buildCustomErpPackagePayload,
  couponAppliedInPricing,
  moneyFromEnginePricing,
  type CustomErpFeaturePackSelection,
  type CustomErpPackagePayload,
  type CustomErpTenantLimits,
} from "@/lib/signup/custom-package";

function clampPositiveInt(value: unknown, fallback: number, max = 10_000): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}

function sanitizeFeaturePacks(raw: unknown): CustomErpFeaturePackSelection[] {
  if (!Array.isArray(raw)) return [];
  const out: CustomErpFeaturePackSelection[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const code = String(row.code || "")
      .trim()
      .slice(0, 80);
    const name = String(row.name || code)
      .trim()
      .slice(0, 120);
    if (!code) continue;
    out.push({
      code,
      name: name || code,
      required: Boolean(row.required),
      monthly_price: Number(row.monthly_price) || 0,
      yearly_price: Number(row.yearly_price) || 0,
      lifetime_price: Number(row.lifetime_price) || 0,
    });
  }
  return out;
}

function sanitizeTenantLimits(raw: unknown): CustomErpTenantLimits | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  return {
    users: clampPositiveInt(row.users, 5),
    companies: clampPositiveInt(row.companies, 1),
    branches: clampPositiveInt(row.branches, 1),
    warehouses: clampPositiveInt(row.warehouses, 1),
  };
}

export type ValidatedCustomPackage = {
  product: CatalogProduct;
  package: CustomErpPackagePayload;
  effective_modules: string[];
};

export type CustomPackageValidationResult =
  | { ok: true; data: ValidatedCustomPackage }
  | { ok: false; message: string; status: number; code: string };

/**
 * Re-validate custom ERP modules against License Engine catalog + live quote.
 * Never trusts client prices — recomputes deps + totals server-side (coupon/tax via quote).
 */
export async function validateSignupCustomPackage(input: {
  selected_modules: string[];
  billing_cycle: BillingCycle;
  product_slug?: string;
  recommended_modules?: string[];
  discount_code?: string | null;
  industry_id?: string | null;
  industry_name?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  feature_packs?: unknown;
  tenant_limits?: unknown;
}): Promise<CustomPackageValidationResult> {
  const selected = Array.from(
    new Set(
      (input.selected_modules || [])
        .map((c) => String(c || "").trim())
        .filter(Boolean)
    )
  );
  const cycle = input.billing_cycle;
  const productSlug = String(input.product_slug || "waamto-erp").trim() || "waamto-erp";
  const discountCode = String(input.discount_code || "")
    .trim()
    .toUpperCase() || null;

  if (!selected.length) {
    return {
      ok: false,
      status: 400,
      code: "CUSTOM_MODULES_REQUIRED",
      message: "Select at least one module for your Build your own custom ERP package.",
    };
  }

  const cycleCheck = validateCustomErpBillingCycle(cycle);
  if (!cycleCheck.ok) {
    return {
      ok: false,
      status: 400,
      code: cycleCheck.code,
      message: cycleCheck.message,
    };
  }
  const billingCycle = cycleCheck.cycle;

  const [products, modulesPrefetch] = await Promise.all([
    fetchPublicProducts(),
    fetchPublicModules(productSlug),
  ]);
  if (!products.ok && !products.data.length) {
    return {
      ok: false,
      status: products.status || 502,
      code: "PRODUCT_LOOKUP_FAILED",
      message: products.message || "Could not validate product.",
    };
  }

  const product =
    products.data.find((p) => p.slug === productSlug) ||
    products.data.find((p) => p.slug === "waamto-erp") ||
    null;
  if (!product) {
    return {
      ok: false,
      status: 410,
      code: "PRODUCT_DISABLED",
      message: "This product is not available for signup.",
    };
  }

  let modulesResult = modulesPrefetch;
  if (product.slug !== productSlug) {
    modulesResult = await fetchPublicModules(product.slug);
  }
  if (!modulesResult.ok && !modulesResult.data.length) {
    return {
      ok: false,
      status: modulesResult.status || 502,
      code: "MODULE_LOOKUP_FAILED",
      message: modulesResult.message || "Could not validate modules.",
    };
  }

  const modules = normalizeCatalogModules(modulesResult.data);
  const known = new Set(modules.map((m) => m.code));
  const unknown = selected.filter((c) => !known.has(c));
  if (unknown.length) {
    return {
      ok: false,
      status: 400,
      code: "MODULE_INVALID",
      message: `Unknown module(s): ${unknown.slice(0, 5).join(", ")}`,
    };
  }

  const dependency_modules = resolveRequiredDependencies(selected, modules);
  const recommended_modules = resolveRecommendedModules(
    selected,
    modules,
    dependency_modules
  );
  const effective = Array.from(new Set([...selected, ...dependency_modules]));
  const labels = Object.fromEntries(modules.map((m) => [m.code, m.name]));
  const featurePacks = sanitizeFeaturePacks(input.feature_packs);
  const tenantLimits = sanitizeTenantLimits(input.tenant_limits);

  const quote = await fetchCustomPackageQuote({
    product_slug: product.slug,
    billing_cycle: billingCycle,
    selected_module_codes: effective,
    discount_code: discountCode,
    industry_id: input.industry_id || null,
    category_id: input.category_id || null,
    selected_feature_packs: featurePacks.map((p) => p.code),
    user_limit: tenantLimits?.users,
    company_limit: tenantLimits?.companies,
    branch_limit: tenantLimits?.branches,
    warehouse_limit: tenantLimits?.warehouses,
  });

  if (!quote.ok || !quote.data?.pricing) {
    return {
      ok: false,
      status: quote.status >= 400 ? quote.status : 502,
      code: discountCode ? "COUPON_INVALID" : "QUOTE_UNAVAILABLE",
      message:
        quote.message ||
        (discountCode
          ? "This coupon is invalid or not applicable."
          : "Live pricing is unavailable. Please retry."),
    };
  }

  if (discountCode && !couponAppliedInPricing(quote.data.pricing)) {
    return {
      ok: false,
      status: 400,
      code: "COUPON_INVALID",
      message: "This coupon is invalid or not applicable.",
    };
  }

  const money = moneyFromEnginePricing(quote.data.pricing);
  const monthly_price = Number(quote.data.pricing.monthly_total) || 0;
  const yearly_price = Number(quote.data.pricing.yearly_total) || 0;
  const lifetime_price = Number(quote.data.pricing.lifetime_total) || 0;

  return {
    ok: true,
    data: {
      product,
      effective_modules: effective,
      package: buildCustomErpPackagePayload({
        selected_modules: selected,
        dependency_modules,
        recommended_modules:
          Array.isArray(input.recommended_modules) && input.recommended_modules.length
            ? input.recommended_modules.filter((c) => known.has(c))
            : recommended_modules,
        billing_cycle: billingCycle,
        monthly_price,
        yearly_price,
        lifetime_price,
        module_labels: labels,
        product_slug: product.slug,
        discount_code: money?.discount_code || discountCode,
        money,
        industry_id: input.industry_id || null,
        industry_name: input.industry_name || null,
        category_id: input.category_id || null,
        category_name: input.category_name || null,
        feature_packs: featurePacks,
        tenant_limits: tenantLimits,
        tenant_addon_total: Number(quote.data.pricing.seat_overage_total) || 0,
        feature_pack_total: Number(quote.data.pricing.feature_pack_total) || 0,
      }),
    },
  };
}

import { ApiErrorCode, PUBLIC_MESSAGES } from "@/lib/api/codes";
import { logApiError } from "@/lib/api/logger";
import { apiFail, apiSuccess } from "@/lib/api/response";
import {
  fetchPublicBusinessCategories,
  fetchPublicBusinessProfiles,
  fetchPublicBusinessTypes,
  fetchPublicCurrencies,
  fetchPublicIndustries,
  fetchPublicIndustryDetail,
  fetchPublicBuilderRecommendations,
  fetchPublicModules,
  fetchPublicPlans,
  fetchPublicPricing,
  fetchPublicProducts,
  fetchCustomPackageQuote,
  fetchPublicCatalogBundle,
  fetchPublicCommercialOverview,
  fetchPublicPlanComparison,
  submitCustomPackageRequest,
} from "@/lib/commercial/client";
import {
  COMMERCIAL_CATALOG_CACHE_TAG,
  computeCatalogRevision,
  isEngineComparisonUsable,
} from "@/lib/commercial/catalog-revision";
import { CATALOG_REVALIDATE_SECRET } from "@/lib/commercial/config";
import { normalizeCatalogModules } from "@/lib/commercial/module-builder";
import { validateCustomErpBillingCycle } from "@/lib/commercial/custom-erp-billing";
import type {
  CustomPackageQuotePayload,
  CustomPackageRequestPayload,
} from "@/lib/commercial/types";
import {
  cardPlans,
  enterprisePlan,
  mapCatalogPlanToPricingPlan,
  mapCatalogProductToUi,
  mapPricingRowsToPlans,
  popularPlans,
  publicMarketingPlans,
  sortPlansByTier,
} from "@/lib/commercial/mappers";

function jsonOk(data: unknown, init?: { status?: number; cacheSeconds?: number }) {
  const cacheSeconds = init?.cacheSeconds ?? 300;
  const res = apiSuccess("OK", {
    data,
    status: init?.status ?? 200,
  });
  res.headers.set(
    "Cache-Control",
    `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 5}`
  );
  return res;
}

function jsonFreshOk(data: unknown) {
  const res = apiSuccess("OK", { data, status: 200 });
  res.headers.set("Cache-Control", "private, no-store, max-age=0");
  return res;
}

function jsonFail(message: string, status = 502) {
  return apiFail(message || PUBLIC_MESSAGES[ApiErrorCode.SERVICE_UNAVAILABLE], {
    status,
    code:
      status >= 500
        ? ApiErrorCode.INTERNAL_ERROR
        : status === 404
          ? ApiErrorCode.NOT_FOUND
          : status === 400 || status === 422
            ? ApiErrorCode.VALIDATION_ERROR
            : status === 401
              ? ApiErrorCode.UNAUTHORIZED
              : status === 403
                ? ApiErrorCode.FORBIDDEN
                : status === 409
                  ? ApiErrorCode.CONFLICT
                  : ApiErrorCode.SERVICE_UNAVAILABLE,
    data: [],
  });
}

/** Last successful *fully healthy* catalog payload — soft-serve only on Engine outage. */
const catalogLastGood = new Map<string, unknown>();

export function clearCatalogLastGood(product?: string) {
  if (product?.trim()) {
    catalogLastGood.delete(product.trim());
    catalogLastGood.delete("__default__");
    return;
  }
  catalogLastGood.clear();
}

function buildCatalogPayload(
  bundle: Awaited<ReturnType<typeof fetchPublicCatalogBundle>>
) {
  const comparisonUsable = isEngineComparisonUsable(bundle.comparison);
  const marketingCatalogPlans = publicMarketingPlans(bundle.plans);
  const marketingPricingRows = publicMarketingPlans(bundle.pricing);
  const mappedPlans =
    marketingPricingRows.length > 0
      ? mapPricingRowsToPlans(
          marketingPricingRows,
          marketingCatalogPlans,
          comparisonUsable ? bundle.comparison : null
        )
      : sortPlansByTier(marketingCatalogPlans).map((p) => {
          const row = comparisonUsable
            ? bundle.comparison?.comparison.find((c) => c.plan.id === p.id)
            : undefined;
          return mapCatalogPlanToPricingPlan(p, {
            limits: row?.limits,
            featureGroups: row?.feature_groups,
            modules: (row?.modules || [])
              .map((m) => m.name || m.code || "")
              .filter(Boolean),
          });
        });
  const pricingPlans = publicMarketingPlans(mappedPlans);
  const featuredProducts = bundle.products.slice(0, 6).map(mapCatalogProductToUi);
  const popular = popularPlans(pricingPlans, 3);
  const enterprise = enterprisePlan(pricingPlans) || null;
  const revision = computeCatalogRevision({
    plans: bundle.plans,
    pricing: bundle.pricing,
    comparison: bundle.comparison,
  });

  return {
    products: bundle.products,
    plans: bundle.plans,
    pricing: bundle.pricing,
    industries: bundle.industries,
    comparison: comparisonUsable ? bundle.comparison : null,
    productSlug: bundle.productSlug,
    pricingPlans,
    cardPlans: cardPlans(pricingPlans),
    featuredProducts,
    popularPlans: popular,
    enterprise,
    revision,
    meta: {
      ...bundle.meta,
      comparisonOk: Boolean(bundle.meta?.comparisonOk),
      comparisonAvailable: comparisonUsable && Boolean(bundle.meta?.comparisonOk),
      revision,
    },
  };
}

export async function GET_products() {
  const result = await fetchPublicProducts();
  if (!result.ok && result.data.length === 0) return jsonFail(result.message, result.status);
  return jsonOk(result.data);
}

export async function GET_plans(req: Request) {
  const product = new URL(req.url).searchParams.get("product") || undefined;
  const result = await fetchPublicPlans(product);
  if (!result.ok && result.data.length === 0) return jsonFail(result.message, result.status);
  return jsonOk(sortPlansByTier(result.data));
}

export async function GET_pricing(req: Request) {
  const product = new URL(req.url).searchParams.get("product") || undefined;
  const result = await fetchPublicPricing(product);
  if (!result.ok && result.data.length === 0) return jsonFail(result.message, result.status);
  return jsonOk(result.data);
}

export async function GET_comparison(req: Request) {
  const url = new URL(req.url);
  const product = url.searchParams.get("product") || undefined;
  const idsRaw = url.searchParams.get("ids");
  const ids = idsRaw
    ? idsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;
  const result = await fetchPublicPlanComparison({ product, ids });
  if (!result.ok && result.data.comparison.length === 0) {
    return jsonFail(
      result.message || "Plan comparison is temporarily unavailable.",
      result.status || 502
    );
  }
  if (!isEngineComparisonUsable(result.data)) {
    return jsonFail("Plan comparison is temporarily unavailable.", 503);
  }
  return jsonOk(result.data);
}

export async function GET_currencies() {
  const result = await fetchPublicCurrencies();
  if (!result.ok && result.data.length === 0) return jsonFail(result.message, result.status);
  return jsonOk(result.data, { cacheSeconds: 30 });
}

export async function GET_industries() {
  const result = await fetchPublicIndustries();
  if (!result.ok && result.data.length === 0) return jsonFail(result.message, result.status);
  return jsonOk(result.data);
}

export async function GET_industryDetail(_req: Request, idOrSlug: string) {
  const result = await fetchPublicIndustryDetail(idOrSlug);
  if (!result.ok || !result.data) {
    return jsonFail(result.message || "Industry not found.", result.status || 404);
  }
  return jsonOk(result.data);
}

export async function GET_modules(req: Request) {
  const product = new URL(req.url).searchParams.get("product") || undefined;
  const result = await fetchPublicModules(product || undefined);
  if (!result.ok && result.data.length === 0) return jsonFail(result.message, result.status);
  return jsonOk(normalizeCatalogModules(result.data));
}

export async function POST_customPackageRequest(req: Request) {
  const body = (await req.json().catch(() => ({}))) as CustomPackageRequestPayload;
  const result = await submitCustomPackageRequest(body);
  if (!result.ok || !result.data) {
    return apiFail(result.message || "Could not submit custom package request.", {
      status: result.status >= 400 ? result.status : 502,
      code:
        result.status === 400
          ? ApiErrorCode.VALIDATION_ERROR
          : result.status === 429
            ? ApiErrorCode.RATE_LIMITED
            : ApiErrorCode.SERVICE_UNAVAILABLE,
    });
  }
  return apiSuccess(result.data.message || "Custom package request received.", {
    data: result.data,
    status: 201,
  });
}

export async function POST_customPackageQuote(req: Request) {
  const body = (await req.json().catch(() => ({}))) as CustomPackageQuotePayload;
  if (!Array.isArray(body.selected_module_codes) || !body.selected_module_codes.length) {
    return apiFail("Select at least one module for a quote.", {
      status: 400,
      code: ApiErrorCode.VALIDATION_ERROR,
    });
  }
  const cycleCheck = validateCustomErpBillingCycle(body.billing_cycle || "monthly");
  if (!cycleCheck.ok) {
    return apiFail(cycleCheck.message, {
      status: 400,
      code: ApiErrorCode.VALIDATION_ERROR,
    });
  }
  const result = await fetchCustomPackageQuote({
    product_slug: body.product_slug || "waamto-erp",
    billing_cycle: cycleCheck.cycle,
    selected_module_codes: body.selected_module_codes,
    discount_code: body.discount_code || null,
    industry_id: body.industry_id || null,
    category_id: body.category_id || null,
    selected_feature_packs: Array.isArray(body.selected_feature_packs)
      ? body.selected_feature_packs
      : [],
    user_limit: body.user_limit,
    company_limit: body.company_limit,
    branch_limit: body.branch_limit,
    warehouse_limit: body.warehouse_limit,
  });
  if (!result.ok || !result.data) {
    return apiFail(result.message || "Could not calculate package quote.", {
      status: result.status >= 400 ? result.status : 502,
      code:
        result.status === 400
          ? ApiErrorCode.VALIDATION_ERROR
          : result.status === 429
            ? ApiErrorCode.RATE_LIMITED
            : ApiErrorCode.SERVICE_UNAVAILABLE,
      data: null,
    });
  }
  return apiSuccess("OK", {
    data: result.data,
    status: 200,
  });
}

export async function GET_businessCategories(req: Request) {
  const industryId = new URL(req.url).searchParams.get("industry_id") || undefined;
  const result = await fetchPublicBusinessCategories(industryId);
  if (!result.ok && result.data.length === 0) return jsonFail(result.message, result.status);
  return jsonOk(result.data);
}

export async function GET_builderRecommendations(req: Request) {
  const categoryId = new URL(req.url).searchParams.get("category_id") || "";
  if (!categoryId.trim()) {
    return jsonFail("category_id is required.", 400);
  }
  const result = await fetchPublicBuilderRecommendations(categoryId.trim());
  if (!result.ok || !result.data) {
    return jsonFail(
      result.message || "Builder recommendations unavailable.",
      result.status >= 400 ? result.status : 502
    );
  }
  return jsonOk(result.data, { cacheSeconds: 30 });
}

export async function GET_businessProfiles(req: Request) {
  const categoryId = new URL(req.url).searchParams.get("category_id") || undefined;
  const result = await fetchPublicBusinessProfiles(categoryId);
  if (!result.ok && result.data.length === 0) return jsonFail(result.message, result.status);
  return jsonOk(result.data);
}

export async function GET_businessTypes(req: Request) {
  const industryId = new URL(req.url).searchParams.get("industry_id") || undefined;
  const result = await fetchPublicBusinessTypes(industryId);
  if (!result.ok && result.data.length === 0) return jsonFail(result.message, result.status);
  return jsonOk(result.data);
}

export async function GET_commercial(req: Request) {
  const url = new URL(req.url);
  const product = url.searchParams.get("product") || "waamto-erp";
  const billingCycle = (url.searchParams.get("billing_cycle") || "monthly") as
    | "monthly"
    | "yearly"
    | "lifetime";
  const result = await fetchPublicCommercialOverview({
    product,
    billing_cycle: billingCycle,
  });
  if (!result.ok || !result.data) {
    return jsonFail(result.message || "Commercial overview unavailable.", result.status);
  }
  return jsonOk(result.data, { cacheSeconds: 30 });
}

export async function GET_catalog(req: Request) {
  const url = new URL(req.url);
  const product = url.searchParams.get("product") || undefined;
  const fresh =
    url.searchParams.get("fresh") === "1" ||
    url.searchParams.get("fresh") === "true";
  const cacheKey = product?.trim() || "__default__";

  try {
    const bundle = await fetchPublicCatalogBundle(product, { fresh });
    const payload = buildCatalogPayload(bundle);
    const hasContent =
      payload.pricingPlans.length > 0 || payload.featuredProducts.length > 0;
    const catalogHealthy =
      Boolean(bundle.meta?.plansOk) &&
      Boolean(bundle.meta?.pricingOk) &&
      Boolean(bundle.meta?.comparisonOk) &&
      isEngineComparisonUsable(bundle.comparison);

    // Full Engine outage only — never use last-good for partial comparison failures.
    if (!bundle.ok && !hasContent) {
      const stale = catalogLastGood.get(cacheKey);
      if (stale) {
        return jsonOk({
          ...(stale as object),
          meta: { ...(stale as { meta?: object }).meta, stale: true },
        });
      }
      return jsonFail(bundle.message || "Commercial catalog unavailable.");
    }

    // Store last-good only when catalog + comparison are fully healthy.
    if (hasContent && catalogHealthy) {
      catalogLastGood.set(cacheKey, payload);
    }

    return fresh ? jsonFreshOk(payload) : jsonOk(payload);
  } catch (error) {
    const stale = catalogLastGood.get(cacheKey);
    if (stale) {
      return jsonOk({
        ...(stale as object),
        meta: { ...(stale as { meta?: object }).meta, stale: true },
      });
    }
    logApiError(error, {
      endpoint: "/api/commercial/catalog",
      httpStatus: 502,
      technicalMessage:
        error instanceof Error ? error.message : "Commercial catalog unavailable.",
    });
    return jsonFail(PUBLIC_MESSAGES[ApiErrorCode.INTERNAL_ERROR], 502);
  }
}

/**
 * Lightweight revision stamp — always reads Engine fresh so Website/Portal
 * can detect plan/price/limit/comparison updates before SWR hard expiry.
 */
export async function GET_catalogVersion(req: Request) {
  const product = new URL(req.url).searchParams.get("product") || undefined;
  try {
    const [plans, pricing, comparison] = await Promise.all([
      fetchPublicPlans(product, { fresh: true }),
      fetchPublicPricing(product, { fresh: true }),
      fetchPublicPlanComparison({ product, fresh: true }),
    ]);

    const revision = computeCatalogRevision({
      plans: plans.data,
      pricing: pricing.data,
      comparison: comparison.data,
    });

    return jsonOk(
      {
        revision,
        comparisonAvailable:
          comparison.ok && isEngineComparisonUsable(comparison.data),
        generatedAt: new Date().toISOString(),
      },
      { cacheSeconds: 15 }
    );
  } catch (error) {
    logApiError(error, {
      endpoint: "/api/commercial/catalog/version",
      httpStatus: 502,
      technicalMessage:
        error instanceof Error ? error.message : "Catalog version unavailable.",
    });
    return jsonFail("Catalog version unavailable.", 502);
  }
}

/**
 * Clear in-memory last-good + Next.js commercial catalog data cache.
 * Ops: send `x-catalog-revalidate-key` when COMMERCIAL_CATALOG_REVALIDATE_SECRET is set.
 * Same-origin browser calls after revision change may omit the secret.
 */
export async function POST_catalogRevalidate(req: Request) {
  const secret = CATALOG_REVALIDATE_SECRET.trim();
  if (secret) {
    const provided =
      req.headers.get("x-catalog-revalidate-key") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      "";
    if (provided !== secret) {
      // Allow same-origin unauthenticated refresh (browser auto-sync) without ops secret.
      const origin = req.headers.get("origin") || "";
      const host = req.headers.get("host") || "";
      const sameOrigin =
        origin &&
        host &&
        (origin.includes(host) ||
          (() => {
            try {
              return new URL(origin).host === host;
            } catch {
              return false;
            }
          })());
      if (!sameOrigin) {
        return apiFail("Unauthorized catalog revalidate.", {
          status: 401,
          code: ApiErrorCode.UNAUTHORIZED,
        });
      }
    }
  }

  const body = (await req.json().catch(() => ({}))) as { product?: string };
  clearCatalogLastGood(body.product);

  try {
    const { revalidateTag } = await import("next/cache");
    revalidateTag(COMMERCIAL_CATALOG_CACHE_TAG, "max");
  } catch (error) {
    logApiError(error, {
      endpoint: "/api/commercial/catalog/revalidate",
      httpStatus: 200,
      technicalMessage:
        error instanceof Error
          ? error.message
          : "revalidateTag unavailable — last-good cleared only.",
    });
  }

  return apiSuccess("Commercial catalog cache cleared.", {
    data: {
      cleared: true,
      tag: COMMERCIAL_CATALOG_CACHE_TAG,
      product: body.product || null,
    },
    status: 200,
  });
}

import { ApiErrorCode, PUBLIC_MESSAGES } from "@/lib/api/codes";
import { logApiError } from "@/lib/api/logger";
import { apiFail, apiSuccess } from "@/lib/api/response";
import {
  fetchPublicBusinessCategories,
  fetchPublicBusinessProfiles,
  fetchPublicBusinessTypes,
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
import { normalizeCatalogModules } from "@/lib/commercial/module-builder";
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

/** Last successful catalog payload — soft-serve when License Engine is briefly down. */
const catalogLastGood = new Map<string, unknown>();

function buildCatalogPayload(
  bundle: Awaited<ReturnType<typeof fetchPublicCatalogBundle>>
) {
  const marketingCatalogPlans = publicMarketingPlans(bundle.plans);
  const marketingPricingRows = publicMarketingPlans(bundle.pricing);
  const mappedPlans =
    marketingPricingRows.length > 0
      ? mapPricingRowsToPlans(
          marketingPricingRows,
          marketingCatalogPlans,
          bundle.comparison
        )
      : sortPlansByTier(marketingCatalogPlans).map((p) => {
          const row = bundle.comparison?.comparison.find((c) => c.plan.id === p.id);
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

  return {
    products: bundle.products,
    plans: bundle.plans,
    pricing: bundle.pricing,
    industries: bundle.industries,
    comparison: bundle.comparison,
    productSlug: bundle.productSlug,
    pricingPlans,
    cardPlans: cardPlans(pricingPlans),
    featuredProducts,
    popularPlans: popular,
    enterprise,
    meta: bundle.meta,
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
  // Soft-empty when Engine comparison is down — pricing UI builds a local matrix.
  if (!result.ok && result.data.comparison.length === 0) {
    return jsonOk({ plans: [], comparison: [], limit_keys: [] });
  }
  return jsonOk(result.data);
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
  const result = await fetchCustomPackageQuote({
    product_slug: body.product_slug || "waamto-erp",
    billing_cycle: body.billing_cycle || "monthly",
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
  const product = new URL(req.url).searchParams.get("product") || undefined;
  const cacheKey = product?.trim() || "__default__";

  try {
    const bundle = await fetchPublicCatalogBundle(product);
    const payload = buildCatalogPayload(bundle);
    const hasContent =
      payload.pricingPlans.length > 0 || payload.featuredProducts.length > 0;

    if (!bundle.ok && !hasContent) {
      const stale = catalogLastGood.get(cacheKey);
      if (stale) {
        return jsonOk({ ...(stale as object), meta: { ...(stale as { meta?: object }).meta, stale: true } });
      }
      return jsonFail(bundle.message || "Commercial catalog unavailable.");
    }

    if (hasContent) {
      catalogLastGood.set(cacheKey, payload);
    }
    return jsonOk(payload);
  } catch (error) {
    const stale = catalogLastGood.get(cacheKey);
    if (stale) {
      return jsonOk({ ...(stale as object), meta: { ...(stale as { meta?: object }).meta, stale: true } });
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

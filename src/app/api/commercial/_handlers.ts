import { ApiErrorCode, PUBLIC_MESSAGES } from "@/lib/api/codes";
import { logApiError } from "@/lib/api/logger";
import { apiFail, apiSuccess } from "@/lib/api/response";
import {
  fetchPublicBusinessCategories,
  fetchPublicBusinessProfiles,
  fetchPublicBusinessTypes,
  fetchPublicIndustries,
  fetchPublicPlans,
  fetchPublicPricing,
  fetchPublicProducts,
  fetchPublicCatalogBundle,
  fetchPublicPlanComparison,
} from "@/lib/commercial/client";
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
  const cacheSeconds = init?.cacheSeconds ?? 60;
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
  return apiFail(
    status >= 500
      ? PUBLIC_MESSAGES[ApiErrorCode.INTERNAL_ERROR]
      : message || PUBLIC_MESSAGES[ApiErrorCode.SERVICE_UNAVAILABLE],
    {
      status,
      code:
        status >= 500
          ? ApiErrorCode.INTERNAL_ERROR
          : status === 404
            ? ApiErrorCode.NOT_FOUND
            : ApiErrorCode.SERVICE_UNAVAILABLE,
      data: [],
    }
  );
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

export async function GET_businessCategories(req: Request) {
  const industryId = new URL(req.url).searchParams.get("industry_id") || undefined;
  const result = await fetchPublicBusinessCategories(industryId);
  if (!result.ok && result.data.length === 0) return jsonFail(result.message, result.status);
  return jsonOk(result.data);
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

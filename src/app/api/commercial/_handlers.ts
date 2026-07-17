import { NextResponse } from "next/server";
import {
  fetchPublicBusinessCategories,
  fetchPublicBusinessProfiles,
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
  return NextResponse.json(
    { success: true, data },
    {
      status: init?.status ?? 200,
      headers: {
        "Cache-Control": `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 5}`,
      },
    }
  );
}

function jsonFail(message: string, status = 502) {
  return NextResponse.json({ success: false, message, data: [] }, { status });
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
    return jsonFail(result.message, result.status);
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

export async function GET_catalog(req: Request) {
  const product = new URL(req.url).searchParams.get("product") || undefined;
  const bundle = await fetchPublicCatalogBundle(product);
  // Raw Engine lists stay intact (plans/pricing below). Display fields exclude Trial plans only.
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

  if (!bundle.ok && pricingPlans.length === 0 && featuredProducts.length === 0) {
    return jsonFail(bundle.message || "Commercial catalog unavailable.");
  }

  return jsonOk({
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
  });
}

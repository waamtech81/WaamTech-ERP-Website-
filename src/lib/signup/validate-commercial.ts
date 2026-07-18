import {
  fetchPublicBusinessCategories,
  fetchPublicIndustries,
  fetchPublicPlanById,
  fetchPublicProducts,
} from "@/lib/commercial/client";
import type {
  CatalogBusinessCategory,
  CatalogIndustry,
  CatalogPlan,
  CatalogProduct,
} from "@/lib/commercial/types";
import { isUuid } from "@/lib/signup/permalinks";

export type ValidatedSignupCommercial = {
  plan: CatalogPlan;
  product: CatalogProduct;
  industry: CatalogIndustry;
  category: CatalogBusinessCategory;
};

export type SignupCommercialValidationResult =
  | { ok: true; data: ValidatedSignupCommercial }
  | { ok: false; message: string; status: number; code: string };

function isPublicActive(row: {
  status?: string | null;
  is_public?: boolean | null;
  is_active?: boolean | null;
}): boolean {
  if (row.is_public === false) return false;
  if (row.is_active === false) return false;
  if (row.status && String(row.status).toLowerCase() !== "active") return false;
  return true;
}

function isPlanExpired(plan: {
  launch_active?: boolean;
  launch_end_date?: string | null;
}): boolean {
  if (!plan.launch_end_date) return false;
  const end = Date.parse(plan.launch_end_date);
  if (!Number.isFinite(end)) return false;
  return Date.now() > end && plan.launch_active === false;
}

/**
 * Re-validate signup commercial IDs against License Engine public catalog.
 * Never trusts client prices, modules, limits, or product/plan slugs.
 */
export async function validateSignupCommercialSelection(input: {
  plan_id: string;
  industry_id: string;
  category_id: string;
  /** Optional — when present must match the plan's Engine product_id. */
  product_id?: string;
}): Promise<SignupCommercialValidationResult> {
  const planId = String(input.plan_id || "").trim();
  const industryId = String(input.industry_id || "").trim();
  const categoryId = String(input.category_id || "").trim();
  const productIdHint = String(input.product_id || "").trim();

  if (!isUuid(planId) || !isUuid(industryId) || !isUuid(categoryId)) {
    return {
      ok: false,
      status: 400,
      code: "INVALID_COMMERCIAL_IDS",
      message: "Invalid plan, industry, or category selection.",
    };
  }

  const planResult = await fetchPublicPlanById(planId);
  if (!planResult.ok || !planResult.data) {
    return {
      ok: false,
      status: planResult.status === 404 ? 404 : planResult.status || 502,
      code: planResult.status === 404 ? "PLAN_NOT_FOUND" : "PLAN_LOOKUP_FAILED",
      message: planResult.message || "Plan not found.",
    };
  }

  const plan = planResult.data;
  if (!isPublicActive(plan) || isPlanExpired(plan)) {
    return {
      ok: false,
      status: 410,
      code: "PLAN_DISABLED",
      message: "This plan is not available for signup.",
    };
  }

  if (plan.contact_sales || plan.pricing_type === "custom") {
    return {
      ok: false,
      status: 400,
      code: "PLAN_NOT_SELF_SERVE",
      message: "This plan requires contacting sales.",
    };
  }

  const products = await fetchPublicProducts();
  const product =
    products.data.find(
      (p) => p.id === plan.product_id || p.slug === plan.product_slug
    ) || null;

  if (!product || !isPublicActive(product)) {
    return {
      ok: false,
      status: 410,
      code: "PRODUCT_DISABLED",
      message: "This product is not available for signup.",
    };
  }

  if (productIdHint && productIdHint !== product.id) {
    return {
      ok: false,
      status: 400,
      code: "PRODUCT_PLAN_MISMATCH",
      message: "Selected product does not match the selected plan.",
    };
  }

  const industries = await fetchPublicIndustries();
  if (!industries.ok) {
    return {
      ok: false,
      status: industries.status || 502,
      code: "INDUSTRY_LOOKUP_FAILED",
      message: industries.message || "Could not validate industry.",
    };
  }

  const industry = industries.data.find((i) => i.id === industryId) || null;
  if (!industry || !isPublicActive(industry)) {
    return {
      ok: false,
      status: 400,
      code: "INDUSTRY_INVALID",
      message: "Selected industry is not available for signup.",
    };
  }

  const categories = await fetchPublicBusinessCategories(industry.id);
  if (!categories.ok) {
    return {
      ok: false,
      status: categories.status || 502,
      code: "CATEGORY_LOOKUP_FAILED",
      message: categories.message || "Could not validate business category.",
    };
  }

  const category = categories.data.find((c) => c.id === categoryId) || null;
  if (!category || !isPublicActive(category)) {
    return {
      ok: false,
      status: 400,
      code: "CATEGORY_INVALID",
      message: "Selected business category is not available for signup.",
    };
  }

  if (category.industry_id && category.industry_id !== industry.id) {
    return {
      ok: false,
      status: 400,
      code: "CATEGORY_INDUSTRY_MISMATCH",
      message: "Business category does not belong to the selected industry.",
    };
  }

  return {
    ok: true,
    data: { plan, product, industry, category },
  };
}

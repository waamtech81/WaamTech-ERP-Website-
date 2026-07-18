import { withApiHandler } from "@/lib/api/handler";
import { toPublicError } from "@/lib/api/errors";
import { apiFail, apiSuccess } from "@/lib/api/response";
import { fetchPublicPlanById, fetchPublicProducts } from "@/lib/commercial/client";

type Params = { params: Promise<{ id: string }> };

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
 * GET /api/commercial/plans/:id
 * Proxies License Engine public plan detail (SSOT). Never trusts client pricing.
 */
export const GET = withApiHandler(
  async (_req, context) => {
    const { id } = await (context as Params).params;
    const planResult = await fetchPublicPlanById(id);

    if (!planResult.ok || !planResult.data) {
      const publicError = toPublicError(
        planResult.message || "Plan not found.",
        planResult.status === 404 ? 404 : planResult.status || 502
      );
      return apiFail(
        planResult.status === 404 ? "Plan not found." : publicError.message,
        {
          status: planResult.status === 404 ? 404 : publicError.status >= 500 ? 502 : publicError.status,
          code: planResult.status === 404 ? "PLAN_NOT_FOUND" : publicError.code,
          data: null,
        }
      );
    }

    const plan = planResult.data;

    if (!plan.is_active || plan.is_public === false) {
      return apiFail("This plan is not available for signup.", {
        status: 410,
        code: "PLAN_DISABLED",
        data: null,
      });
    }

    if (isPlanExpired(plan)) {
      return apiFail("This plan offer has expired.", {
        status: 410,
        code: "PLAN_EXPIRED",
        data: null,
      });
    }

    const products = await fetchPublicProducts();
    const product =
      products.data.find(
        (p) => p.id === plan.product_id || p.slug === plan.product_slug
      ) || null;

    if (!product) {
      return apiFail("Product for this plan was not found.", {
        status: 404,
        code: "PRODUCT_NOT_FOUND",
        data: null,
      });
    }

    if (product.status !== "active" || product.is_public === false) {
      return apiFail("This product is not available for signup.", {
        status: 410,
        code: "PRODUCT_DISABLED",
        data: null,
      });
    }

    const res = apiSuccess("OK", {
      data: { plan, product },
    });
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  },
  { endpoint: "/api/commercial/plans/[id]" }
);

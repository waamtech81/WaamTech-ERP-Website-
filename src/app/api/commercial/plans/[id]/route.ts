import { NextResponse } from "next/server";
import { fetchPublicPlanById, fetchPublicProducts } from "@/lib/commercial/client";

type Params = { params: Promise<{ id: string }> };

function isPlanExpired(plan: {
  launch_active?: boolean;
  launch_end_date?: string | null;
}): boolean {
  if (!plan.launch_end_date) return false;
  const end = Date.parse(plan.launch_end_date);
  if (!Number.isFinite(end)) return false;
  // Only treat as expired when launch window ended AND launch is required/active flag false
  return Date.now() > end && plan.launch_active === false;
}

/**
 * GET /api/commercial/plans/:id
 * Proxies License Engine public plan detail (SSOT). Never trusts client pricing.
 */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const planResult = await fetchPublicPlanById(id);

  if (!planResult.ok || !planResult.data) {
    return NextResponse.json(
      {
        success: false,
        message: planResult.message || "Plan not found.",
        code: planResult.status === 404 ? "PLAN_NOT_FOUND" : "PLAN_LOOKUP_FAILED",
        data: null,
      },
      { status: planResult.status === 404 ? 404 : planResult.status || 502 }
    );
  }

  const plan = planResult.data;

  if (!plan.is_active || plan.is_public === false) {
    return NextResponse.json(
      {
        success: false,
        message: "This plan is not available for signup.",
        code: "PLAN_DISABLED",
        data: null,
      },
      { status: 410 }
    );
  }

  if (isPlanExpired(plan)) {
    return NextResponse.json(
      {
        success: false,
        message: "This plan offer has expired.",
        code: "PLAN_EXPIRED",
        data: null,
      },
      { status: 410 }
    );
  }

  // Validate parent product from Engine catalog
  const products = await fetchPublicProducts();
  const product =
    products.data.find(
      (p) => p.id === plan.product_id || p.slug === plan.product_slug
    ) || null;

  if (!product) {
    return NextResponse.json(
      {
        success: false,
        message: "Product for this plan was not found.",
        code: "PRODUCT_NOT_FOUND",
        data: null,
      },
      { status: 404 }
    );
  }

  if (product.status !== "active" || product.is_public === false) {
    return NextResponse.json(
      {
        success: false,
        message: "This product is not available for signup.",
        code: "PRODUCT_DISABLED",
        data: null,
      },
      { status: 410 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        plan,
        product,
      },
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    }
  );
}

import {
  CATALOG_REVALIDATE_SECONDS,
  commercialApiBase,
  commercialHeaders,
} from "@/lib/commercial/config";
import { COMMERCIAL_CATALOG_CACHE_TAG } from "@/lib/commercial/catalog-revision";
import { normalizeCustomPackageQuote } from "@/lib/commercial/custom-package-quote";
import { toPublicError } from "@/lib/api/errors";
import { logApiError } from "@/lib/api/logger";
import { friendlyNetworkError } from "@/lib/network/errors";
import { commercialUpstreamMessage } from "@/lib/commercial/upstream-error";
import type {
  CatalogBusinessCategory,
  CatalogBusinessProfile,
  CatalogBusinessType,
  CatalogComparisonBundle,
  CatalogFetchResult,
  CatalogIndustry,
  CatalogIndustryDetail,
  CatalogBuilderRecommendations,
  CatalogModule,
  CatalogPlan,
  CatalogPlanLimits,
  CatalogPricing,
  CatalogProduct,
  CommercialInvoice,
  CommercialPayment,
  CommercialRenewal,
  CommercialSubscription,
  CustomPackageQuotePayload,
  CustomPackageQuoteResult,
  CustomPackageRequestPayload,
  CustomPackageRequestResult,
  PublicCommercialOverview,
  BillingCycle,
  CustomerBillingHistory,
  PaginatedResult,
} from "@/lib/commercial/types";

type LicenseEnvelope<T> = {
  success?: boolean;
  message?: string;
  code?: string;
  data?: T;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  unread_count?: number;
  error?: { message?: string; code?: string };
};

function emptyResult<T>(data: T, message: string, status = 502): CatalogFetchResult<T> {
  return { ok: false, status, message, data };
}

function publicUpstreamMessage(
  raw: string | undefined,
  status: number,
  fallback: string,
  code?: string | null
): string {
  const technical = raw || fallback;
  if (raw || status >= 400) {
    logApiError(new Error(technical), {
      httpStatus: status,
      technicalMessage: technical,
    });
  }
  return commercialUpstreamMessage(raw, status, fallback);
}

async function getPublic<T>(
  path: string,
  query?: Record<string, string | undefined>,
  options?: {
    revalidate?: number | false;
    accessToken?: string;
    /** Skip Next.js data cache (fresh Engine read for revision / forced refresh). */
    fresh?: boolean;
  }
): Promise<CatalogFetchResult<T | null>> {
  const base = commercialApiBase();
  const params = new URLSearchParams();
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v != null && String(v).trim()) params.set(k, String(v));
    }
  }
  const qs = params.toString();
  const url = `${base}${path}${qs ? `?${qs}` : ""}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const fetchInit: RequestInit & {
      next?: { revalidate?: number; tags?: string[] };
    } = {
      method: "GET",
      headers: commercialHeaders(options?.accessToken),
      signal: controller.signal,
    };

    if (options?.revalidate === false || options?.accessToken || options?.fresh) {
      fetchInit.cache = "no-store";
    } else {
      fetchInit.next = {
        revalidate:
          typeof options?.revalidate === "number"
            ? options.revalidate
            : CATALOG_REVALIDATE_SECONDS,
        tags: [COMMERCIAL_CATALOG_CACHE_TAG],
      };
    }

    const res = await fetch(url, fetchInit);
    let json: LicenseEnvelope<T> = {};
    try {
      json = (await res.json()) as LicenseEnvelope<T>;
    } catch {
      json = { success: false, message: "Invalid response from License Engine." };
    }

    if (!res.ok || json.success === false) {
      return {
        ok: false,
        status: res.status,
        message: publicUpstreamMessage(
          json.message || json.error?.message,
          res.status,
          `License Engine request failed (${res.status}).`,
          json.code || json.error?.code
        ),
        data: (json.data as T) ?? null,
      };
    }

    return {
      ok: true,
      status: res.status,
      message: json.message || "OK",
      data: (json.data as T) ?? null,
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    logApiError(error, {
      httpStatus: aborted ? 504 : 502,
      technicalMessage:
        error instanceof Error ? error.message : "Commercial fetch failed",
    });
    return emptyResult(
      null,
      toPublicError(
        friendlyNetworkError(
          error,
          aborted
            ? "The request timed out. Please retry."
            : "Something went wrong. Please try again later."
        ),
        aborted ? 504 : 502
      ).message,
      aborted ? 504 : 502
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function getPublicPaginated<T>(
  path: string,
  query?: Record<string, string | undefined>,
  accessToken?: string
): Promise<CatalogFetchResult<PaginatedResult<T>>> {
  const base = commercialApiBase();
  const params = new URLSearchParams();
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v != null && String(v).trim()) params.set(k, String(v));
    }
  }
  const qs = params.toString();
  const url = `${base}${path}${qs ? `?${qs}` : ""}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: commercialHeaders(accessToken),
      cache: "no-store",
      signal: controller.signal,
    });
    let json: LicenseEnvelope<T[]> = {};
    try {
      json = (await res.json()) as LicenseEnvelope<T[]>;
    } catch {
      json = { success: false, message: "Invalid response from License Engine." };
    }

    if (!res.ok || json.success === false) {
      return {
        ok: false,
        status: res.status,
        message: publicUpstreamMessage(
          json.message || json.error?.message,
          res.status,
          `License Engine request failed (${res.status}).`,
          json.code || json.error?.code
        ),
        data: { data: [], total: 0 },
      };
    }

    const rows = Array.isArray(json.data) ? json.data : [];
    return {
      ok: true,
      status: res.status,
      message: json.message || "OK",
      data: {
        data: rows,
        total: typeof json.total === "number" ? json.total : rows.length,
        page: json.page,
        limit: json.limit,
        totalPages: json.totalPages,
        unread_count:
          typeof json.unread_count === "number" ? json.unread_count : undefined,
      },
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    logApiError(error, {
      httpStatus: aborted ? 504 : 502,
      technicalMessage:
        error instanceof Error ? error.message : "Commercial paginated fetch failed",
    });
    return {
      ok: false,
      status: aborted ? 504 : 502,
      message: toPublicError(
        friendlyNetworkError(
          error,
          aborted
            ? "The request timed out. Please retry."
            : "Something went wrong. Please try again later."
        ),
        aborted ? 504 : 502
      ).message,
      data: { data: [], total: 0 },
    };
  } finally {
    clearTimeout(timeout);
  }
}

function asArray<T>(data: T[] | null | undefined): T[] {
  return Array.isArray(data) ? data : [];
}

export async function fetchPublicCommercialOverview(opts?: {
  product?: string;
  billing_cycle?: BillingCycle;
}): Promise<CatalogFetchResult<PublicCommercialOverview | null>> {
  const result = await getPublic<PublicCommercialOverview>("/v1/public/catalog/commercial", {
    product: opts?.product || "waamto-erp",
    billing_cycle: opts?.billing_cycle || "monthly",
  });
  return { ...result, data: result.data ?? null };
}

export async function fetchPublicProducts(): Promise<CatalogFetchResult<CatalogProduct[]>> {
  const result = await getPublic<CatalogProduct[]>("/v1/public/catalog/products");
  return { ...result, data: asArray(result.data) };
}

export async function fetchPublicModules(
  productSlug?: string
): Promise<CatalogFetchResult<CatalogModule[]>> {
  const result = await getPublicPaginated<CatalogModule>("/v1/public/catalog/modules", {
    product: productSlug,
    limit: "200",
    page: "1",
  });
  return {
    ok: result.ok,
    status: result.status,
    message: result.message,
    data: asArray(result.data.data),
  };
}

/** Anonymous live quote — modules + seats + packs + coupon/tax from License Engine. */
export async function fetchCustomPackageQuote(
  body: CustomPackageQuotePayload
): Promise<CatalogFetchResult<CustomPackageQuoteResult | null>> {
  const base = commercialApiBase();
  const url = `${base}/v1/public/catalog/custom-packages/quote`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  const payload: Record<string, unknown> = {
    product_slug: body.product_slug || "waamto-erp",
    billing_cycle: body.billing_cycle,
    selected_module_codes: body.selected_module_codes,
    discount_code: body.discount_code || null,
  };
  if (body.industry_id) payload.industry_id = body.industry_id;
  if (body.category_id) payload.category_id = body.category_id;
  if (body.selected_feature_packs?.length) {
    payload.selected_feature_packs = body.selected_feature_packs;
  }
  if (body.user_limit != null) payload.user_limit = Math.floor(Number(body.user_limit));
  if (body.company_limit != null) payload.company_limit = Math.floor(Number(body.company_limit));
  if (body.branch_limit != null) payload.branch_limit = Math.floor(Number(body.branch_limit));
  if (body.warehouse_limit != null) payload.warehouse_limit = Math.floor(Number(body.warehouse_limit));

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...commercialHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal,
    });
    let json: LicenseEnvelope<unknown> = {};
    try {
      json = (await res.json()) as LicenseEnvelope<unknown>;
    } catch {
      json = { success: false, message: "Invalid response from License Engine." };
    }

    const normalized = normalizeCustomPackageQuote(json.data);

    if (!res.ok || json.success === false) {
      return {
        ok: false,
        status: res.status,
        message: publicUpstreamMessage(
          json.message || json.error?.message,
          res.status,
          `License Engine request failed (${res.status}).`,
          json.code || json.error?.code
        ),
        data: normalized,
      };
    }

    if (!normalized) {
      return {
        ok: false,
        status: 502,
        message: publicUpstreamMessage(
          json.message || "License Engine returned an unreadable quote payload.",
          502,
          "License Engine returned an unreadable quote payload."
        ),
        data: null,
      };
    }

    return {
      ok: true,
      status: res.status,
      message: json.message || "OK",
      data: normalized,
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    logApiError(error, {
      httpStatus: aborted ? 504 : 502,
      technicalMessage:
        error instanceof Error ? error.message : "Custom package quote failed",
    });
    return emptyResult(
      null,
      toPublicError(
        friendlyNetworkError(
          error,
          aborted
            ? "The quote request timed out. Please retry."
            : "Could not load live pricing. Please try again."
        ),
        aborted ? 504 : 502
      ).message,
      aborted ? 504 : 502
    );
  } finally {
    clearTimeout(timeout);
  }
}

export type CustomUpgradeLineItemsPayload = {
  billing_cycle: BillingCycle;
  added_modules: string[];
  added_feature_packs?: string[];
  payable_amount: number;
  campaign_active?: boolean;
  limit_increases?: Array<{ label: string; previous: number; next: number }>;
};

export type CustomUpgradeLineItemsResult = {
  upgrade_line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    code?: string;
    kind: "module" | "feature_pack" | "limit" | "summary";
  }>;
};

/** Engine prorated upgrade lines — matches checkout/invoice itemization. */
export async function fetchCustomUpgradeLineItems(
  body: CustomUpgradeLineItemsPayload
): Promise<CatalogFetchResult<CustomUpgradeLineItemsResult | null>> {
  const base = commercialApiBase();
  const url = `${base}/v1/public/catalog/custom-packages/upgrade-line-items`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...commercialHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        billing_cycle: body.billing_cycle,
        added_modules: body.added_modules,
        added_feature_packs: body.added_feature_packs || [],
        payable_amount: body.payable_amount,
        campaign_active: body.campaign_active,
        limit_increases: body.limit_increases || [],
      }),
      cache: "no-store",
      signal: controller.signal,
    });
    let json: LicenseEnvelope<unknown> = {};
    try {
      json = (await res.json()) as LicenseEnvelope<unknown>;
    } catch {
      json = { success: false, message: "Invalid response from License Engine." };
    }

    const data = json.data as CustomUpgradeLineItemsResult | null | undefined;

    if (!res.ok || json.success === false || !data?.upgrade_line_items) {
      return {
        ok: false,
        status: res.status,
        message: publicUpstreamMessage(
          json.message || json.error?.message,
          res.status,
          `License Engine request failed (${res.status}).`,
          json.code || json.error?.code
        ),
        data: null,
      };
    }

    return {
      ok: true,
      status: res.status,
      message: json.message || "OK",
      data,
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    logApiError(error, {
      httpStatus: aborted ? 504 : 502,
      technicalMessage:
        error instanceof Error ? error.message : "Upgrade line items failed",
    });
    return emptyResult(
      null,
      toPublicError(
        friendlyNetworkError(
          error,
          aborted
            ? "The upgrade preview timed out. Please retry."
            : "Could not load upgrade line items. Please try again."
        ),
        aborted ? 504 : 502
      ).message,
      aborted ? 504 : 502
    );
  } finally {
    clearTimeout(timeout);
  }
}

/** Anonymous custom package lead — no customer JWT required. */
export async function submitCustomPackageRequest(
  body: CustomPackageRequestPayload
): Promise<CatalogFetchResult<CustomPackageRequestResult | null>> {
  const base = commercialApiBase();
  const url = `${base}/v1/public/catalog/custom-package-requests`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...commercialHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });
    let json: LicenseEnvelope<CustomPackageRequestResult> = {};
    try {
      json = (await res.json()) as LicenseEnvelope<CustomPackageRequestResult>;
    } catch {
      json = { success: false, message: "Invalid response from License Engine." };
    }

    if (!res.ok || json.success === false) {
      return {
        ok: false,
        status: res.status,
        message: publicUpstreamMessage(
          json.message || json.error?.message,
          res.status,
          `License Engine request failed (${res.status}).`,
          json.code || json.error?.code
        ),
        data: (json.data as CustomPackageRequestResult) ?? null,
      };
    }

    return {
      ok: true,
      status: res.status,
      message: json.message || "OK",
      data: (json.data as CustomPackageRequestResult) ?? null,
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    logApiError(error, {
      httpStatus: aborted ? 504 : 502,
      technicalMessage:
        error instanceof Error ? error.message : "Custom package request failed",
    });
    return emptyResult(
      null,
      toPublicError(
        friendlyNetworkError(
          error,
          aborted
            ? "The request timed out. Please retry."
            : "Something went wrong. Please try again later."
        ),
        aborted ? 504 : 502
      ).message,
      aborted ? 504 : 502
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchPublicPlans(
  productSlug?: string,
  options?: { fresh?: boolean }
): Promise<CatalogFetchResult<CatalogPlan[]>> {
  const result = await getPublic<CatalogPlan[]>(
    "/v1/public/catalog/plans",
    {
      product: productSlug,
    },
    options?.fresh ? { fresh: true } : undefined
  );
  return { ...result, data: asArray(result.data) };
}

export async function fetchPublicPricing(
  productSlug?: string,
  options?: { fresh?: boolean }
): Promise<CatalogFetchResult<CatalogPricing[]>> {
  const result = await getPublic<CatalogPricing[]>(
    "/v1/public/catalog/pricing",
    {
      product: productSlug,
    },
    options?.fresh ? { fresh: true } : undefined
  );
  return { ...result, data: asArray(result.data) };
}

export async function fetchPublicPlanById(
  planId: string
): Promise<CatalogFetchResult<CatalogPlan | null>> {
  const id = String(planId || "").trim();
  if (!id) {
    return emptyResult(null, "Missing plan_id.", 400);
  }
  const result = await getPublic<CatalogPlan | { plan?: CatalogPlan }>(
    `/v1/public/catalog/plans/${encodeURIComponent(id)}`,
    undefined,
    { revalidate: false }
  );
  if (!result.ok || !result.data) {
    return { ...result, data: null };
  }
  // License Engine detail returns { plan, pricing, marketing, ... }.
  // List endpoint returns a flat CatalogPlan — support both shapes.
  const raw = result.data as CatalogPlan & { plan?: CatalogPlan };
  const plan = raw.plan && typeof raw.plan === "object" && raw.plan.id ? raw.plan : raw;
  if (!plan?.id) {
    return emptyResult(null, "Plan not found.", 404);
  }
  return { ...result, data: plan as CatalogPlan };
}

export async function fetchPublicPlanLimits(
  planId: string
): Promise<CatalogFetchResult<CatalogPlanLimits | null>> {
  return getPublic<CatalogPlanLimits>(
    `/v1/public/catalog/plans/${encodeURIComponent(planId)}/limits`
  );
}

export async function fetchPublicPlanComparison(opts?: {
  product?: string;
  ids?: string[];
  fresh?: boolean;
}): Promise<CatalogFetchResult<CatalogComparisonBundle>> {
  const result = await getPublic<CatalogComparisonBundle>(
    "/v1/public/catalog/plans/comparison",
    {
      product: opts?.product,
      ids: opts?.ids?.length ? opts.ids.join(",") : undefined,
    },
    opts?.fresh ? { fresh: true } : undefined
  );
  return {
    ...result,
    data: result.data || { plans: [], comparison: [], limit_keys: [] },
  };
}

/** Registry lists must not rely on Engine default pagination (historically 100). */
const REGISTRY_PAGE_LIMIT = "500";

export type PublicCurrency = {
  code: string;
  name: string;
  symbol: string;
  exchange_rate: number;
  is_default: boolean;
  display_order: number;
};

/** Enabled currencies from License Engine billing master data. */
export async function fetchPublicCurrencies(): Promise<
  CatalogFetchResult<PublicCurrency[]>
> {
  const result = await getPublic<PublicCurrency[]>("/v1/public/catalog/currencies", undefined, {
    revalidate: 30,
  });
  return { ...result, data: asArray(result.data) };
}

export async function fetchPublicIndustries(): Promise<
  CatalogFetchResult<CatalogIndustry[]>
> {
  const result = await getPublic<CatalogIndustry[]>("/v1/public/catalog/industries", {
    limit: REGISTRY_PAGE_LIMIT,
  });
  return { ...result, data: asArray(result.data) };
}

export async function fetchPublicIndustryDetail(
  idOrSlug: string
): Promise<CatalogFetchResult<CatalogIndustryDetail | null>> {
  const result = await getPublic<CatalogIndustryDetail>(
    `/v1/public/catalog/industries/${encodeURIComponent(idOrSlug)}`,
    undefined,
    { revalidate: CATALOG_REVALIDATE_SECONDS }
  );
  return { ...result, data: result.data ?? null };
}

/** Lean Custom ERP Builder recommendations — NOT provisioning defaults. */
export async function fetchPublicBuilderRecommendations(
  categoryId: string
): Promise<CatalogFetchResult<CatalogBuilderRecommendations | null>> {
  const id = String(categoryId || "").trim();
  if (!id) {
    return emptyResult(null, "category_id is required.", 400);
  }
  const result = await getPublic<CatalogBuilderRecommendations>(
    "/v1/public/catalog/builder-recommendations",
    { category_id: id },
    { revalidate: false }
  );
  return { ...result, data: result.data ?? null };
}

export async function fetchPublicBusinessCategories(
  industryId?: string
): Promise<CatalogFetchResult<CatalogBusinessCategory[]>> {
  const result = await getPublic<CatalogBusinessCategory[]>(
    "/v1/public/catalog/business-categories",
    { industry_id: industryId, limit: REGISTRY_PAGE_LIMIT }
  );
  return { ...result, data: asArray(result.data) };
}

export async function fetchPublicBusinessProfiles(
  categoryId?: string
): Promise<CatalogFetchResult<CatalogBusinessProfile[]>> {
  const result = await getPublic<CatalogBusinessProfile[]>(
    "/v1/public/catalog/business-profiles",
    { category_id: categoryId, limit: REGISTRY_PAGE_LIMIT }
  );
  return { ...result, data: asArray(result.data) };
}

export async function fetchPublicBusinessTypes(
  industryId?: string
): Promise<CatalogFetchResult<CatalogBusinessType[]>> {
  const result = await getPublic<CatalogBusinessType[]>(
    "/v1/public/catalog/business-types",
    { industry_id: industryId, limit: REGISTRY_PAGE_LIMIT }
  );
  return { ...result, data: asArray(result.data) };
}

export async function fetchMySubscriptions(
  accessToken: string,
  query?: { page?: number; limit?: number; status?: string }
) {
  return getPublicPaginated<CommercialSubscription>(
    "/v1/public/billing/subscriptions",
    {
      page: query?.page != null ? String(query.page) : undefined,
      limit: query?.limit != null ? String(query.limit) : undefined,
      status: query?.status,
    },
    accessToken
  );
}

export async function fetchMyInvoices(
  accessToken: string,
  query?: { page?: number; limit?: number; status?: string }
) {
  return getPublicPaginated<CommercialInvoice>(
    "/v1/public/billing/invoices",
    {
      page: query?.page != null ? String(query.page) : undefined,
      limit: query?.limit != null ? String(query.limit) : undefined,
      status: query?.status,
    },
    accessToken
  );
}

export async function fetchMyPayments(
  accessToken: string,
  query?: { page?: number; limit?: number }
) {
  return getPublicPaginated<CommercialPayment>(
    "/v1/public/billing/payments",
    {
      page: query?.page != null ? String(query.page) : undefined,
      limit: query?.limit != null ? String(query.limit) : undefined,
    },
    accessToken
  );
}

export async function fetchMyRenewals(accessToken: string) {
  const result = await getPublic<CommercialRenewal[]>(
    "/v1/public/billing/renewals",
    undefined,
    { revalidate: false, accessToken }
  );
  return { ...result, data: asArray(result.data) };
}

export async function fetchMyBillingHistory(accessToken: string) {
  const result = await getPublic<CustomerBillingHistory>(
    "/v1/public/billing/history",
    undefined,
    { revalidate: false, accessToken }
  );
  return {
    ...result,
    data: result.data || {
      customer_id: "",
      subscriptions: [],
      invoices: [],
      payments: [],
      renewals: [],
    },
  };
}

export type BillingCheckoutSession = {
  id?: string;
  session_token?: string;
  checkout_url?: string;
  status?: string;
  purpose?: string;
  amount?: number | null;
  currency?: string | null;
  gateway?: string | null;
  plan_name?: string | null;
  metadata?: Record<string, unknown> | null;
  session_replaced?: boolean;
  previous_session_token?: string | null;
};

async function postPublic<T>(
  path: string,
  body: Record<string, unknown>,
  accessToken: string
): Promise<CatalogFetchResult<T | null>> {
  const base = commercialApiBase();
  const url = `${base}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...commercialHeaders(accessToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });
    let json: LicenseEnvelope<T> = {};
    try {
      json = (await res.json()) as LicenseEnvelope<T>;
    } catch {
      json = { success: false, message: "Invalid response from License Engine." };
    }

    if (!res.ok || json.success === false) {
      return {
        ok: false,
        status: res.status,
        message: publicUpstreamMessage(
          json.message || json.error?.message,
          res.status,
          `License Engine request failed (${res.status}).`,
          json.code || json.error?.code
        ),
        data: (json.data as T) ?? null,
      };
    }

    return {
      ok: true,
      status: res.status,
      message: json.message || "OK",
      data: (json.data as T) ?? null,
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return emptyResult(
      null,
      toPublicError(
        friendlyNetworkError(
          error,
          aborted
            ? "The request timed out. Please retry."
            : "Something went wrong. Please try again later."
        ),
        aborted ? 504 : 502
      ).message,
      aborted ? 504 : 502
    );
  } finally {
    clearTimeout(timeout);
  }
}

/** Start renewal checkout for an existing subscription. */
export async function requestSubscriptionRenewal(
  accessToken: string,
  subscriptionId: string,
  body?: { gateway?: string; success_url?: string; cancel_url?: string }
) {
  return postPublic<BillingCheckoutSession>(
    `/v1/public/billing/subscriptions/${encodeURIComponent(subscriptionId)}/renew`,
    {
      gateway: body?.gateway || "bank",
      success_url: body?.success_url,
      cancel_url: body?.cancel_url,
    },
    accessToken
  );
}

/** Schedule cancel at end of current billing period (portal self-service). */
export async function requestSubscriptionCancel(
  accessToken: string,
  subscriptionId: string,
  body?: { notes?: string }
) {
  return postPublic<CommercialSubscription>(
    `/v1/public/billing/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
    { notes: body?.notes },
    accessToken
  );
}

/** Re-enable auto-renewal before a scheduled cancel takes effect. */
export async function requestSubscriptionResumeRenewal(
  accessToken: string,
  subscriptionId: string
) {
  return postPublic<CommercialSubscription>(
    `/v1/public/billing/subscriptions/${encodeURIComponent(subscriptionId)}/resume-renewal`,
    {},
    accessToken
  );
}

/** Request an Engine-authorized plan change; the Engine determines upgrade/downgrade policy. */
export async function requestPlanChange(
  accessToken: string,
  body: {
    subscription_id: string;
    to_plan_id: string;
    timing?: "immediate" | "end_of_period" | "scheduled";
    gateway?: string;
    success_url?: string;
    cancel_url?: string;
    billing_cycle?: string;
    industry_id?: string;
    category_id?: string;
    business_category_id?: string;
    business_profile_id?: string;
    notes?: string;
  }
) {
  return postPublic<{
    plan_change?: unknown;
    checkout?: BillingCheckoutSession;
    applied?: boolean;
  }>("/v1/public/billing/plan-changes", {
    subscription_id: body.subscription_id,
    to_plan_id: body.to_plan_id,
    timing: body.timing || "immediate",
    gateway: body.gateway || "bank",
    success_url: body.success_url,
    cancel_url: body.cancel_url,
    billing_cycle: body.billing_cycle,
    industry_id: body.industry_id,
    category_id: body.category_id || body.business_category_id,
    business_category_id: body.business_category_id || body.category_id,
    business_profile_id: body.business_profile_id,
    notes: body.notes,
  }, accessToken);
}

/**
 * Create an upgrade checkout session for an existing Custom ERP subscription.
 * Lets portal customers add modules / feature packs / change limits without
 * returning to the public marketing builder.
 */
export async function requestCustomErpUpgrade(
  accessToken: string,
  body: {
    subscription_id: string;
    selected_modules: string[];
    selected_feature_packs?: string[];
    user_limit?: number | null;
    company_limit?: number | null;
    branch_limit?: number | null;
    warehouse_limit?: number | null;
    billing_cycle?: string;
    coupon?: string | null;
    gateway?: string;
    success_url?: string;
    cancel_url?: string;
  }
) {
  return postPublic<{
    session_token: string;
    amount: number;
    currency: string;
    quote: unknown;
    applied_without_payment?: boolean;
    removed_modules?: string[];
    removed_feature_packs?: string[];
  }>(
    "/v1/public/billing/custom-erp-upgrade",
    {
      subscription_id: body.subscription_id,
      selected_modules: body.selected_modules,
      selected_feature_packs: body.selected_feature_packs ?? [],
      user_limit: body.user_limit,
      company_limit: body.company_limit,
      branch_limit: body.branch_limit,
      warehouse_limit: body.warehouse_limit,
      billing_cycle: body.billing_cycle,
      coupon: body.coupon,
      gateway: body.gateway || "bank",
      success_url: body.success_url,
      cancel_url: body.cancel_url,
    },
    accessToken
  );
}

/** Custom ERP upgrade — whether coupon field may be shown (first post-purchase upgrade guard). */
export async function fetchCustomErpUpgradeCouponVisibility(accessToken: string) {
  return getPublic<{ coupon_field_visible: boolean }>(
    "/v1/public/billing/custom-erp-upgrade/coupon-visibility",
    undefined,
    { accessToken, revalidate: false }
  );
}

/**
 * Add a new place / subscription under the same customer identity.
 * Tries known Engine paths; returns first successful response.
 */
export async function requestAdditionalSubscription(
  accessToken: string,
  body: {
    plan_id: string;
    product_id?: string;
    industry_id: string;
    category_id: string;
    business_category_id?: string;
    business_profile_id?: string;
    billing_cycle: string;
    gateway?: string;
    success_url?: string;
    cancel_url?: string;
    company_name?: string;
    notes?: string;
  }
) {
  const payload = {
    plan_id: body.plan_id,
    product_id: body.product_id,
    industry_id: body.industry_id,
    category_id: body.category_id,
    business_category_id: body.business_category_id || body.category_id,
    business_profile_id: body.business_profile_id,
    billing_cycle: body.billing_cycle,
    gateway: body.gateway || "bank",
    success_url: body.success_url,
    cancel_url: body.cancel_url,
    company_name: body.company_name,
    notes: body.notes,
    purpose: "new_place",
    mode: "additional_subscription",
  };

  const paths = [
    "/v1/public/billing/additional-subscriptions",
    "/v1/public/billing/subscriptions/additional",
    "/v1/identity/subscriptions/additional",
    "/v1/public/billing/subscriptions",
  ];

  let last: Awaited<ReturnType<typeof postPublic<{
    subscription?: unknown;
    license?: unknown;
    checkout?: BillingCheckoutSession;
    applied?: boolean;
  }>>> | null = null;

  for (const path of paths) {
    const result = await postPublic<{
      subscription?: unknown;
      license?: unknown;
      checkout?: BillingCheckoutSession;
      applied?: boolean;
    }>(path, payload, accessToken);
    last = result;
    if (result.ok && result.data) return result;
    // 404/405 = path not mounted yet — try next. Other errors (validation) stop early.
    if (result.status && result.status !== 404 && result.status !== 405) {
      return result;
    }
  }

  return (
    last ||
    emptyResult(
      null,
      "Additional place checkout is not available on License Engine yet.",
      501
    )
  );
}

export async function fetchCheckoutSession(
  accessToken: string,
  sessionToken: string
) {
  return getPublic<BillingCheckoutSession>(
    `/v1/public/billing/checkout/${encodeURIComponent(sessionToken)}`,
    undefined,
    { revalidate: false, accessToken }
  );
}

export async function confirmCheckoutSession(
  accessToken: string,
  sessionToken: string,
  body?: { reference?: string; gateway?: string }
) {
  return postPublic(
    `/v1/public/billing/checkout/${encodeURIComponent(sessionToken)}/confirm`,
    {
      reference: body?.reference,
      gateway: body?.gateway,
    },
    accessToken
  );
}

export type CustomerBillingNotification = {
  id: string;
  type?: string | null;
  category?: string | null;
  title: string;
  message?: string | null;
  body?: string | null;
  link?: string | null;
  is_read?: boolean | number;
  read?: boolean;
  created_at?: string;
  entity_type?: string | null;
  entity_id?: string | null;
};

async function patchPublic<T>(
  path: string,
  accessToken: string,
  body?: Record<string, unknown>
): Promise<CatalogFetchResult<T | null>> {
  const base = commercialApiBase();
  const url = `${base}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        ...commercialHeaders(accessToken),
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: controller.signal,
    });
    let json: LicenseEnvelope<T> = {};
    try {
      json = (await res.json()) as LicenseEnvelope<T>;
    } catch {
      json = { success: false, message: "Invalid response from License Engine." };
    }

    if (!res.ok || json.success === false) {
      return {
        ok: false,
        status: res.status,
        message: publicUpstreamMessage(
          json.message || json.error?.message,
          res.status,
          `License Engine request failed (${res.status}).`,
          json.code || json.error?.code
        ),
        data: (json.data as T) ?? null,
      };
    }

    return {
      ok: true,
      status: res.status,
      message: json.message || "OK",
      data: (json.data as T) ?? null,
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return emptyResult(
      null,
      toPublicError(
        friendlyNetworkError(
          error,
          aborted
            ? "The request timed out. Please retry."
            : "Something went wrong. Please try again later."
        ),
        aborted ? 504 : 502
      ).message,
      aborted ? 504 : 502
    );
  } finally {
    clearTimeout(timeout);
  }
}

/** Customer portal notifications (billing/license/payment) — public billing API. */
export async function fetchCustomerNotifications(
  accessToken: string,
  query?: { filter?: string; type?: string; page?: number; limit?: number }
) {
  const result = await getPublicPaginated<CustomerBillingNotification>(
    "/v1/public/billing/notifications",
    {
      filter: query?.filter,
      type: query?.type,
      page: query?.page != null ? String(query.page) : undefined,
      limit: query?.limit != null ? String(query.limit) : undefined,
    },
    accessToken
  );
  return result;
}

export async function markCustomerNotificationRead(
  accessToken: string,
  notificationId: string
) {
  return patchPublic(
    `/v1/public/billing/notifications/${encodeURIComponent(notificationId)}/read`,
    accessToken
  );
}

export async function markAllCustomerNotificationsRead(accessToken: string) {
  return patchPublic("/v1/public/billing/notifications/read-all", accessToken);
}

export async function fetchMyInvoice(accessToken: string, invoiceId: string) {
  return getPublic<CommercialInvoice>(
    `/v1/public/billing/invoices/${encodeURIComponent(invoiceId)}`,
    undefined,
    { revalidate: false, accessToken }
  );
}

export async function fetchBillingGateways(accessToken: string) {
  const result = await getPublic<
    Array<{ id: string; label: string; configured: boolean; online: boolean }>
  >("/v1/public/billing/gateways", undefined, {
    revalidate: false,
    accessToken,
  });
  return { ...result, data: asArray(result.data) };
}

export async function fetchBillingCompany(accessToken: string) {
  return getPublic<Record<string, unknown>>("/v1/public/billing/company", undefined, {
    revalidate: false,
    accessToken,
  });
}

export async function fetchBillingDashboard(accessToken: string) {
  return getPublic<Record<string, unknown>>("/v1/public/billing/dashboard", undefined, {
    revalidate: false,
    accessToken,
  });
}

export async function fetchBillingUsage(accessToken: string) {
  return getPublic<{
    licenses?: unknown[];
    identities?: unknown[];
    users?: Array<{
      id: string;
      email?: string | null;
      username?: string | null;
      full_name?: string | null;
      phone?: string | null;
      photo_url?: string | null;
      status?: string | null;
      email_verified_at?: string | null;
      last_login_at?: string | null;
      created_at?: string | null;
      source?: string | null;
    }>;
    activations?: unknown[];
  }>("/v1/public/billing/usage", undefined, {
    revalidate: false,
    accessToken,
  });
}

export async function requestTrialConvert(
  accessToken: string,
  body: {
    subscription_id?: string;
    license_id?: string;
    billing_cycle: string;
    plan_id?: string;
    gateway?: string;
    success_url?: string;
    cancel_url?: string;
  }
) {
  return postPublic<BillingCheckoutSession>(
    "/v1/public/billing/trial-convert",
    {
      subscription_id: body.subscription_id,
      license_id: body.license_id,
      billing_cycle: body.billing_cycle,
      plan_id: body.plan_id,
      gateway: body.gateway,
      success_url: body.success_url,
      cancel_url: body.cancel_url,
    },
    accessToken
  );
}

/** Build same-origin proxy URLs for invoice PDF/print (cookies stay on website). */
export function portalInvoicePdfPath(invoiceId: string) {
  return `/api/portal/invoices/${encodeURIComponent(invoiceId)}/pdf`;
}

export function portalInvoiceDocumentPath(invoiceId: string) {
  return `/api/portal/invoices/${encodeURIComponent(invoiceId)}/document`;
}

/** Prefer the primary ERP product when the catalog spans multiple products. */
export function resolvePrimaryProductSlug(
  products: CatalogProduct[],
  preferred?: string
): string | undefined {
  if (preferred?.trim()) return preferred.trim();
  const match = products.find(
    (p) =>
      /waamto[-_]?erp/i.test(p.slug) ||
      /WAAMTO_ERP/i.test(p.product_code || "") ||
      /\berp\b/i.test(p.name)
  );
  return match?.slug;
}

/** Aggregate public catalog for home / pricing pages. */
export async function fetchPublicCatalogBundle(
  productSlug?: string,
  options?: { fresh?: boolean }
) {
  const knownSlug = productSlug?.trim() || undefined;
  const fresh = Boolean(options?.fresh);

  // When the caller already knows the product, overlap products with catalog GETs.
  let products: Awaited<ReturnType<typeof fetchPublicProducts>>;
  let preferredSlug: string | undefined;
  let plans: Awaited<ReturnType<typeof fetchPublicPlans>>;
  let pricing: Awaited<ReturnType<typeof fetchPublicPricing>>;
  let comparison: Awaited<ReturnType<typeof fetchPublicPlanComparison>>;
  let industries: Awaited<ReturnType<typeof fetchPublicIndustries>>;

  if (knownSlug) {
    preferredSlug = knownSlug;
    [products, plans, pricing, comparison, industries] = await Promise.all([
      fetchPublicProducts(),
      fetchPublicPlans(preferredSlug, { fresh }),
      fetchPublicPricing(preferredSlug, { fresh }),
      fetchPublicPlanComparison({ product: preferredSlug, fresh }),
      fetchPublicIndustries(),
    ]);
  } else {
    products = await fetchPublicProducts();
    preferredSlug = resolvePrimaryProductSlug(products.data) || undefined;
    [plans, pricing, comparison, industries] = await Promise.all([
      fetchPublicPlans(preferredSlug, { fresh }),
      fetchPublicPricing(preferredSlug, { fresh }),
      fetchPublicPlanComparison({ product: preferredSlug, fresh }),
      fetchPublicIndustries(),
    ]);
  }
  let resolvedSlug = preferredSlug || null;

  // Fall back to full catalog if the preferred product filter returns nothing
  // (Engine down for filtered route, or slug mismatch). Parallelize needed fallbacks.
  const needPlansFallback =
    Boolean(preferredSlug) &&
    ((plans.ok && plans.data.length === 0) ||
      (!plans.ok && plans.data.length === 0));
  const needPricingFallback =
    Boolean(preferredSlug) &&
    ((pricing.ok && pricing.data.length === 0) ||
      (!pricing.ok && pricing.data.length === 0));
  const needComparisonFallback =
    Boolean(preferredSlug) &&
    (!comparison.ok || comparison.data.comparison.length === 0);

  if (needPlansFallback || needPricingFallback || needComparisonFallback) {
    const [allPlans, allPricing, allComparison] = await Promise.all([
      needPlansFallback ? fetchPublicPlans(undefined, { fresh }) : Promise.resolve(null),
      needPricingFallback
        ? fetchPublicPricing(undefined, { fresh })
        : Promise.resolve(null),
      needComparisonFallback
        ? fetchPublicPlanComparison({ fresh })
        : Promise.resolve(null),
    ]);

    if (allPlans && allPlans.data.length > 0) {
      const filtered = allPlans.data.filter(
        (p) => p.product_slug === preferredSlug
      );
      plans = {
        ...allPlans,
        data: filtered.length > 0 ? filtered : allPlans.data,
        ok: allPlans.ok || filtered.length > 0,
      };
      if (filtered.length === 0) resolvedSlug = null;
    }

    if (allPricing && allPricing.data.length > 0) {
      const filtered = allPricing.data.filter(
        (p) => p.product_slug === preferredSlug
      );
      pricing = {
        ...allPricing,
        data: filtered.length > 0 ? filtered : allPricing.data,
        ok: allPricing.ok || filtered.length > 0,
      };
    }

    if (allComparison && allComparison.data.comparison.length > 0) {
      const filtered = allComparison.data.comparison.filter(
        (row) => row.plan.product_slug === preferredSlug
      );
      comparison = {
        ...allComparison,
        ok: allComparison.ok || filtered.length > 0,
        data:
          filtered.length > 0
            ? {
                plans: filtered.map((r) => r.plan),
                comparison: filtered,
                limit_keys: allComparison.data.limit_keys,
                dimensions: allComparison.data.dimensions,
                feature_matrix: allComparison.data.feature_matrix,
                hierarchy: allComparison.data.hierarchy,
              }
            : allComparison.data,
      };
    }
  }

  const ok =
    (products.ok && products.data.length > 0) ||
    (plans.ok && plans.data.length > 0) ||
    (pricing.ok && pricing.data.length > 0) ||
    (industries.ok && industries.data.length > 0) ||
    products.ok ||
    plans.ok ||
    pricing.ok ||
    industries.ok;
  const message = !(products.ok && plans.ok && pricing.ok && industries.ok)
    ? products.message ||
      plans.message ||
      pricing.message ||
      industries.message ||
      "Partial catalog response."
    : "OK";

  return {
    ok,
    message: ok
      ? products.ok && plans.ok && pricing.ok && industries.ok
        ? "OK"
        : message
      : message,
    products: products.data,
    plans: plans.data,
    pricing: pricing.data,
    industries: industries.data,
    comparison: comparison.data,
    productSlug: resolvedSlug,
    meta: {
      productsOk: products.ok,
      plansOk: plans.ok,
      pricingOk: pricing.ok,
      industriesOk: industries.ok,
      comparisonOk: comparison.ok,
      partial: ok && !(products.ok && plans.ok && pricing.ok && industries.ok),
    },
  };
}

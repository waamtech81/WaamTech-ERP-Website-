import {
  CATALOG_REVALIDATE_SECONDS,
  commercialApiBase,
  commercialHeaders,
} from "@/lib/commercial/config";
import { toPublicError } from "@/lib/api/errors";
import { logApiError } from "@/lib/api/logger";
import { friendlyNetworkError } from "@/lib/network/errors";
import type {
  CatalogBusinessCategory,
  CatalogBusinessProfile,
  CatalogBusinessType,
  CatalogComparisonBundle,
  CatalogFetchResult,
  CatalogIndustry,
  CatalogPlan,
  CatalogPlanLimits,
  CatalogPricing,
  CatalogProduct,
  CommercialInvoice,
  CommercialPayment,
  CommercialRenewal,
  CommercialSubscription,
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
  return toPublicError(technical, status, { code }).message;
}

async function getPublic<T>(
  path: string,
  query?: Record<string, string | undefined>,
  options?: { revalidate?: number | false; accessToken?: string }
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
    const fetchInit: RequestInit & { next?: { revalidate?: number } } = {
      method: "GET",
      headers: commercialHeaders(options?.accessToken),
      signal: controller.signal,
    };

    if (options?.revalidate === false || options?.accessToken) {
      fetchInit.cache = "no-store";
    } else {
      fetchInit.next = {
        revalidate:
          typeof options?.revalidate === "number"
            ? options.revalidate
            : CATALOG_REVALIDATE_SECONDS,
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

export async function fetchPublicProducts(): Promise<CatalogFetchResult<CatalogProduct[]>> {
  const result = await getPublic<CatalogProduct[]>("/v1/public/catalog/products");
  return { ...result, data: asArray(result.data) };
}

export async function fetchPublicPlans(
  productSlug?: string
): Promise<CatalogFetchResult<CatalogPlan[]>> {
  const result = await getPublic<CatalogPlan[]>("/v1/public/catalog/plans", {
    product: productSlug,
  });
  return { ...result, data: asArray(result.data) };
}

export async function fetchPublicPricing(
  productSlug?: string
): Promise<CatalogFetchResult<CatalogPricing[]>> {
  const result = await getPublic<CatalogPricing[]>("/v1/public/catalog/pricing", {
    product: productSlug,
  });
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
}): Promise<CatalogFetchResult<CatalogComparisonBundle>> {
  const result = await getPublic<CatalogComparisonBundle>(
    "/v1/public/catalog/plans/comparison",
    {
      product: opts?.product,
      ids: opts?.ids?.length ? opts.ids.join(",") : undefined,
    }
  );
  return {
    ...result,
    data: result.data || { plans: [], comparison: [], limit_keys: [] },
  };
}

/** Registry lists must not rely on Engine default pagination (historically 100). */
const REGISTRY_PAGE_LIMIT = "500";

export async function fetchPublicIndustries(): Promise<
  CatalogFetchResult<CatalogIndustry[]>
> {
  const result = await getPublic<CatalogIndustry[]>("/v1/public/catalog/industries", {
    limit: REGISTRY_PAGE_LIMIT,
  });
  return { ...result, data: asArray(result.data) };
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

/** Request plan upgrade (Engine rejects downgrades when filtered client-side). */
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
    subscription_id: string;
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
export async function fetchPublicCatalogBundle(productSlug?: string) {
  const products = await fetchPublicProducts();
  const preferredSlug =
    productSlug || resolvePrimaryProductSlug(products.data) || undefined;

  let plans = await fetchPublicPlans(preferredSlug);
  let pricing = await fetchPublicPricing(preferredSlug);
  let comparison = await fetchPublicPlanComparison({ product: preferredSlug });
  let resolvedSlug = preferredSlug || null;

  // Fall back to full catalog if the preferred product filter returns nothing
  // (Engine down for filtered route, or slug mismatch).
  if (
    preferredSlug &&
    ((plans.ok && plans.data.length === 0) ||
      (!plans.ok && plans.data.length === 0))
  ) {
    const allPlans = await fetchPublicPlans();
    if (allPlans.data.length > 0) {
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
  }

  if (
    preferredSlug &&
    ((pricing.ok && pricing.data.length === 0) ||
      (!pricing.ok && pricing.data.length === 0))
  ) {
    const allPricing = await fetchPublicPricing();
    if (allPricing.data.length > 0) {
      const filtered = allPricing.data.filter(
        (p) => p.product_slug === preferredSlug
      );
      pricing = {
        ...allPricing,
        data: filtered.length > 0 ? filtered : allPricing.data,
        ok: allPricing.ok || filtered.length > 0,
      };
    }
  }

  if (
    preferredSlug &&
    (!comparison.ok || comparison.data.comparison.length === 0)
  ) {
    const allComparison = await fetchPublicPlanComparison();
    if (allComparison.data.comparison.length > 0) {
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
              }
            : allComparison.data,
      };
    }
  }

  const industries = await fetchPublicIndustries();

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

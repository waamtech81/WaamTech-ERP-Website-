import {
  CATALOG_REVALIDATE_SECONDS,
  commercialApiBase,
  commercialHeaders,
} from "@/lib/commercial/config";
import { friendlyNetworkError } from "@/lib/network/errors";
import type {
  CatalogBusinessCategory,
  CatalogBusinessProfile,
  CatalogFetchResult,
  CatalogIndustry,
  CatalogPlan,
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
        message:
          json.message ||
          json.error?.message ||
          `License Engine request failed (${res.status}).`,
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
      friendlyNetworkError(
        error,
        aborted
          ? "License Engine timed out. Please retry."
          : "Could not reach License Engine."
      ),
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
        message:
          json.message ||
          json.error?.message ||
          `License Engine request failed (${res.status}).`,
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
    return {
      ok: false,
      status: aborted ? 504 : 502,
      message: friendlyNetworkError(
        error,
        aborted
          ? "License Engine timed out. Please retry."
          : "Could not reach License Engine."
      ),
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

export async function fetchPublicIndustries(): Promise<
  CatalogFetchResult<CatalogIndustry[]>
> {
  const result = await getPublic<CatalogIndustry[]>("/v1/public/catalog/industries");
  return { ...result, data: asArray(result.data) };
}

export async function fetchPublicBusinessCategories(
  industryId?: string
): Promise<CatalogFetchResult<CatalogBusinessCategory[]>> {
  const result = await getPublic<CatalogBusinessCategory[]>(
    "/v1/public/catalog/business-categories",
    { industry_id: industryId }
  );
  return { ...result, data: asArray(result.data) };
}

export async function fetchPublicBusinessProfiles(
  categoryId?: string
): Promise<CatalogFetchResult<CatalogBusinessProfile[]>> {
  const result = await getPublic<CatalogBusinessProfile[]>(
    "/v1/public/catalog/business-profiles",
    { category_id: categoryId }
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

/** Aggregate public catalog for home / pricing pages. */
export async function fetchPublicCatalogBundle(productSlug?: string) {
  const [products, plans, pricing, industries] = await Promise.all([
    fetchPublicProducts(),
    fetchPublicPlans(productSlug),
    fetchPublicPricing(productSlug),
    fetchPublicIndustries(),
  ]);

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
    ? products.message || plans.message || pricing.message || industries.message || "Partial catalog response."
    : "OK";

  return {
    ok,
    message: ok ? (products.ok && plans.ok && pricing.ok && industries.ok ? "OK" : message) : message,
    products: products.data,
    plans: plans.data,
    pricing: pricing.data,
    industries: industries.data,
    meta: {
      productsOk: products.ok,
      plansOk: plans.ok,
      pricingOk: pricing.ok,
      industriesOk: industries.ok,
      partial: ok && !(products.ok && plans.ok && pricing.ok && industries.ok),
    },
  };
}

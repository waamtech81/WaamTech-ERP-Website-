"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { swrGet, swrInvalidate } from "@/lib/commercial/swr-cache";
import type {
  CatalogBusinessCategory,
  CatalogBusinessProfile,
  CatalogIndustry,
  CatalogPlan,
  CatalogPricing,
  CatalogProduct,
} from "@/lib/commercial/types";
import type { PricingPlan, Product } from "@/types";

export type CommercialQueryState<T> = {
  data: T;
  loading: boolean;
  error: string | null;
  empty: boolean;
  stale: boolean;
  retry: () => void;
};

export type CatalogBundle = {
  products: CatalogProduct[];
  plans: CatalogPlan[];
  pricing: CatalogPricing[];
  industries: CatalogIndustry[];
  pricingPlans: PricingPlan[];
  cardPlans: PricingPlan[];
  featuredProducts: Product[];
  popularPlans: PricingPlan[];
  enterprise: PricingPlan | null;
  meta?: Record<string, boolean>;
};

const EMPTY_ARRAY: never[] = [];
const EMPTY_BUNDLE: CatalogBundle = {
  products: [],
  plans: [],
  pricing: [],
  industries: [],
  pricingPlans: [],
  cardPlans: [],
  featuredProducts: [],
  popularPlans: [],
  enterprise: null,
};

async function browserFetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    const json = (await res.json()) as {
      success?: boolean;
      message?: string;
      data?: T;
    };
    if (!res.ok || json.success === false) {
      throw new Error(json.message || `Request failed (${res.status})`);
    }
    return json.data as T;
  } finally {
    clearTimeout(timeout);
  }
}

function isEmptyData(data: unknown): boolean {
  if (data == null) return true;
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === "object") return Object.keys(data as object).length === 0;
  return false;
}

/**
 * Client hook with stale-while-revalidate caching for commercial BFF routes.
 */
export function useCommercialQuery<T>(
  key: string | null,
  path: string | null,
  emptyValue: T
): CommercialQueryState<T> {
  const emptyRef = useRef(emptyValue);
  emptyRef.current = emptyValue;

  const [data, setData] = useState<T>(emptyValue);
  const [loading, setLoading] = useState(Boolean(key && path));
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const gen = useRef(0);

  const load = useCallback(async () => {
    if (!key || !path) {
      setData(emptyRef.current);
      setLoading(false);
      setError(null);
      setStale(false);
      return;
    }

    const runId = ++gen.current;
    setLoading(true);
    setError(null);

    try {
      const result = await swrGet(key, () => browserFetchJson<T>(path));
      if (runId !== gen.current) return;
      setData(result.data ?? emptyRef.current);
      setStale(result.stale);
      setError(null);
    } catch (err) {
      if (runId !== gen.current) return;
      setError(err instanceof Error ? err.message : "Unable to load commercial data.");
    } finally {
      if (runId === gen.current) setLoading(false);
    }
  }, [key, path]);

  useEffect(() => {
    void load();
  }, [load]);

  const retry = useCallback(() => {
    if (key) swrInvalidate(key);
    void load();
  }, [key, load]);

  return {
    data,
    loading,
    error,
    empty: !loading && !error && isEmptyData(data),
    stale,
    retry,
  };
}

export function useCatalogProducts() {
  return useCommercialQuery<CatalogProduct[]>(
    "catalog:products",
    "/api/commercial/products",
    EMPTY_ARRAY as unknown as CatalogProduct[]
  );
}

export function useCatalogPlans(productSlug?: string | null) {
  const qs = productSlug ? `?product=${encodeURIComponent(productSlug)}` : "";
  const key = productSlug ? `catalog:plans:${productSlug}` : "catalog:plans";
  return useCommercialQuery<CatalogPlan[]>(
    key,
    `/api/commercial/plans${qs}`,
    EMPTY_ARRAY as unknown as CatalogPlan[]
  );
}

export function useCatalogPricing(productSlug?: string | null) {
  const qs = productSlug ? `?product=${encodeURIComponent(productSlug)}` : "";
  const key = productSlug ? `catalog:pricing:${productSlug}` : "catalog:pricing";
  return useCommercialQuery<CatalogPricing[]>(
    key,
    `/api/commercial/pricing${qs}`,
    EMPTY_ARRAY as unknown as CatalogPricing[]
  );
}

export function useCatalogIndustries() {
  return useCommercialQuery<CatalogIndustry[]>(
    "catalog:industries",
    "/api/commercial/industries",
    EMPTY_ARRAY as unknown as CatalogIndustry[]
  );
}

export function useCatalogBusinessCategories(industryId?: string | null) {
  const enabled = Boolean(industryId);
  const qs = industryId ? `?industry_id=${encodeURIComponent(industryId)}` : "";
  return useCommercialQuery<CatalogBusinessCategory[]>(
    enabled ? `catalog:categories:${industryId}` : null,
    enabled ? `/api/commercial/business-categories${qs}` : null,
    EMPTY_ARRAY as unknown as CatalogBusinessCategory[]
  );
}

export function useCatalogBusinessProfiles(categoryId?: string | null) {
  const enabled = Boolean(categoryId);
  const qs = categoryId ? `?category_id=${encodeURIComponent(categoryId)}` : "";
  return useCommercialQuery<CatalogBusinessProfile[]>(
    enabled ? `catalog:profiles:${categoryId}` : null,
    enabled ? `/api/commercial/business-profiles${qs}` : null,
    EMPTY_ARRAY as unknown as CatalogBusinessProfile[]
  );
}

export function useCatalogBundle(productSlug?: string | null) {
  const qs = productSlug ? `?product=${encodeURIComponent(productSlug)}` : "";
  return useCommercialQuery<CatalogBundle>(
    productSlug ? `catalog:bundle:${productSlug}` : "catalog:bundle",
    `/api/commercial/catalog${qs}`,
    EMPTY_BUNDLE
  );
}
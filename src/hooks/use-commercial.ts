"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { swrGet, swrInvalidate, swrPeek } from "@/lib/commercial/swr-cache";
import {
  friendlyNetworkError,
  isOffline,
  statusToFriendlyMessage,
} from "@/lib/network/errors";
import type {
  CatalogBusinessCategory,
  CatalogBusinessProfile,
  CatalogComparisonBundle,
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
  offline: boolean;
  retry: () => void;
};

export type CatalogBundle = {
  products: CatalogProduct[];
  plans: CatalogPlan[];
  pricing: CatalogPricing[];
  industries: CatalogIndustry[];
  comparison?: CatalogComparisonBundle | null;
  productSlug?: string | null;
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
  comparison: null,
  productSlug: null,
  pricingPlans: [],
  cardPlans: [],
  featuredProducts: [],
  popularPlans: [],
  enterprise: null,
};

async function browserFetchJson<T>(url: string): Promise<T> {
  if (isOffline()) {
    throw new Error("You appear to be offline. Check your connection and try again.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    let json: { success?: boolean; message?: string; data?: T } = {};
    try {
      json = (await res.json()) as typeof json;
    } catch {
      throw new Error(statusToFriendlyMessage(res.status || 502));
    }

    if (!res.ok || json.success === false) {
      throw new Error(statusToFriendlyMessage(res.status, json.message));
    }
    return json.data as T;
  } catch (error) {
    throw new Error(friendlyNetworkError(error, "Unable to load commercial data."));
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
  const [offline, setOffline] = useState(false);
  const gen = useRef(0);

  const load = useCallback(async () => {
    if (!key || !path) {
      setData(emptyRef.current);
      setLoading(false);
      setError(null);
      setStale(false);
      setOffline(false);
      return;
    }

    const runId = ++gen.current;
    const peeked = key ? swrPeek<T>(key) : undefined;
    // Keep showing cached data while revalidating — avoids skeleton flash / layout jolt.
    if (peeked != null) {
      setData(peeked);
      setStale(true);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);
    setOffline(isOffline());

    try {
      const result = await swrGet(key, () => browserFetchJson<T>(path));
      if (runId !== gen.current) return;
      setData(result.data ?? emptyRef.current);
      setStale(result.stale);
      setError(null);
      setOffline(false);
    } catch (err) {
      if (runId !== gen.current) return;
      const cached = swrPeek<T>(key) ?? peeked;
      if (cached != null) {
        setData(cached);
        setStale(true);
      }
      setOffline(isOffline());
      setError(friendlyNetworkError(err, "Unable to load commercial data."));
    } finally {
      if (runId === gen.current) setLoading(false);
    }
  }, [key, path]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onOnline = () => {
      setOffline(false);
      void load();
    };
    const onOffline = () => setOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
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
    offline,
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
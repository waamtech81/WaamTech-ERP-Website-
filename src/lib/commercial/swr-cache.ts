import {
  CATALOG_MAX_AGE_MS,
  CATALOG_STALE_MS,
} from "@/lib/commercial/config";

type CacheEntry<T> = {
  data: T;
  fetchedAt: number;
  promise?: Promise<T>;
};

const memory = new Map<string, CacheEntry<unknown>>();

/**
 * Stale-while-revalidate cache for browser commercial fetches.
 * Returns fresh data when young, stale data while refreshing in background,
 * and awaits network when empty or past hard max-age.
 */
export async function swrGet<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { staleMs?: number; maxAgeMs?: number }
): Promise<{ data: T; stale: boolean }> {
  const staleMs = options?.staleMs ?? CATALOG_STALE_MS;
  const maxAgeMs = options?.maxAgeMs ?? CATALOG_MAX_AGE_MS;
  const now = Date.now();
  const entry = memory.get(key) as CacheEntry<T> | undefined;

  if (entry?.data != null) {
    const age = now - entry.fetchedAt;
    if (age < staleMs) {
      return { data: entry.data, stale: false };
    }
    if (age < maxAgeMs) {
      void revalidate(key, fetcher).catch(() => {
        /* keep serving stale snapshot */
      });
      return { data: entry.data, stale: true };
    }
  }

  try {
    const data = await revalidate(key, fetcher);
    return { data, stale: false };
  } catch (error) {
    // Past hard max-age but network failed — keep last good snapshot if any.
    if (entry?.data != null) {
      return { data: entry.data, stale: true };
    }
    throw error;
  }
}

async function revalidate<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = memory.get(key) as CacheEntry<T> | undefined;
  if (existing?.promise) return existing.promise;

  const promise = fetcher()
    .then((data) => {
      memory.set(key, { data, fetchedAt: Date.now() });
      return data;
    })
    .catch((error) => {
      // Preserve prior snapshot; drop in-flight promise so the next call can retry.
      const cur = memory.get(key) as CacheEntry<T> | undefined;
      if (cur) {
        memory.set(key, { data: cur.data, fetchedAt: cur.fetchedAt });
      }
      throw error;
    })
    .finally(() => {
      const cur = memory.get(key) as CacheEntry<T> | undefined;
      if (cur) delete cur.promise;
    });

  memory.set(key, {
    data: (existing?.data as T) ?? (undefined as unknown as T),
    fetchedAt: existing?.fetchedAt ?? 0,
    promise,
  });

  return promise;
}

export function swrPeek<T>(key: string): T | null {
  const entry = memory.get(key) as CacheEntry<T> | undefined;
  return entry?.data ?? null;
}

export function swrInvalidate(prefix?: string) {
  if (!prefix) {
    memory.clear();
    return;
  }
  for (const key of memory.keys()) {
    if (key.startsWith(prefix)) memory.delete(key);
  }
}

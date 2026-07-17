/**
 * Pluggable rate-limit storage.
 *
 * Development default: in-process MemoryRateLimitStore.
 * Production (horizontal scale): set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 * to use a distributed store without changing call sites.
 *
 * No infrastructure is hardcoded — unset env keeps memory store.
 */

export type RateLimitHitResult =
  | { ok: true }
  | { ok: false; retryAfter: number };

export interface RateLimitStore {
  hit(key: string, limit: number, windowMs: number): Promise<RateLimitHitResult>;
}

class MemoryRateLimitStore implements RateLimitStore {
  private buckets = new Map<string, { count: number; resetAt: number }>();

  async hit(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitHitResult> {
    const now = Date.now();
    const entry = this.buckets.get(key);

    if (!entry || now > entry.resetAt) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { ok: true };
    }

    if (entry.count >= limit) {
      return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
    }

    entry.count += 1;
    return { ok: true };
  }
}

/**
 * Upstash Redis REST adapter — works in serverless / multi-instance without
 * a TCP Redis client. Uses INCR + EXPIRE for a fixed window per key.
 */
class UpstashRestRateLimitStore implements RateLimitStore {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string
  ) {}

  private async command(parts: (string | number)[]): Promise<unknown> {
    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parts.map(String)),
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Rate limit store HTTP ${res.status}`);
    }
    const json = (await res.json()) as { result?: unknown };
    return json.result;
  }

  async hit(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitHitResult> {
    const redisKey = `rl:${key}`;
    const windowSec = Math.max(1, Math.ceil(windowMs / 1000));

    try {
      const count = Number(await this.command(["INCR", redisKey]));
      if (count === 1) {
        await this.command(["EXPIRE", redisKey, windowSec]);
      }
      if (count > limit) {
        const ttl = Number(await this.command(["TTL", redisKey]));
        return {
          ok: false,
          retryAfter: ttl > 0 ? ttl : windowSec,
        };
      }
      return { ok: true };
    } catch {
      // Fail open to memory for this request path would be unsafe across instances;
      // fail closed with a short retry so misconfigured Redis does not open floodgates.
      return { ok: false, retryAfter: 30 };
    }
  }
}

let cachedStore: RateLimitStore | null = null;

export function getRateLimitStore(): RateLimitStore {
  if (cachedStore) return cachedStore;

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  const preferDistributed =
    process.env.RATE_LIMIT_STORE === "redis" ||
    process.env.RATE_LIMIT_STORE === "upstash" ||
    Boolean(url && token);

  if (preferDistributed && url && token) {
    cachedStore = new UpstashRestRateLimitStore(url.replace(/\/+$/, ""), token);
  } else {
    cachedStore = new MemoryRateLimitStore();
  }

  return cachedStore;
}

/** Test / advanced: replace the store (e.g. inject a mock). */
export function setRateLimitStore(store: RateLimitStore | null) {
  cachedStore = store;
}

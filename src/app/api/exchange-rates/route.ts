import { withApiHandler } from "@/lib/api/handler";
import { apiSuccess } from "@/lib/api/response";
import { getRates, RATE_TTL_SECONDS } from "@/lib/currency/exchange";

/**
 * Public, cacheable USD-based exchange rates for the client currency service.
 */
export const GET = withApiHandler(
  async () => {
    const table = await getRates();
    const res = apiSuccess("OK", {
      extra: { ...table },
    });
    res.headers.set(
      "Cache-Control",
      `public, max-age=300, s-maxage=${RATE_TTL_SECONDS}, stale-while-revalidate=86400`
    );
    return res;
  },
  { endpoint: "/api/exchange-rates" }
);

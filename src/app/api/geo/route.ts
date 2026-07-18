import { withApiHandler } from "@/lib/api/handler";
import { apiSuccess } from "@/lib/api/response";
import { currencyFromCountryCode, resolveRequestCountry } from "@/lib/geo-ip";

function clientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    ""
  );
}

/**
 * Public geo snapshot for the active visitor (IP / CDN headers).
 * Used to auto-select display currency when CDN geo headers are missing.
 */
export const GET = withApiHandler(
  async (req) => {
    const ip = clientIp(req);
    const country = await resolveRequestCountry(req.headers, ip);
    const currency = currencyFromCountryCode(country);

    const res = apiSuccess("OK", {
      extra: {
        country: country || null,
        currency: currency || null,
        ip: ip || null,
      },
    });
    res.headers.set(
      "Cache-Control",
      "private, max-age=300, stale-while-revalidate=3600"
    );
    return res;
  },
  { endpoint: "/api/geo" }
);

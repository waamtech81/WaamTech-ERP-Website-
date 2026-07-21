import { withApiHandler } from "@/lib/api/handler";
import { apiSuccess } from "@/lib/api/response";
import { clientIpFromHeaders } from "@/lib/client-ip";
import { currencyForDetectedCountry, resolveRequestCountry } from "@/lib/geo-ip";

/**
 * Public geo snapshot for the active visitor (IP / CDN headers).
 * Used to auto-select display currency when CDN geo headers are missing.
 */
export const GET = withApiHandler(
  async (req) => {
    const ip = clientIpFromHeaders(req.headers);
    const country = await resolveRequestCountry(req.headers, ip);
    const currency = country ? currencyForDetectedCountry(country) : null;

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

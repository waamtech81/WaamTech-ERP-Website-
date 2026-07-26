import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { apiFail } from "@/lib/api/response";
import {
  getClientIp,
  isSameOrigin,
  rateLimit,
} from "@/lib/security/guards";
import { POST_customPackageQuote } from "../_handlers";

export const POST = withApiHandler(
  async (req) => {
    if (!isSameOrigin(req)) {
      return apiFail("Invalid request origin.", {
        status: 403,
        code: ApiErrorCode.FORBIDDEN,
      });
    }

    const ip = getClientIp(req);
    const limited = await rateLimit(`custom-package-quote:${ip}`, 180, 60_000);
    if (!limited.ok) {
      return apiFail("Too many requests. Please try again later.", {
        status: 429,
        code: ApiErrorCode.RATE_LIMITED,
        headers: { "Retry-After": String(limited.retryAfter) },
      });
    }

    return POST_customPackageQuote(req);
  },
  { endpoint: "/api/commercial/custom-package-quote" }
);

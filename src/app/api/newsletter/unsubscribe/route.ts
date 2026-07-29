import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { logApiError } from "@/lib/api/logger";
import { apiFail, apiSuccess } from "@/lib/api/response";
import { unsubscribeNewsletterOnLicenseServer } from "@/lib/license/newsletter";
import {
  getClientIp,
  isSameOrigin,
  isValidEmail,
  looksLikeBotPayload,
  rateLimit,
  sanitizeText,
} from "@/lib/security/guards";

export const POST = withApiHandler(
  async (request) => {
    if (!isSameOrigin(request)) {
      return apiFail("Invalid request origin.", {
        status: 403,
        code: ApiErrorCode.FORBIDDEN,
      });
    }

    const ip = getClientIp(request);
    const limited = await rateLimit(`newsletter-unsub:${ip}`, 12, 15 * 60_000);
    if (!limited.ok) {
      return apiFail("Too many requests. Please try again later.", {
        status: 429,
        code: ApiErrorCode.RATE_LIMITED,
        headers: { "Retry-After": String(limited.retryAfter) },
      });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    if (looksLikeBotPayload(body)) {
      return apiSuccess("Unsubscribed.");
    }

    const email = sanitizeText(body?.email, 254).toLowerCase();

    if (!email || !isValidEmail(email)) {
      return apiFail("Please enter a valid email address.", {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    }

    const result = await unsubscribeNewsletterOnLicenseServer(email);

    if (!result.ok) {
      logApiError(new Error(result.message || "Newsletter unsubscribe failed"), {
        endpoint: "/api/newsletter/unsubscribe",
        userEmail: email,
        httpStatus: 502,
        technicalMessage: result.message || "Newsletter unsubscribe failed",
      });
      return apiFail("Could not complete unsubscribe. Please try again.", {
        status: 502,
        code: ApiErrorCode.SERVICE_UNAVAILABLE,
      });
    }

    return apiSuccess(
      result.message || "You have been unsubscribed from WAAMTO product updates."
    );
  },
  { endpoint: "/api/newsletter/unsubscribe" }
);

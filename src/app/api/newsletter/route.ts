import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { logApiError } from "@/lib/api/logger";
import { apiFail, apiSuccess } from "@/lib/api/response";
import { sendNewsletterSubscriptionNotice } from "@/lib/auth/email";
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
    const limited = await rateLimit(`newsletter:${ip}`, 8, 15 * 60_000);
    if (!limited.ok) {
      return apiFail("Too many requests. Please try again later.", {
        status: 429,
        code: ApiErrorCode.RATE_LIMITED,
        headers: { "Retry-After": String(limited.retryAfter) },
      });
    }

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    if (looksLikeBotPayload(body)) {
      return apiSuccess("Subscribed.");
    }

    const email = sanitizeText(body?.email, 254).toLowerCase();

    if (!email || !isValidEmail(email)) {
      return apiFail("Please enter a valid email address.", {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    }

    const emailLimited = await rateLimit(
      `newsletter-email:${email}`,
      3,
      60 * 60_000
    );
    if (!emailLimited.ok) {
      return apiFail("Too many requests. Please try again later.", {
        status: 429,
        code: ApiErrorCode.RATE_LIMITED,
        headers: { "Retry-After": String(emailLimited.retryAfter) },
      });
    }

    const result = await sendNewsletterSubscriptionNotice({
      subscriberEmail: email,
    });

    if (!result.sent) {
      logApiError(new Error(result.error || "Newsletter subscribe failed"), {
        endpoint: "/api/newsletter",
        userEmail: email,
        httpStatus: 502,
        technicalMessage: result.error || "Newsletter subscribe failed",
      });
      return apiFail("Could not complete subscription. Please try again.", {
        status: 502,
        code: ApiErrorCode.SERVICE_UNAVAILABLE,
      });
    }

    return apiSuccess("Thanks — you are subscribed to product updates.");
  },
  { endpoint: "/api/newsletter" }
);

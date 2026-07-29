import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { logApiError } from "@/lib/api/logger";
import { apiFail, apiSuccess } from "@/lib/api/response";
import { sendNewsletterThankYouEmail } from "@/lib/auth/email";
import { subscribeNewsletterOnLicenseServer } from "@/lib/license/newsletter";
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

    const stored = await subscribeNewsletterOnLicenseServer(email);

    if (!stored.ok) {
      logApiError(new Error(stored.message || "Newsletter subscribe failed"), {
        endpoint: "/api/newsletter",
        userEmail: email,
        httpStatus: 502,
        technicalMessage: stored.message || "Newsletter subscribe failed",
      });
      return apiFail("Could not complete subscription. Please try again.", {
        status: 502,
        code: ApiErrorCode.SERVICE_UNAVAILABLE,
      });
    }

    const thankYou = await sendNewsletterThankYouEmail({ to: email });
    if (!thankYou.sent) {
      logApiError(new Error(thankYou.error || "Newsletter thank-you email failed"), {
        endpoint: "/api/newsletter",
        userEmail: email,
        httpStatus: 502,
        technicalMessage: thankYou.error || "Newsletter thank-you email failed",
      });
    }

    return apiSuccess(
      stored.message || "Thanks — you are subscribed to product updates."
    );
  },
  { endpoint: "/api/newsletter" }
);

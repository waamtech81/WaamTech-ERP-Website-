import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { logApiError } from "@/lib/api/logger";
import { apiFail, apiSuccess } from "@/lib/api/response";
import { sendContactFormMessage } from "@/lib/auth/email";
import { verifyGoogleRecaptcha } from "@/lib/security/google-recaptcha";
import {
  contactSubjectForIntent,
  parseContactIntent,
} from "@/lib/security/contact-intent";
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
    const limited = await rateLimit(`contact:${ip}`, 5, 15 * 60_000);
    if (!limited.ok) {
      return apiFail("Too many messages. Please try again later.", {
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
      return apiSuccess("Thanks — your message has been sent.");
    }

    const started = Number(body._t || 0);
    if (!started || Date.now() - started < 1500) {
      return apiFail("Please complete the security check carefully.", {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    }

    const name = sanitizeText(body.name, 120);
    const email = sanitizeText(body.email, 254).toLowerCase();
    const company = sanitizeText(body.company, 160);
    const phone = sanitizeText(body.phone, 40);
    const message = sanitizeText(body.message, 4000);
    const recaptchaToken = sanitizeText(
      body.recaptchaToken ?? body.captchaToken,
      4000
    );

    const intent = parseContactIntent(
      typeof body.intent === "string" ? body.intent : null
    );
    const subjectFromIntent = contactSubjectForIntent(intent);
    const subject = subjectFromIntent || sanitizeText(body.subject, 160);

    if (!name || !email || !company || !phone || !subject || !message) {
      return apiFail("Please fill in all required fields.", {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    }

    if (!isValidEmail(email)) {
      return apiFail("Please enter a valid work email.", {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    }

    const captchaResult = await verifyGoogleRecaptcha(recaptchaToken, ip);
    if (!captchaResult.ok) {
      return apiFail(captchaResult.reason, {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    }

    const emailLimited = await rateLimit(`contact-email:${email}`, 3, 60 * 60_000);
    if (!emailLimited.ok) {
      return apiFail(
        "Too many messages from this email. Please try again later.",
        {
          status: 429,
          code: ApiErrorCode.RATE_LIMITED,
          headers: { "Retry-After": String(emailLimited.retryAfter) },
        }
      );
    }

    const result = await sendContactFormMessage({
      name,
      email,
      company,
      phone,
      subject: intent ? `[${intent}] ${subject}` : subject,
      message,
    });

    if (!result.sent) {
      logApiError(new Error(result.error || "Contact email send failed"), {
        endpoint: "/api/contact",
        userEmail: email,
        httpStatus: 502,
        technicalMessage: result.error || "Contact email send failed",
      });
      return apiFail("Could not send your message. Please try again.", {
        status: 502,
        code: ApiErrorCode.SERVICE_UNAVAILABLE,
      });
    }

    return apiSuccess(
      "Thanks — your message has been sent. We'll get back to you soon."
    );
  },
  { endpoint: "/api/contact" }
);

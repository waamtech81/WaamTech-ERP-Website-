import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { apiFail, apiSuccess, upstreamFail } from "@/lib/api/response";
import { authConfig } from "@/lib/auth/config";
import { startRegistrationOnLicenseServer } from "@/lib/license/client";
import {
  isValidCountryCode,
  mergePhoneWithDialCode,
  resolveDialCode,
} from "@/lib/data/countries";
import {
  getClientIp,
  isSameOrigin,
  isValidEmail,
  looksLikeBotPayload,
  rateLimit,
  sanitizeText,
} from "@/lib/security/guards";
import { validateSignupCommercialSelection } from "@/lib/signup/validate-commercial";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(1, local.length - 2))}@${domain}`;
}

export const POST = withApiHandler(
  async (req) => {
    if (!isSameOrigin(req)) {
      return apiFail("Invalid request origin.", {
        status: 403,
        code: ApiErrorCode.FORBIDDEN,
      });
    }

    const ip = getClientIp(req);
    const limited = await rateLimit(`signup:${ip}`, 5, 15 * 60_000);
    if (!limited.ok) {
      return apiFail(
        `Too many signup attempts. Try again in ${limited.retryAfter}s.`,
        {
          status: 429,
          code: ApiErrorCode.RATE_LIMITED,
          headers: { "Retry-After": String(limited.retryAfter) },
        }
      );
    }

    const body = await req.json();

    if (looksLikeBotPayload(body || {})) {
      return apiSuccess("Check your email for a verification code.", {
        extra: {
          requiresOtp: true,
          data: { email: "hidden" },
        },
      });
    }

    const name = sanitizeText(body?.name, 120);
    const email = sanitizeText(body?.email || body?.username, 254).toLowerCase();
    const password = String(body?.password || "");
    const company_name = sanitizeText(body?.company_name, 160);
    const country = sanitizeText(body?.country || body?.country_code, 2).toUpperCase();
    const phoneCountryCode = sanitizeText(
      body?.phone_country_code || body?.phoneCountryCode,
      2
    ).toUpperCase();
    const dialCode = resolveDialCode({
      phoneDialCode: body?.phone_dial_code || body?.phoneDialCode || body?.dial_code,
      phoneCountryCode: phoneCountryCode || undefined,
      countryCode: country || undefined,
    });
    const phoneLocal = sanitizeText(body?.phone_local || body?.phoneLocal, 40);
    const phoneRaw = sanitizeText(body?.phone || body?.company_phone, 40);
    const phone =
      mergePhoneWithDialCode(dialCode, phoneLocal || phoneRaw) ||
      phoneRaw ||
      undefined;
    const category_id =
      sanitizeText(body?.category_id || body?.business_category_id, 80) || undefined;
    const industry_id = sanitizeText(body?.industry_id, 80) || undefined;
    const plan_id = sanitizeText(body?.plan_id, 80) || undefined;
    const product_id_hint = sanitizeText(body?.product_id, 80) || undefined;
    const marketing_opt_in = Boolean(body?.marketing_opt_in);
    const captchaToken = sanitizeText(
      body?.captcha_token || body?.recaptchaToken || body?.recaptcha_token,
      8192
    );

    if (
      !name ||
      !password ||
      !email ||
      !company_name ||
      !country ||
      !plan_id ||
      !industry_id ||
      !category_id
    ) {
      return apiFail(
        "Please fill name, email, password, company name, country, plan, industry, and business category.",
        { status: 400, code: ApiErrorCode.VALIDATION_ERROR }
      );
    }

    if (!phone) {
      return apiFail("Please enter a phone number.", {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    }

    if (!isValidCountryCode(country)) {
      return apiFail("Please select a valid country.", {
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

    if (password.length < 8 || password.length > 128) {
      return apiFail("Password must be 8–128 characters.", {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
      });
    }

    const commercial = await validateSignupCommercialSelection({
      plan_id,
      industry_id,
      category_id,
      product_id: product_id_hint,
    });

    if (!commercial.ok) {
      return apiFail(commercial.message, {
        status: commercial.status,
        code: commercial.code || ApiErrorCode.VALIDATION_ERROR,
      });
    }

    const emailLimited = await rateLimit(`signup-email:${email}`, 3, 60 * 60_000);
    if (!emailLimited.ok) {
      return apiFail(
        "Too many verification emails requested for this address. Try later.",
        { status: 429, code: ApiErrorCode.RATE_LIMITED }
      );
    }

    const license = await startRegistrationOnLicenseServer({
      name,
      email,
      password,
      phone,
      company_name,
      country,
      industry_id: commercial.data.industry.id,
      category_id: commercial.data.category.id,
      product_id: commercial.data.product.id,
      plan_id: commercial.data.plan.id,
      marketing_opt_in,
      // License Engine is the sole verifier; reCAPTCHA tokens are single-use.
      captcha_token: captchaToken || undefined,
    });

    if (!license.ok || !license.data?.registrationId) {
      return upstreamFail(
        license.message,
        license.status,
        {
          endpoint: "/api/auth/signup",
          userEmail: email,
          workspace: company_name,
        },
        license.code
      );
    }

    return apiSuccess(
      license.message ||
        `We sent a verification code to ${maskEmail(email)}. Enter it to activate your trial.`,
      {
        extra: {
          requiresOtp: true,
          data: {
            registrationId: license.data.registrationId,
            email: license.data.email || maskEmail(email),
            trialDays: license.data.trialDays || authConfig.trialDays,
            otpExpiresInMinutes: license.data.otpExpiresInMinutes || 10,
          },
        },
      }
    );
  },
  {
    endpoint: "/api/auth/signup",
  }
);

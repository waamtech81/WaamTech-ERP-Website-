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
import { validateSignupCustomPackage } from "@/lib/signup/validate-custom-package";
import { buildPredefinedSignupPricingSummary } from "@/lib/signup/predefined-pricing-summary";
import { buildCustomSignupPricingSummary } from "@/lib/signup/custom-pricing-summary";
import { resolveSignupCommercialMode } from "@/lib/signup/commercial-mode";
import type { BillingCycle } from "@/lib/commercial/types";

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
      // Never show an OTP screen unless the Engine has created a registration
      // session. A decoy OTP success leaves real users with no code and no
      // registration ID for resend/verification.
      return apiFail("Please review the form and try again.", {
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
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
    const business_profile_id =
      sanitizeText(body?.business_profile_id, 80) || undefined;
    const product_id_hint = sanitizeText(body?.product_id, 80) || undefined;
    const package_type =
      sanitizeText(body?.package_type, 20).toLowerCase() === "custom"
        ? "custom"
        : "predefined";
    const rawBilling = sanitizeText(body?.billing_cycle, 20).toLowerCase();
    const billing_cycle: BillingCycle | undefined =
      rawBilling === "monthly" || rawBilling === "yearly" || rawBilling === "lifetime"
        ? rawBilling
        : undefined;
    const selected_modules = Array.isArray(body?.selected_modules)
      ? body.selected_modules.map((c: unknown) => sanitizeText(c, 80)).filter(Boolean)
      : Array.isArray(body?.selected_module_codes)
        ? body.selected_module_codes.map((c: unknown) => sanitizeText(c, 80)).filter(Boolean)
        : [];
    const discount_code =
      sanitizeText(body?.discount_code || body?.coupon_code, 64).toUpperCase() ||
      undefined;
    const marketing_opt_in = Boolean(body?.marketing_opt_in);
    const selectedCurrency = sanitizeText(
      body?.currency || body?.selected_currency || body?.customer_currency,
      3
    ).toUpperCase() || undefined;
    const captchaToken = sanitizeText(
      body?.captcha_token || body?.recaptchaToken || body?.recaptcha_token,
      8192
    );

    if (!name || !password || !email || !company_name || !country) {
      return apiFail(
        "Please fill name, email, password, company name, and country.",
        { status: 400, code: ApiErrorCode.VALIDATION_ERROR }
      );
    }

    if (package_type === "predefined" && (!plan_id || !industry_id || !category_id)) {
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

    let license;
    let signupMode: "trial" | "paid" = "trial";
    if (package_type === "custom") {
      if (!billing_cycle) {
        return apiFail("Choose a billing cycle for your Build your own custom ERP package.", {
          status: 400,
          code: ApiErrorCode.VALIDATION_ERROR,
        });
      }
      const custom = await validateSignupCustomPackage({
        selected_modules,
        billing_cycle,
        product_slug: sanitizeText(body?.product_slug, 100) || "waamto-erp",
        recommended_modules: Array.isArray(body?.recommended_modules)
          ? body.recommended_modules.map((c: unknown) => sanitizeText(c, 80)).filter(Boolean)
          : undefined,
        discount_code: discount_code || null,
        industry_id: industry_id || sanitizeText(body?.industry_id, 80) || null,
        industry_name: sanitizeText(body?.industry_name, 120) || null,
        category_id: category_id || sanitizeText(body?.category_id, 80) || null,
        category_name:
          sanitizeText(body?.category_name || body?.business_category_name, 120) ||
          null,
        feature_packs: body?.feature_packs,
        tenant_limits: body?.tenant_limits,
      });
      if (!custom.ok) {
        return apiFail(custom.message, {
          status: custom.status,
          code: custom.code || ApiErrorCode.VALIDATION_ERROR,
        });
      }

      const emailLimited = await rateLimit(`signup-email:${email}`, 3, 60 * 60_000);
      if (!emailLimited.ok) {
        return apiFail(
          "Too many verification emails requested for this address. Try later.",
          { status: 429, code: ApiErrorCode.RATE_LIMITED }
        );
      }

      const pkg = custom.data.package;
      const pricingSummary = buildCustomSignupPricingSummary({
        pkg,
        effectiveModules: custom.data.effective_modules,
      });
      signupMode = resolveSignupCommercialMode({
        packageType: "custom",
        plan: null,
        billingCycle: pkg.billing_cycle,
      });
      license = await startRegistrationOnLicenseServer({
        name,
        email,
        password,
        phone,
        company_name,
        country,
        industry_id: pkg.industry_id || industry_id || undefined,
        category_id: pkg.category_id || category_id || undefined,
        industry_name: pkg.industry_name || undefined,
        category_name: pkg.category_name || undefined,
        ...(business_profile_id ? { business_profile_id } : {}),
        product_id: custom.data.product.id,
        product_slug: custom.data.product.slug,
        package_type: "custom",
        selected_modules: pkg.selected_modules,
        dependency_modules: pkg.dependency_modules,
        recommended_modules: pkg.recommended_modules,
        billing_cycle: pkg.billing_cycle,
        monthly_price: pkg.monthly_price,
        yearly_price: pkg.yearly_price,
        lifetime_price: pkg.lifetime_price,
        estimated_total: pricingSummary.grand_total,
        selected_module_count: pkg.selected_module_count,
        discount_code: pkg.discount_code || discount_code || null,
        feature_packs: pkg.feature_packs,
        tenant_limits: pkg.tenant_limits,
        selected_feature_packs: pkg.feature_packs?.map((p) => p.code).filter(Boolean),
        required_modules: pkg.dependency_modules,
        user_limit: pkg.tenant_limits?.users ?? null,
        company_limit: pkg.tenant_limits?.companies ?? null,
        branch_limit: pkg.tenant_limits?.branches ?? null,
        warehouse_limit: pkg.tenant_limits?.warehouses ?? null,
        pricing_summary: pricingSummary,
        marketing_opt_in,
        captcha_token: captchaToken || undefined,
        signup_mode: signupMode,
        trial_days: signupMode === "paid" ? 0 : authConfig.trialDays,
        ...(selectedCurrency ? { currency: selectedCurrency } : {}),
      });
    } else {
      const commercial = await validateSignupCommercialSelection({
        plan_id: plan_id!,
        industry_id: industry_id!,
        category_id: category_id!,
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

      signupMode = resolveSignupCommercialMode({
        packageType: "predefined",
        plan: commercial.data.plan,
        billingCycle: billing_cycle,
      });

      license = await startRegistrationOnLicenseServer({
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
        package_type: "predefined",
        ...(billing_cycle ? { billing_cycle } : {}),
        ...(business_profile_id ? { business_profile_id } : {}),
        marketing_opt_in,
        // License Engine is the sole verifier; reCAPTCHA tokens are single-use.
        captcha_token: captchaToken || undefined,
        signup_mode: signupMode,
        trial_days: signupMode === "paid" ? 0 : authConfig.trialDays,
        ...(selectedCurrency ? { currency: selectedCurrency } : {}),
        ...(signupMode === "paid"
          ? {
              pricing_summary: buildPredefinedSignupPricingSummary({
                plan: commercial.data.plan,
                billingCycle: billing_cycle,
                currency: selectedCurrency,
              }),
            }
          : {}),
      });
    }

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

    const otpHint =
      signupMode === "paid"
        ? `We sent a verification code to ${maskEmail(email)}. Enter it to continue to checkout.`
        : `We sent a verification code to ${maskEmail(email)}. Enter it to activate your trial.`;

    return apiSuccess(license.message || otpHint, {
      extra: {
        requiresOtp: true,
        data: {
          registrationId: license.data.registrationId,
          email: license.data.email || maskEmail(email),
          trialDays:
            signupMode === "paid"
              ? 0
              : license.data.trialDays || authConfig.trialDays,
          otpExpiresInMinutes: license.data.otpExpiresInMinutes || 10,
          signup_mode: signupMode,
        },
      },
    });
  },
  {
    endpoint: "/api/auth/signup",
  }
);

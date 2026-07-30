import { toPublicError } from "@/lib/api/errors";
import { logApiError } from "@/lib/api/logger";
import { authConfig } from "@/lib/auth/config";
import { licenseConfig, normalizeLicenseBase } from "@/lib/license/config";
import {
  fetchLicenseUpstream,
  licenseUpstreamErrorMessage,
} from "@/lib/license/upstream-fetch";

export type TrialRegistrationInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  company_name: string;
  country: string;
  /** Predefined: required. Custom: optional (Engine may auto-resolve). */
  industry_id?: string;
  category_id?: string;
  product_id?: string;
  plan_id?: string;
  product_slug?: string;
  package_type?: "predefined" | "custom";
  selected_modules?: string[];
  dependency_modules?: string[];
  recommended_modules?: string[];
  billing_cycle?: "monthly" | "yearly" | "lifetime";
  monthly_price?: number;
  yearly_price?: number;
  lifetime_price?: number;
  estimated_total?: number;
  selected_module_count?: number;
  discount_code?: string | null;
  pricing_summary?: Record<string, unknown>;
  marketing_opt_in?: boolean;
  captcha_token?: string;
  signup_mode?: "trial" | "paid";
  trial_days?: number;
  /** Custom builder context — Engine may store / ignore unknown fields. */
  industry_name?: string | null;
  category_name?: string | null;
  feature_packs?: Array<{
    code: string;
    name: string;
    required?: boolean;
    monthly_price?: number;
    yearly_price?: number;
    lifetime_price?: number;
  }>;
  tenant_limits?: {
    users: number;
    companies: number;
    branches: number;
    warehouses: number;
  } | null;
  selected_feature_packs?: string[];
  required_modules?: string[];
  user_limit?: number | null;
  company_limit?: number | null;
  branch_limit?: number | null;
  warehouse_limit?: number | null;
  /** Business profile ID — Engine uses it for Category-First provisioning (both predefined and custom). */
  business_profile_id?: string;
  /** Visitor's selected display currency (e.g. "PKR", "EUR"). Engine converts pricing and stores on profile. */
  currency?: string;
};

export type RegistrationStartResult = {
  registrationId: string;
  email: string;
  otpExpiresInMinutes: number;
  trialDays: number;
  requiresOtp: boolean;
  message: string;
};

export type RegistrationCompleteResult = {
  registrationId?: string;
  customerId?: string;
  identityId?: string;
  username?: string;
  email?: string;
  licenseKey?: string;
  licenseId?: string;
  trialDays?: number;
  trialEndsAt?: string;
  loginUrl?: string;
  appUrl?: string;
  provisioned?: boolean;
  licenseEmailed?: boolean;
  message?: string;
  payment_required?: boolean;
  signup_mode?: "trial" | "paid";
  checkout_session_token?: string;
  checkoutUrl?: string;
  /** Issued after paid OTP verify so Website can open portal checkout authenticated. */
  accessToken?: string;
  refreshToken?: string;
  access_token?: string;
  refresh_token?: string;
};

type LicenseApiResponse<T = Record<string, unknown>> = {
  success?: boolean;
  message?: string;
  code?: string;
  data?: T;
  error?: { message?: string; code?: string; details?: unknown } | string;
};

function rawLicenseMessage(json: LicenseApiResponse<unknown>): string {
  if (typeof json.message === "string" && json.message.trim()) return json.message;
  if (typeof json.error === "string" && json.error.trim()) return json.error;
  if (
    json.error &&
    typeof json.error === "object" &&
    typeof json.error.message === "string" &&
    json.error.message.trim()
  ) {
    return json.error.message;
  }
  return "";
}

function rawLicenseCode(json: LicenseApiResponse<unknown>): string | undefined {
  if (typeof json.code === "string" && json.code.trim()) return json.code.trim();
  if (
    json.error &&
    typeof json.error === "object" &&
    typeof json.error.code === "string" &&
    json.error.code.trim()
  ) {
    return json.error.code.trim();
  }
  return undefined;
}

/** Public-safe message — prefers Engine message; never returns technical text. */
function extractLicenseError(
  json: LicenseApiResponse<unknown>,
  status: number,
  fallback: string
): { message: string; code?: string } {
  const raw = rawLicenseMessage(json);
  const code = rawLicenseCode(json);
  const publicError = toPublicError(raw || fallback, status, {
    code,
    preferEmailConflictOn409: !raw && !code,
  });
  return { message: publicError.message, code: publicError.code };
}

function licenseHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (licenseConfig.apiKey) {
    headers.Authorization = `Bearer ${licenseConfig.apiKey}`;
  }
  return headers;
}

async function postLicense<T>(
  paths: string[],
  body: unknown
): Promise<{ ok: boolean; status: number; message: string; code?: string; data?: T }> {
  const base = normalizeLicenseBase(licenseConfig.apiUrl);
  let lastError = "License service unavailable.";
  let lastCode: string | undefined;
  let lastStatus = 502;

  for (const path of paths) {
    try {
      const res = await fetchLicenseUpstream(`${base}${path}`, {
        method: "POST",
        headers: licenseHeaders(),
        body: JSON.stringify(body),
        cache: "no-store",
      });
      lastStatus = res.status;

      let json: LicenseApiResponse<T> = {};
      try {
        json = (await res.json()) as LicenseApiResponse<T>;
      } catch {
        json = { success: false, message: "Invalid response from license server." };
      }

      // Engine APIs sometimes return HTTP 200 for a handled failure. Respect its
      // explicit success flag so the UI never advances to OTP when email delivery
      // or registration creation was rejected.
      if (json.success === true || (res.ok && json.success === undefined)) {
        return {
          ok: true,
          status: res.status,
          message: rawLicenseMessage(json) || "OK",
          data: json.data,
        };
      }

      const technical =
        rawLicenseMessage(json) || `License request failed (${res.status}).`;
      logApiError(new Error(technical), {
        endpoint: path,
        httpStatus: res.status,
        technicalMessage: technical,
      });
      const extracted = extractLicenseError(json, res.status, technical);
      lastError = extracted.message;
      lastCode = extracted.code;
      if (res.status !== 404) break;
    } catch (error) {
      const technical = licenseUpstreamErrorMessage(error);
      logApiError(error, {
        endpoint: path,
        httpStatus: 502,
        technicalMessage: technical,
      });
      const publicError = toPublicError(technical, 502);
      lastError = publicError.message;
      lastCode = publicError.code;
    }
  }

  return {
    ok: false,
    status: lastStatus,
    message: lastError,
    code: lastCode,
  };
}

/** Start registration — License Engine stores pending identity + emails OTP. */
export async function startRegistrationOnLicenseServer(
  input: TrialRegistrationInput
): Promise<{
  ok: boolean;
  message: string;
  code?: string;
  data?: RegistrationStartResult;
  status: number;
}> {
  const result = await postLicense<RegistrationStartResult>(
    ["/v1/registrations/start", "/registrations/start"],
    {
      name: input.name,
      email: input.email,
      password: input.password,
      // Always send dial-code + number already merged (e.g. "+92 3001234567")
      phone: input.phone,
      company_phone: input.phone,
      phone_number: input.phone,
      company_name: input.company_name,
      company: input.company_name,
      country: input.country,
      country_code: input.country,
      // Commercial IDs — Engine re-validates (custom packages may omit plan/industry/category)
      ...(input.industry_id ? { industry_id: input.industry_id } : {}),
      ...(input.category_id
        ? { category_id: input.category_id, business_category_id: input.category_id }
        : {}),
      ...(input.product_id ? { product_id: input.product_id } : {}),
      ...(input.plan_id ? { plan_id: input.plan_id } : {}),
      ...(input.product_slug ? { product_slug: input.product_slug } : {}),
      // Forward for both paths — Engine resolves Category-First provisioning profile.
      ...(input.business_profile_id ? { business_profile_id: input.business_profile_id } : {}),
      package_type: input.package_type || "predefined",
      // Forward billing_cycle for predefined plans so Engine stores it on the registration session.
      ...(input.billing_cycle && input.package_type !== "custom"
        ? { billing_cycle: input.billing_cycle }
        : {}),
      ...(input.package_type === "custom"
        ? {
            selected_modules: input.selected_modules || [],
            dependency_modules: input.dependency_modules || [],
            required_modules:
              input.required_modules?.length
                ? input.required_modules
                : input.dependency_modules || [],
            recommended_modules: input.recommended_modules || [],
            selected_feature_packs:
              input.selected_feature_packs?.length
                ? input.selected_feature_packs
                : (input.feature_packs || [])
                    .map((p) => String(p.code || "").trim())
                    .filter(Boolean),
            billing_cycle: input.billing_cycle,
            estimated_total: input.estimated_total,
            selected_module_count: input.selected_module_count,
            ...(input.user_limit != null ? { user_limit: input.user_limit } : {}),
            ...(input.company_limit != null ? { company_limit: input.company_limit } : {}),
            ...(input.branch_limit != null ? { branch_limit: input.branch_limit } : {}),
            ...(input.warehouse_limit != null ? { warehouse_limit: input.warehouse_limit } : {}),
            ...(input.discount_code
              ? { discount_code: input.discount_code, coupon_code: input.discount_code }
              : {}),
            ...(input.industry_name
              ? { industry_name: input.industry_name }
              : {}),
            ...(input.category_name
              ? {
                  category_name: input.category_name,
                  business_category_name: input.category_name,
                }
              : {}),
            ...(input.feature_packs?.length
              ? { feature_packs: input.feature_packs }
              : {}),
            ...(input.tenant_limits
              ? {
                  tenant_limits: input.tenant_limits,
                  limits: input.tenant_limits,
                  ...(input.user_limit == null && input.tenant_limits.users != null
                    ? { user_limit: input.tenant_limits.users }
                    : {}),
                  ...(input.company_limit == null && input.tenant_limits.companies != null
                    ? { company_limit: input.tenant_limits.companies }
                    : {}),
                  ...(input.branch_limit == null && input.tenant_limits.branches != null
                    ? { branch_limit: input.tenant_limits.branches }
                    : {}),
                  ...(input.warehouse_limit == null && input.tenant_limits.warehouses != null
                    ? { warehouse_limit: input.tenant_limits.warehouses }
                    : {}),
                }
              : {}),
            pricing_summary: input.pricing_summary || {
              monthly: input.monthly_price,
              yearly: input.yearly_price,
              lifetime: input.lifetime_price,
              ...(input.discount_code
                ? { discount_code: input.discount_code }
                : {}),
              grand_total: input.estimated_total,
            },
          }
        : {}),
      marketing_opt_in: Boolean(input.marketing_opt_in),
      ...(input.signup_mode ? { signup_mode: input.signup_mode } : {}),
      trial_days:
        input.trial_days ??
        (input.signup_mode === "paid" ? 0 : authConfig.trialDays),
      source: "waamto-website",
      ...(input.captcha_token ? { captcha_token: input.captcha_token } : {}),
      // Forward visitor's selected currency so Engine invoices/profile use it.
      ...(input.currency ? { customer_currency: input.currency } : {}),
    }
  );

  if (!result.data) return result;

  // Support both Engine response conventions while the public registration
  // contract is being rolled out. The Website must retain the pending
  // registration ID or it cannot verify/resend the OTP.
  const raw = result.data as RegistrationStartResult & Record<string, unknown>;
  const registrationId =
    raw.registrationId ||
    (typeof raw.registration_id === "string" ? raw.registration_id : "");

  return {
    ...result,
    data: {
      ...raw,
      registrationId,
      email: raw.email || input.email,
      otpExpiresInMinutes:
        raw.otpExpiresInMinutes ||
        (typeof raw.otp_expires_in_minutes === "number"
          ? raw.otp_expires_in_minutes
          : 10),
      trialDays:
        raw.trialDays ||
        (typeof raw.trial_days === "number" ? raw.trial_days : authConfig.trialDays),
      requiresOtp: raw.requiresOtp ?? true,
      message: raw.message || result.message,
    },
  };
}

/** Verify email OTP — License Engine creates customer; paid mode returns checkout + optional session tokens. */
export async function verifyRegistrationOtp(input: {
  registration_id: string;
  otp: string;
  email?: string;
  captcha_token?: string;
}): Promise<{
  ok: boolean;
  message: string;
  code?: string;
  data?: RegistrationCompleteResult;
  status: number;
}> {
  const result = await postLicense<RegistrationCompleteResult>(
    [
      "/v1/registrations/otp/verify",
      "/v1/registrations/verify-otp",
      "/registrations/otp/verify",
    ],
    {
      registration_id: input.registration_id,
      otp: input.otp,
      email: input.email,
      // Engine is the sole reCAPTCHA verifier (tokens are single-use).
      ...(input.captcha_token ? { captcha_token: input.captcha_token } : {}),
    }
  );

  if (!result.ok || !result.data) return result;

  const raw = result.data as RegistrationCompleteResult & Record<string, unknown>;
  return {
    ...result,
    data: {
      ...raw,
      payment_required: Boolean(raw.payment_required),
      signup_mode:
        raw.signup_mode === "paid" || raw.payment_required
          ? "paid"
          : raw.signup_mode === "trial"
            ? "trial"
            : undefined,
      checkout_session_token:
        raw.checkout_session_token ||
        (typeof raw.checkoutSessionToken === "string"
          ? raw.checkoutSessionToken
          : undefined),
      checkoutUrl:
        raw.checkoutUrl ||
        (typeof raw.checkout_url === "string" ? raw.checkout_url : undefined),
      accessToken:
        raw.accessToken ||
        (typeof raw.access_token === "string" ? raw.access_token : undefined),
      refreshToken:
        raw.refreshToken ||
        (typeof raw.refresh_token === "string" ? raw.refresh_token : undefined),
    },
  };
}

export async function resendRegistrationOtp(input: {
  registration_id: string;
  email?: string;
  captcha_token?: string;
}): Promise<{
  ok: boolean;
  message: string;
  code?: string;
  data?: RegistrationStartResult;
  status: number;
}> {
  return postLicense<RegistrationStartResult>(
    ["/v1/registrations/otp/resend", "/registrations/otp/resend"],
    {
      registration_id: input.registration_id,
      email: input.email,
      ...(input.captcha_token ? { captcha_token: input.captcha_token } : {}),
    }
  );
}


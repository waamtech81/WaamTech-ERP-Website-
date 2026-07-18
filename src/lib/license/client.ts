import { toPublicError } from "@/lib/api/errors";
import { logApiError } from "@/lib/api/logger";
import { authConfig } from "@/lib/auth/config";
import { licenseConfig, normalizeLicenseBase } from "@/lib/license/config";

export type TrialRegistrationInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  company_name: string;
  country: string;
  /** Required commercial selection — License Engine validates + auto-resolves profile from category. */
  industry_id: string;
  category_id: string;
  product_id: string;
  plan_id: string;
  marketing_opt_in?: boolean;
  captcha_token?: string;
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
      const res = await fetch(`${base}${path}`, {
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

      if (json.success || res.ok) {
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
      const technical =
        error instanceof Error ? error.message : "Could not reach license server.";
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
      // Commercial IDs only — Engine re-validates product/plan/industry/category server-side
      industry_id: input.industry_id,
      category_id: input.category_id,
      business_category_id: input.category_id,
      product_id: input.product_id,
      plan_id: input.plan_id,
      marketing_opt_in: Boolean(input.marketing_opt_in),
      trial_days: authConfig.trialDays,
      source: "waamto-website",
      ...(input.captcha_token ? { captcha_token: input.captcha_token } : {}),
    }
  );

  return result;
}

/** Verify email OTP — License Engine creates customer, trial, license, provisions ERP. */
export async function verifyRegistrationOtp(input: {
  registration_id: string;
  otp: string;
  email?: string;
}): Promise<{
  ok: boolean;
  message: string;
  code?: string;
  data?: RegistrationCompleteResult;
  status: number;
}> {
  return postLicense<RegistrationCompleteResult>(
    [
      "/v1/registrations/otp/verify",
      "/v1/registrations/verify-otp",
      "/registrations/otp/verify",
    ],
    input
  );
}

export async function resendRegistrationOtp(input: {
  registration_id: string;
  email?: string;
}): Promise<{
  ok: boolean;
  message: string;
  code?: string;
  data?: RegistrationStartResult;
  status: number;
}> {
  return postLicense<RegistrationStartResult>(
    ["/v1/registrations/otp/resend", "/registrations/otp/resend"],
    input
  );
}


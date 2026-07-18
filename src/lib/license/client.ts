import { authConfig } from "@/lib/auth/config";
import { licenseConfig, normalizeLicenseBase } from "@/lib/license/config";

export type TrialRegistrationInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  company_name: string;
  country: string;
  /** Required commercial selection — License Engine auto-resolves profile from category. */
  industry_id: string;
  category_id: string;
  product_id: string;
  product_slug?: string;
  plan_id: string;
  plan?: string;
  billing_cycle?: string;
  marketing_opt_in?: boolean;
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
  data?: T;
};

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
): Promise<{ ok: boolean; status: number; message: string; data?: T }> {
  const base = normalizeLicenseBase(licenseConfig.apiUrl);
  let lastError = "License service unavailable.";
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
          message: json.message || "OK",
          data: json.data,
        };
      }

      lastError = json.message || `License request failed (${res.status}).`;
      if (res.status !== 404) break;
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : "Could not reach license server.";
    }
  }

  return { ok: false, status: lastStatus, message: lastError };
}

/** Start registration — License Engine stores pending identity + emails OTP. */
export async function startRegistrationOnLicenseServer(
  input: TrialRegistrationInput
): Promise<{ ok: boolean; message: string; data?: RegistrationStartResult; status: number }> {
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
      industry_id: input.industry_id,
      category_id: input.category_id,
      business_category_id: input.category_id,
      product_id: input.product_id,
      product_slug: input.product_slug,
      plan_id: input.plan_id,
      plan: input.plan || undefined,
      plan_slug: input.plan || undefined,
      billing_cycle: input.billing_cycle || undefined,
      marketing_opt_in: Boolean(input.marketing_opt_in),
      trial_days: authConfig.trialDays,
      source: "waamto-website",
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
}): Promise<{ ok: boolean; message: string; data?: RegistrationStartResult; status: number }> {
  return postLicense<RegistrationStartResult>(
    ["/v1/registrations/otp/resend", "/registrations/otp/resend"],
    input
  );
}


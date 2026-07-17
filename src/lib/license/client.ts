import { authConfig, normalizeApiBase } from "@/lib/auth/config";
import { licenseConfig, normalizeLicenseBase } from "@/lib/license/config";

export type TrialRegistrationInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  company_name: string;
  profile_id: string;
  industry_id?: string;
  plan?: string;
  email_verified: boolean;
};

type LicenseApiResponse = {
  success?: boolean;
  message?: string;
  data?: {
    registrationId?: string;
    licenseKey?: string;
    packageId?: string;
    trialEndsAt?: string;
    licenseEmailed?: boolean;
  };
};

type CoreApiResponse = {
  success?: boolean;
  message?: string;
  data?: Record<string, unknown>;
};

export async function registerTrialOnLicenseServer(
  input: TrialRegistrationInput
): Promise<{ ok: boolean; message: string; data?: LicenseApiResponse["data"] }> {
  const base = normalizeLicenseBase(licenseConfig.apiUrl);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (licenseConfig.apiKey) {
    headers.Authorization = `Bearer ${licenseConfig.apiKey}`;
  }

  const endpoints = ["/v1/registrations/trial", "/v1/trials/register", "/registrations/trial"];

  let lastError = "License service unavailable.";

  for (const path of endpoints) {
    try {
      const res = await fetch(`${base}${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: input.name,
          email: input.email,
          password: input.password,
          phone: input.phone,
          company_name: input.company_name,
          company: input.company_name,
          profile_id: input.profile_id,
          business_category_id: input.profile_id,
          industry_id: input.industry_id,
          plan: input.plan || "professional",
          package_plan: input.plan || "professional",
          email_verified: input.email_verified,
          trial_days: authConfig.trialDays,
          source: "waamto-website",
        }),
        cache: "no-store",
      });

      let json: LicenseApiResponse = {};
      try {
        json = (await res.json()) as LicenseApiResponse;
      } catch {
        json = { success: false, message: "Invalid response from license server." };
      }

      if (json.success || res.ok) {
        return {
          ok: true,
          message:
            json.message ||
            "Trial registered. Your license key has been sent to your email.",
          data: json.data,
        };
      }

      lastError = json.message || `License registration failed (${res.status}).`;

      // Try next endpoint only on 404
      if (res.status !== 404) break;
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : "Could not reach license server.";
    }
  }

  return { ok: false, message: lastError };
}

/** Optional: provision ERP Core tenant after license registration (when Core API is available) */
export async function provisionCoreTenant(input: TrialRegistrationInput) {
  const base = normalizeApiBase(authConfig.apiUrl);
  try {
    const res = await fetch(`${base}/v1/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        name: input.name,
        email: input.email,
        username: input.email.split("@")[0],
        password: input.password,
        phone: input.phone,
        company_name: input.company_name,
        profile_id: input.profile_id,
        business_category_id: input.profile_id,
        industry_id: input.industry_id,
        email_verified: true,
        metadata: input.plan ? { intended_plan: input.plan } : undefined,
      }),
      cache: "no-store",
    });

    let json: CoreApiResponse = {};
    try {
      json = (await res.json()) as CoreApiResponse;
    } catch {
      return { ok: false, skipped: true };
    }

    if (json.success) return { ok: true, data: json.data };
    const msg = (json.message || "").toLowerCase();
    if (msg.includes("already") || msg.includes("exists") || res.status === 409) {
      return { ok: true, alreadyExists: true };
    }
    return { ok: false, message: json.message };
  } catch {
    return { ok: false, skipped: true };
  }
}

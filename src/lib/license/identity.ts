import { toPublicError } from "@/lib/api/errors";
import { logApiError } from "@/lib/api/logger";
import { licenseConfig, normalizeLicenseBase } from "@/lib/license/config";

export type IdentityProfile = {
  id: string;
  customer_id: string;
  username: string;
  email: string;
  full_name: string;
  phone?: string | null;
  whatsapp_number?: string | null;
  photo_url?: string | null;
  email_verified_at?: string | null;
  marketing_opt_in?: boolean;
  status: string;
  last_login_at?: string | null;
  email_readonly?: boolean;
};

export type CustomerProfile = {
  id: string;
  company_name: string;
  workspace_name?: string | null;
  owner_name?: string | null;
  email: string;
  phone?: string | null;
  country?: string | null;
  industry_id?: string | null;
  industry_name?: string | null;
  business_category_id?: string | null;
  business_category_name?: string | null;
  business_profile_id?: string | null;
  business_profile_name?: string | null;
  preferred_plan?: string | null;
  preferred_plan_name?: string | null;
  product_id?: string | null;
  product_name?: string | null;
  product_slug?: string | null;
  status: string;
  currency?: string | null;
  timezone?: string | null;
  created_at?: string | null;
  feature_packs?: Array<{ id: string; code: string; name: string; slug?: string }>;
};

export type IdentityLicense = {
  id: string;
  license_key: string;
  product_name?: string | null;
  product_slug?: string | null;
  plan_name?: string | null;
  plan_type?: string | null;
  plan_slug?: string | null;
  deployment_type?: string | null;
  activation_date?: string | null;
  status: string;
  effective_status?: string;
  expired?: boolean;
  in_grace?: boolean;
  days_remaining?: number | null;
  expiry_date?: string | null;
  grace_period_days?: number | null;
};

export type IdentitySession = {
  id?: string;
  created_at?: string;
  expires_at?: string;
  revoked_at?: string | null;
};

export type IdentityLoginSuccess = {
  accessToken: string;
  refreshToken: string;
  identity: IdentityProfile;
  customer_id: string;
};

export type IdentityLoginChallenge = {
  requires_email_verification: true;
  challenge_token: string;
  email: string;
  message?: string;
  otpExpiresInMinutes?: number;
};

type LicenseApiResponse<T = Record<string, unknown>> = {
  success?: boolean;
  message?: string;
  code?: string;
  data?: T;
  error?: { message?: string; code?: string };
};

function licenseHeaders(accessToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  } else if (licenseConfig.apiKey) {
    headers.Authorization = `Bearer ${licenseConfig.apiKey}`;
  }
  return headers;
}

async function parseJson<T>(res: Response): Promise<LicenseApiResponse<T>> {
  try {
    return (await res.json()) as LicenseApiResponse<T>;
  } catch {
    return { success: false, message: "Invalid response from license server." };
  }
}

function rawMessage(json: LicenseApiResponse<unknown>): string {
  if (typeof json.message === "string" && json.message.trim()) return json.message;
  if (
    json.error &&
    typeof json.error === "object" &&
    typeof (json.error as { message?: string }).message === "string" &&
    (json.error as { message: string }).message.trim()
  ) {
    return (json.error as { message: string }).message;
  }
  return "";
}

function rawCode(json: LicenseApiResponse<unknown>): string | undefined {
  if (typeof json.code === "string" && json.code.trim()) return json.code.trim();
  if (
    json.error &&
    typeof json.error === "object" &&
    typeof (json.error as { code?: string }).code === "string" &&
    (json.error as { code: string }).code.trim()
  ) {
    return (json.error as { code: string }).code.trim();
  }
  return undefined;
}

function extractError(
  json: LicenseApiResponse<unknown>,
  status: number,
  fallback: string
): { message: string; code?: string } {
  const publicError = toPublicError(rawMessage(json) || fallback, status, {
    code: rawCode(json),
  });
  return { message: publicError.message, code: publicError.code };
}

async function requestLicense<T>(
  method: "GET" | "POST" | "PATCH",
  paths: string[],
  options?: {
    body?: unknown;
    accessToken?: string;
  }
): Promise<{ ok: boolean; status: number; message: string; code?: string; data?: T }> {
  const base = normalizeLicenseBase(licenseConfig.apiUrl);
  let lastError = "License service unavailable.";
  let lastCode: string | undefined;
  let lastStatus = 502;

  for (const path of paths) {
    try {
      const res = await fetch(`${base}${path}`, {
        method,
        headers: licenseHeaders(options?.accessToken),
        body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
        cache: "no-store",
      });
      lastStatus = res.status;
      const json = await parseJson<T>(res);

      if (json.success || res.ok) {
        return {
          ok: true,
          status: res.status,
          message: rawMessage(json) || "OK",
          data: json.data,
        };
      }

      const technical =
        rawMessage(json) || `License request failed (${res.status}).`;
      logApiError(new Error(technical), {
        endpoint: path,
        httpStatus: res.status,
        technicalMessage: technical,
      });
      const extracted = extractError(json, res.status, technical);
      lastError = extracted.message;
      lastCode = extracted.code;
      if (res.status !== 404) {
        return {
          ok: false,
          status: res.status,
          message: lastError,
          code: lastCode,
          data: json.data,
        };
      }
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

/** Customer identity login — Engine validates password; OTP only if email is not yet verified. */
export async function identityLogin(input: {
  username?: string;
  email?: string;
  password?: string;
  challenge_token?: string;
  email_code?: string;
  otp?: string;
}) {
  const result = await requestLicense<
    IdentityLoginSuccess & Partial<IdentityLoginChallenge>
  >("POST", ["/v1/identity/login", "/identity/login"], {
    body: {
      username: input.username,
      email: input.email,
      password: input.password,
      challenge_token: input.challenge_token,
      email_code: input.email_code || input.otp,
      otp: input.otp || input.email_code,
    },
  });

  if (result.data) {
    const normalized = normalizeIdentityLoginData(result.data);
    if (normalized) {
      return {
        ...result,
        data: normalized as IdentityLoginSuccess & Partial<IdentityLoginChallenge>,
      };
    }
  }
  return result;
}

export async function identityResendLoginOtp(input: { challenge_token: string }) {
  return requestLicense<IdentityLoginChallenge>(
    "POST",
    [
      "/v1/identity/resend-otp",
      "/identity/resend-otp",
      "/v1/identity/login/resend-otp",
      "/identity/login/resend-otp",
      "/v1/auth/resend-otp",
    ],
    { body: input }
  );
}

export async function identityRefresh(refreshToken: string) {
  return requestLicense<{
    accessToken: string;
    refreshToken: string;
    identity?: IdentityProfile;
  }>("POST", ["/v1/identity/refresh", "/identity/refresh"], {
    body: { refresh_token: refreshToken },
  });
}

export async function identityLogout(refreshToken: string) {
  return requestLicense("POST", ["/v1/identity/logout", "/identity/logout"], {
    body: { refresh_token: refreshToken },
  });
}

export async function identityLogoutAll(accessToken: string) {
  return requestLicense("POST", ["/v1/identity/logout-all", "/identity/logout-all"], {
    accessToken,
  });
}

export async function identityForgotPassword(email: string) {
  return requestLicense("POST", ["/v1/identity/forgot-password", "/identity/forgot-password"], {
    body: { email },
  });
}

export async function identityResetPassword(input: {
  token: string;
  new_password: string;
}) {
  return requestLicense("POST", ["/v1/identity/reset-password", "/identity/reset-password"], {
    body: {
      token: input.token,
      new_password: input.new_password,
    },
  });
}

export async function identityMe(accessToken: string) {
  return requestLicense<{
    identity: IdentityProfile;
    customer: CustomerProfile | null;
  }>("GET", ["/v1/identity/me", "/identity/me"], { accessToken });
}

export async function identityListLicenses(accessToken: string) {
  return requestLicense<IdentityLicense[]>(
    "GET",
    ["/v1/identity/licenses", "/identity/licenses"],
    { accessToken }
  );
}

export async function identityLicenseStatus(
  accessToken: string,
  licenseIdOrKey: string
) {
  const encoded = encodeURIComponent(licenseIdOrKey);
  return requestLicense(
    "GET",
    [
      `/v1/identity/licenses/${encoded}/status`,
      `/identity/licenses/${encoded}/status`,
      `/v1/identity/license-status?license_id=${encoded}`,
      `/identity/license-status?license_id=${encoded}`,
    ],
    { accessToken }
  );
}

export async function identityListSessions(accessToken: string) {
  return requestLicense<IdentitySession[]>(
    "GET",
    ["/v1/identity/sessions", "/identity/sessions"],
    { accessToken }
  );
}

export async function identityRenewSubscription(
  accessToken: string,
  body: { license_id: string; plan_id: string }
) {
  return requestLicense(
    "POST",
    ["/v1/identity/subscriptions/renew", "/identity/subscriptions/renew"],
    { accessToken, body }
  );
}

export async function identityUpdateProfile(
  accessToken: string,
  body: { full_name?: string; phone?: string; whatsapp_number?: string }
) {
  return requestLicense<{ identity: IdentityProfile }>(
    "PATCH",
    ["/v1/identity/profile", "/identity/profile"],
    { accessToken, body }
  );
}

export async function identityUploadPhoto(
  accessToken: string,
  body: { photo_base64: string; content_type?: string }
) {
  return requestLicense<{ identity: IdentityProfile }>(
    "POST",
    ["/v1/identity/profile/photo", "/identity/profile/photo"],
    { accessToken, body }
  );
}

export async function identityChangePassword(
  accessToken: string,
  body: { current_password: string; new_password: string }
) {
  return requestLicense("POST", ["/v1/identity/change-password", "/identity/change-password"], {
    accessToken,
    body,
  });
}

/** Normalize Engine login payloads (camelCase or snake_case tokens). */
export function normalizeIdentityLoginData(
  data: unknown
): (IdentityLoginSuccess & Partial<IdentityLoginChallenge>) | Record<string, unknown> | undefined {
  if (!data || typeof data !== "object") return undefined;
  const d = data as Record<string, unknown>;
  const accessToken =
    (typeof d.accessToken === "string" && d.accessToken) ||
    (typeof d.access_token === "string" && d.access_token) ||
    "";
  const refreshToken =
    (typeof d.refreshToken === "string" && d.refreshToken) ||
    (typeof d.refresh_token === "string" && d.refresh_token) ||
    "";
  if (accessToken && refreshToken) {
    return {
      ...d,
      accessToken,
      refreshToken,
      identity: (d.identity as IdentityProfile) || ({} as IdentityProfile),
      customer_id: String(d.customer_id || ""),
    };
  }
  return d;
}

export function isLoginChallenge(
  data: unknown
): data is IdentityLoginChallenge {
  if (!data || typeof data !== "object") return false;
  // Tokens always win — verified users must not be forced into OTP.
  if (hasLoginTokens(data)) return false;
  const d = data as Record<string, unknown>;
  const challenge =
    typeof d.challenge_token === "string" ? d.challenge_token.trim() : "";
  if (!challenge) return false;
  return (
    d.requires_email_verification === true ||
    d.requiresOtp === true ||
    d.requires_otp === true
  );
}

export function hasLoginTokens(data: unknown): data is IdentityLoginSuccess {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  const accessToken = d.accessToken || d.access_token;
  const refreshToken = d.refreshToken || d.refresh_token;
  return Boolean(
    typeof accessToken === "string" &&
      accessToken &&
      typeof refreshToken === "string" &&
      refreshToken
  );
}

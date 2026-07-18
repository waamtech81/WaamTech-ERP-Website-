/**
 * Platform (License Engine staff) authentication.
 * Super Admin / administrator / support_staff live in Engine `users` —
 * one identity, one password across Website, Admin Portal, and ERP integrations.
 */
import { licenseConfig, normalizeLicenseBase } from "@/lib/license/config";

export type PlatformRole = "super_admin" | "administrator" | "support_staff";

export type PlatformUser = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role: PlatformRole | string;
  status?: string;
};

export type PlatformLoginSuccess = {
  accessToken: string;
  refreshToken: string;
  user: PlatformUser;
};

export type PlatformEmailChallenge = {
  requires_email_verification: true;
  challenge_token: string;
  email: string;
  message?: string;
};

export type PlatformTotpChallenge = {
  requires_2fa: true;
  challenge_token?: string;
  message?: string;
};

export type PlatformLoginResult =
  | PlatformLoginSuccess
  | PlatformEmailChallenge
  | PlatformTotpChallenge;

type LicenseApiResponse<T = Record<string, unknown>> = {
  success?: boolean;
  message?: string;
  data?: T;
  error?: { message?: string; code?: string };
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

async function parseJson<T>(res: Response): Promise<LicenseApiResponse<T>> {
  try {
    return (await res.json()) as LicenseApiResponse<T>;
  } catch {
    return { success: false, message: "Invalid response from license server." };
  }
}

function extractMessage(json: LicenseApiResponse<unknown>, fallback: string) {
  return json.message || json.error?.message || fallback;
}

/**
 * Staff login paths under LICENSE_API_URL (…/api) → /v1/auth/login
 * Matches Control Center API_PREFIX `/api/v1` + `/auth`.
 */
async function requestPlatformAuth<T>(
  method: "GET" | "POST",
  paths: string[],
  body?: unknown
): Promise<{ ok: boolean; status: number; message: string; data?: T }> {
  const base = normalizeLicenseBase(licenseConfig.apiUrl);
  let lastError = "License service unavailable.";
  let lastStatus = 502;

  for (const path of paths) {
    try {
      const res = await fetch(`${base}${path}`, {
        method,
        headers: licenseHeaders(),
        body: body !== undefined ? JSON.stringify(body) : undefined,
        cache: "no-store",
      });
      lastStatus = res.status;
      const json = await parseJson<T>(res);

      if (json.success || res.ok) {
        return {
          ok: true,
          status: res.status,
          message: extractMessage(json, "OK"),
          data: json.data,
        };
      }

      lastError = extractMessage(json, `License request failed (${res.status}).`);
      // 401/403 = not a staff account or bad password — caller may fall through
      if (res.status !== 404) {
        return { ok: false, status: res.status, message: lastError, data: json.data };
      }
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : "Could not reach license server.";
    }
  }

  return { ok: false, status: lastStatus, message: lastError };
}

export async function platformLogin(input: {
  email: string;
  password?: string;
  challenge_token?: string;
  email_code?: string;
  totp_code?: string;
  recovery_code?: string;
}) {
  return requestPlatformAuth<PlatformLoginResult>(
    "POST",
    ["/v1/auth/login", "/auth/login"],
    {
    email: input.email,
    password: input.password,
    challenge_token: input.challenge_token,
    email_code: input.email_code,
    totp_code: input.totp_code,
    recovery_code: input.recovery_code,
  });
}

export async function platformResendOtp(input: { challenge_token: string }) {
  return requestPlatformAuth<PlatformEmailChallenge>(
    "POST",
    ["/v1/auth/resend-otp", "/auth/resend-otp"],
    input
  );
}

export function isPlatformEmailChallenge(
  data: unknown
): data is PlatformEmailChallenge {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    d.requires_email_verification === true &&
    typeof d.challenge_token === "string"
  );
}

export function isPlatformTotpChallenge(data: unknown): data is PlatformTotpChallenge {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return d.requires_2fa === true;
}

export function hasPlatformTokens(data: unknown): data is PlatformLoginSuccess {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return Boolean(
    d.accessToken &&
      d.refreshToken &&
      d.user &&
      typeof d.user === "object"
  );
}

export function isPlatformStaffRole(role: string | null | undefined): boolean {
  const r = String(role || "").toLowerCase();
  return r === "super_admin" || r === "administrator" || r === "support_staff";
}

/** Where Platform staff land after Website login (License Engine Admin). */
export function platformAdminPortalUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_LICENSE_PORTAL_URL ||
    process.env.LICENSE_PORTAL_URL ||
    licenseConfig.portalUrl ||
    "https://license.waamtech.com";
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    u.hostname = u.hostname.replace(/\.+$/, "");
    u.pathname = "/sso";
    u.search = "";
    u.hash = "";
    return u.toString();
  } catch {
    return "https://license.waamtech.com/sso";
  }
}

export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

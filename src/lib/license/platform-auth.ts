/**
 * Platform (License Engine staff) authentication.
 * Super Admin / administrator / support_staff live in Engine `users` —
 * one identity, one password across Website, Admin Portal, and ERP integrations.
 */
import { toPublicError } from "@/lib/api/errors";
import { logApiError } from "@/lib/api/logger";
import { licenseConfig, normalizeLicenseBase } from "@/lib/license/config";
import { isLoopbackHostname, isLoopbackUrl } from "@/lib/network/address-space";

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
  code?: string;
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

function rawMessage(json: LicenseApiResponse<unknown>): string {
  if (typeof json.message === "string" && json.message.trim()) return json.message;
  if (typeof json.error?.message === "string" && json.error.message.trim()) {
    return json.error.message;
  }
  return "";
}

function rawCode(json: LicenseApiResponse<unknown>): string | undefined {
  if (typeof json.code === "string" && json.code.trim()) return json.code.trim();
  if (typeof json.error?.code === "string" && json.error.code.trim()) {
    return json.error.code.trim();
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

/**
 * Staff login paths under LICENSE_API_URL (…/api) → /v1/auth/login
 * Matches Control Center API_PREFIX `/api/v1` + `/auth`.
 */
async function requestPlatformAuth<T>(
  method: "GET" | "POST",
  paths: string[],
  body?: unknown
): Promise<{ ok: boolean; status: number; message: string; code?: string; data?: T }> {
  const base = normalizeLicenseBase(licenseConfig.apiUrl);
  let lastError = "License service unavailable.";
  let lastCode: string | undefined;
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
      // 401/403 = not a staff account or bad password — caller may fall through
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

export async function platformLogin(input: {
  email: string;
  password?: string;
  challenge_token?: string;
  email_code?: string;
  totp_code?: string;
  recovery_code?: string;
  captcha_token?: string;
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
    ...(input.captcha_token ? { captcha_token: input.captcha_token } : {}),
  });
}

export async function platformResendOtp(input: {
  challenge_token: string;
  captcha_token?: string;
}) {
  return requestPlatformAuth<PlatformEmailChallenge>(
    "POST",
    ["/v1/auth/resend-otp", "/auth/resend-otp"],
    {
      challenge_token: input.challenge_token,
      ...(input.captcha_token ? { captcha_token: input.captcha_token } : {}),
    }
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
  const accessToken =
    (typeof d.accessToken === "string" && d.accessToken) ||
    (typeof d.access_token === "string" && d.access_token) ||
    "";
  const refreshToken =
    (typeof d.refreshToken === "string" && d.refreshToken) ||
    (typeof d.refresh_token === "string" && d.refresh_token) ||
    "";
  if (
    !accessToken ||
    !refreshToken ||
    !d.user ||
    typeof d.user !== "object"
  ) {
    return false;
  }
  // Normalize snake_case onto the object for callers.
  (d as PlatformLoginSuccess).accessToken = accessToken;
  (d as PlatformLoginSuccess).refreshToken = refreshToken;
  return true;
}

export function isPlatformStaffRole(role: string | null | undefined): boolean {
  const r = String(role || "").toLowerCase();
  return r === "super_admin" || r === "administrator" || r === "support_staff";
}

const DEFAULT_LICENSE_PORTAL_SSO = "https://license.waamto.com/sso";

/**
 * Where Platform staff land after Website login (License Engine Admin).
 *
 * Never return a loopback SSO URL when the browser page is not also loopback —
 * that triggers Chrome's "Allow other apps and services on this device"
 * (loopback-network) permission prompt. Local Control Center tokens also cannot
 * be posted to production SSO; callers must handle `ok: false`.
 */
export function platformAdminPortalUrl(opts?: {
  /** Origin of the page that will perform the browser SSO form POST. */
  browserOrigin?: string | null;
}): { ok: true; url: string } | { ok: false; reason: string; configuredUrl: string } {
  const raw =
    process.env.NEXT_PUBLIC_LICENSE_PORTAL_URL ||
    process.env.LICENSE_PORTAL_URL ||
    licenseConfig.portalUrl ||
    "https://license.waamto.com";

  let configuredUrl = DEFAULT_LICENSE_PORTAL_SSO;
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    u.hostname = u.hostname.replace(/\.+$/, "");
    u.pathname = "/sso";
    u.search = "";
    u.hash = "";
    configuredUrl = u.toString();
  } catch {
    configuredUrl = DEFAULT_LICENSE_PORTAL_SSO;
  }

  const browserOrigin = opts?.browserOrigin?.trim() || "";
  if (browserOrigin && isLoopbackUrl(configuredUrl)) {
    try {
      const pageHost = new URL(browserOrigin).hostname;
      if (!isLoopbackHostname(pageHost)) {
        return {
          ok: false,
          configuredUrl,
          reason:
            "Platform SSO target is localhost but this page is not. Browser→loopback would trigger Chrome Apps-on-device (loopback-network). Open the site via http://localhost:<port> for local Super Admin SSO, or set NEXT_PUBLIC_LICENSE_PORTAL_URL to a non-loopback Admin Portal.",
        };
      }
    } catch {
      /* ignore bad origin — allow configured URL */
    }
  }

  return { ok: true, url: configuredUrl };
}

export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Identity `/login` may return Platform Super Admin payloads (via Engine
 * tryLogin) before falling through to commercial customers.
 */
export function isPlatformSuperAdminPayload(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (d.account_type === "platform_super_admin") return true;
  if (d.user && typeof d.user === "object") {
    const role = String((d.user as { role?: string }).role || "").toLowerCase();
    return role === "super_admin";
  }
  return false;
}

export function isPlatformStepUpRedirect(data: unknown): data is {
  requires_step_up: true;
  redirect_url: string;
  message?: string;
} {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    d.requires_step_up === true &&
    typeof d.redirect_url === "string" &&
    Boolean(String(d.redirect_url).trim())
  );
}

import type { NextResponse } from "next/server";
import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { apiFail, apiSuccess } from "@/lib/api/response";
import { readPortalTokens } from "@/lib/auth/session";
import {
  identityDisableEmailOtp,
  identityEnableEmailOtp,
  identityListSecurityEvents,
  identityListTrustedDevices,
  identityMfaStatus,
  identityMe,
  identityRegenerateRecoveryCodes,
  identityRevokeSession,
  identityRevokeTrustedDevice,
  identitySetActiveSecondFactor,
  identityTotpDisable,
  identityTotpEnable,
  identityTotpSetup,
} from "@/lib/license/identity";
import {
  applyPortalRefreshCookies,
  clearPortalOnUnauthorized,
  resolvePortalAccess,
} from "@/lib/portal/access";
import { normalizeTotpSetupPayload } from "@/lib/portal/totp-setup";
import { isSameOrigin, sanitizeText } from "@/lib/security/guards";

async function resolveAccess() {
  const resolved = await resolvePortalAccess();
  if (!resolved.ok) {
    const res = apiFail(resolved.message, {
      status: resolved.status,
      code:
        resolved.status === 403
          ? ApiErrorCode.FORBIDDEN
          : ApiErrorCode.UNAUTHORIZED,
      ...(resolved.code
        ? { extra: { reason: resolved.code } }
        : {}),
    });
    return {
      ok: false as const,
      response: clearPortalOnUnauthorized(res, resolved.status),
    };
  }
  return { ok: true as const, access: resolved.access };
}

async function withRefresh(
  res: NextResponse,
  access: { accessToken: string; refreshToken?: string; refreshed?: { accessToken: string; refreshToken: string } }
) {
  const { remember } = await readPortalTokens();
  applyPortalRefreshCookies(res, access, Boolean(remember));
  return res;
}

export const GET = withApiHandler(
  async (req) => {
    if (!isSameOrigin(req)) {
      return apiFail("Invalid request origin.", {
        status: 403,
        code: ApiErrorCode.FORBIDDEN,
      });
    }

    const resolved = await resolveAccess();
    if (!resolved.ok) return resolved.response;

    const url = new URL(req.url);
    const view = sanitizeText(url.searchParams.get("view") || "status", 40);
    const token = resolved.access.accessToken;

    if (view === "trusted-devices") {
      const result = await identityListTrustedDevices(token);
      if (!result.ok) {
        return apiFail(result.message || "Unable to load trusted devices.", {
          status: result.status || 502,
        });
      }
      const res = apiSuccess("OK", { data: result.data ?? [] });
      return withRefresh(res, resolved.access);
    }

    if (view === "events") {
      const page = Number(url.searchParams.get("page") || "1");
      const limit = Number(url.searchParams.get("limit") || "20");
      const result = await identityListSecurityEvents(token, {
        page: Number.isFinite(page) ? page : 1,
        limit: Number.isFinite(limit) ? limit : 20,
      });
      if (!result.ok) {
        return apiFail(result.message || "Unable to load security events.", {
          status: result.status || 502,
        });
      }
      const res = apiSuccess("OK", { data: result.data ?? [] });
      return withRefresh(res, resolved.access);
    }

    const result = await identityMfaStatus(token);
    if (!result.ok) {
      return apiFail(result.message || "Unable to load security status.", {
        status: result.status || 502,
      });
    }
    const res = apiSuccess("OK", { data: result.data ?? null });
    return withRefresh(res, resolved.access);
  },
  { endpoint: "/api/portal/security" }
);

export const POST = withApiHandler(
  async (req) => {
    if (!isSameOrigin(req)) {
      return apiFail("Invalid request origin.", {
        status: 403,
        code: ApiErrorCode.FORBIDDEN,
      });
    }

    const resolved = await resolveAccess();
    if (!resolved.ok) return resolved.response;

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const action = sanitizeText(body.action, 64);
    const token = resolved.access.accessToken;
    const password = String(body.password || body.current_password || "");
    const totpCode = sanitizeText(body.totp_code || body.code, 12);
    const recoveryCode = sanitizeText(body.recovery_code, 64);
    const emailCode = sanitizeText(body.email_code || body.otp, 12);

    let result;

    switch (action) {
      case "email-otp-enable":
        if (!password) {
          return apiFail("Password is required.", {
            status: 400,
            code: ApiErrorCode.VALIDATION_ERROR,
          });
        }
        result = await identityEnableEmailOtp(token, { password });
        break;
      case "email-otp-disable":
        if (!password) {
          return apiFail("Password is required.", {
            status: 400,
            code: ApiErrorCode.VALIDATION_ERROR,
          });
        }
        result = await identityDisableEmailOtp(token, {
          password,
          totp_code: totpCode || undefined,
          email_code: emailCode || undefined,
          recovery_code: recoveryCode || undefined,
        });
        break;
      case "totp-setup": {
        result = await identityTotpSetup(token);
        if (result.ok && result.data) {
          let accountLabel: string | null = null;
          try {
            const me = await identityMe(token);
            accountLabel =
              me.data?.identity?.email || me.data?.identity?.username || null;
          } catch {
            /* optional label for otpauth issuer */
          }
          const normalized = normalizeTotpSetupPayload(result.data, accountLabel);
          result = {
            ...result,
            data: {
              ...((result.data as object) || {}),
              secret: normalized.secret,
              otpauth_url: normalized.otpauthUrl,
            },
          };
        }
        break;
      }
      case "totp-enable":
        if (!totpCode) {
          return apiFail("Authenticator code is required.", {
            status: 400,
            code: ApiErrorCode.VALIDATION_ERROR,
          });
        }
        result = await identityTotpEnable(token, { code: totpCode });
        break;
      case "totp-disable":
        if (!password) {
          return apiFail("Password is required.", {
            status: 400,
            code: ApiErrorCode.VALIDATION_ERROR,
          });
        }
        result = await identityTotpDisable(token, {
          password,
          totp_code: totpCode || undefined,
          recovery_code: recoveryCode || undefined,
        });
        break;
      case "recovery-codes":
        if (!password || !totpCode) {
          return apiFail("Password and authenticator code are required.", {
            status: 400,
            code: ApiErrorCode.VALIDATION_ERROR,
          });
        }
        result = await identityRegenerateRecoveryCodes(token, {
          password,
          totp_code: totpCode,
        });
        break;
      case "active-method": {
        const method = sanitizeText(body.active_second_factor, 20);
        if (method !== "email_otp" && method !== "totp") {
          return apiFail("Choose email_otp or totp as the active second factor.", {
            status: 400,
            code: ApiErrorCode.VALIDATION_ERROR,
          });
        }
        result = await identitySetActiveSecondFactor(token, {
          active_second_factor: method,
        });
        break;
      }
      case "revoke-session": {
        const sessionId = sanitizeText(body.session_id || body.id, 80);
        if (!sessionId) {
          return apiFail("Session id is required.", {
            status: 400,
            code: ApiErrorCode.VALIDATION_ERROR,
          });
        }
        result = await identityRevokeSession(token, sessionId);
        break;
      }
      case "revoke-device": {
        const deviceId = sanitizeText(body.device_id || body.id, 80);
        if (!deviceId) {
          return apiFail("Device id is required.", {
            status: 400,
            code: ApiErrorCode.VALIDATION_ERROR,
          });
        }
        result = await identityRevokeTrustedDevice(token, deviceId);
        break;
      }
      default:
        return apiFail("Unknown security action.", {
          status: 400,
          code: ApiErrorCode.VALIDATION_ERROR,
        });
    }

    if (!result.ok) {
      return apiFail(result.message || "Security update failed.", {
        status: result.status || 502,
      });
    }

    const res = apiSuccess(result.message || "Security updated.", {
      data: result.data ?? null,
    });
    return withRefresh(res, resolved.access);
  },
  { endpoint: "/api/portal/security" }
);

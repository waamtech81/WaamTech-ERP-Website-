import type { NextRequest } from "next/server";
import {
  clearChallengeCookie,
  createSsoBootstrap,
  json,
  parseLoginResult,
  readChallengeCookie,
  readJsonBody,
  requireMutationRequest,
  safeString,
  setChallengeCookie,
  upstream,
  upstreamMessage,
} from "@/lib/workforce/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const blocked = await requireMutationRequest(
    request,
    "mfa",
    12,
    15 * 60_000
  );
  if (blocked) return blocked;

  const challenge = readChallengeCookie(request);
  if (!challenge) {
    return json(
      {
        success: false,
        code: "challenge_expired",
        message: "Your verification challenge expired. Sign in again.",
      },
      { status: 401 }
    );
  }
  if (challenge.challengeType.toLowerCase().includes("passkey")) {
    return json(
      {
        success: false,
        code: "passkey_unavailable",
        message:
          "Passkey verification cannot continue without published assertion options.",
      },
      { status: 409 }
    );
  }

  const body = await readJsonBody(request);
  if (!body) {
    return json({ success: false, message: "A JSON request body is required." }, { status: 400 });
  }
  const code = safeString(body.code || body.otp || body.totp_code, 32);
  const recoveryCode = safeString(body.recovery_code, 128);
  const trustDevice = body.trust_device === true;
  if (!code && !recoveryCode) {
    return json(
      { success: false, message: "Enter your verification code." },
      { status: 400 }
    );
  }

  try {
    const result = await upstream("/mfa/verify", {
      method: "POST",
      body: JSON.stringify({
        challenge_id: challenge.challengeId,
        challenge_type: challenge.challengeType,
        ...(challenge.correlationId
          ? { correlation_id: challenge.correlationId }
          : {}),
        ...(code ? { code } : {}),
        ...(recoveryCode ? { recovery_code: recoveryCode } : {}),
        remember_device: trustDevice,
      }),
    });
    const parsed = parseLoginResult(result.data);
    if (!result.ok || !parsed) {
      return json(
        {
          success: false,
          message: upstreamMessage(result.data, "The verification code is invalid or expired."),
        },
        { status: result.status >= 400 && result.status < 600 ? result.status : 401 }
      );
    }

    if (parsed.kind === "mfa") {
      if (parsed.challenge.challengeType.toLowerCase().includes("passkey")) {
        return json(
          {
            success: false,
            code: "passkey_unavailable",
            message:
              "The next verification step requires unpublished passkey assertion options.",
          },
          { status: 409 }
        );
      }
      const response = json({
        success: true,
        status: "mfa_required",
        challengeType: parsed.challenge.challengeType,
      });
      setChallengeCookie(response, parsed.challenge);
      return response;
    }

    const bootstrap = await createSsoBootstrap(request, parsed.tokens);
    if (!bootstrap.ok) {
      return json(
        { success: false, message: bootstrap.message },
        { status: bootstrap.status }
      );
    }
    const response = json({
      success: true,
      status: "authorizing",
      redirectUrl: bootstrap.redirectUrl,
    });
    clearChallengeCookie(response);
    bootstrap.applyCookies(response);
    return response;
  } catch {
    return json(
      { success: false, message: "Verification is temporarily unavailable." },
      { status: 502 }
    );
  }
}

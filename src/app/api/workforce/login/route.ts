import type { NextRequest } from "next/server";
import {
  clearChallengeCookie,
  createSsoBootstrap,
  json,
  parseLoginResult,
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
    "login",
    10,
    15 * 60_000
  );
  if (blocked) return blocked;

  const body = await readJsonBody(request);
  if (!body) {
    return json({ success: false, message: "A JSON request body is required." }, { status: 400 });
  }

  if (body.passkey === true || safeString(body.method, 32) === "passkey") {
    return json(
      {
        success: false,
        code: "passkey_unavailable",
        message:
          "Passkey sign-in is unavailable because the identity service has not published assertion options.",
      },
      { status: 409 }
    );
  }

  const email = safeString(body.email || body.username, 254);
  const password = typeof body.password === "string" ? body.password.slice(0, 1024) : "";
  const deviceFingerprint = safeString(body.device_fingerprint, 512);
  if (!email || !password) {
    return json(
      { success: false, message: "Work email and password are required." },
      { status: 400 }
    );
  }

  try {
    const result = await upstream("/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        ...(deviceFingerprint ? { device_fingerprint: deviceFingerprint } : {}),
      }),
    });
    const parsed = parseLoginResult(result.data);
    if (!result.ok || !parsed) {
      return json(
        {
          success: false,
          message: upstreamMessage(result.data, "Sign-in failed. Check your credentials and try again."),
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
              "This account requires a passkey, but assertion options are not available from the identity service.",
          },
          { status: 409 }
        );
      }
      const response = json({
        success: true,
        status: "mfa_required",
        challengeType: parsed.challenge.challengeType,
        redirectUrl: "/workforce/mfa",
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
      { success: false, message: "Workforce sign-in is temporarily unavailable." },
      { status: 502 }
    );
  }
}

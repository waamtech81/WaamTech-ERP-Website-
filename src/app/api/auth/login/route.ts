import { NextResponse } from "next/server";
import { authConfig, normalizeApiBase } from "@/lib/auth/config";
import {
  getClientIp,
  isSameOrigin,
  looksLikeBotPayload,
  rateLimit,
  sanitizeText,
} from "@/lib/security/guards";

type ApiEnvelope = {
  success?: boolean;
  message?: string;
  data?: Record<string, unknown>;
};

export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) {
      return NextResponse.json(
        { success: false, message: "Invalid request origin." },
        { status: 403 }
      );
    }

    const ip = getClientIp(req);
    const limited = rateLimit(`login:${ip}`, 12, 15 * 60_000);
    if (!limited.ok) {
      return NextResponse.json(
        {
          success: false,
          message: `Too many login attempts. Try again in ${limited.retryAfter}s.`,
        },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
      );
    }

    const body = await req.json();

    if (looksLikeBotPayload(body || {})) {
      return NextResponse.json(
        { success: false, message: "Login failed. Check your credentials." },
        { status: 401 }
      );
    }

    const username = sanitizeText(body?.username || body?.email, 254);
    const password = String(body?.password || "");

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username/email and password are required." },
        { status: 400 }
      );
    }

    const base = normalizeApiBase(authConfig.apiUrl);
    const res = await fetch(`${base}/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ username, password }),
      cache: "no-store",
    });

    let json: ApiEnvelope = {};
    try {
      json = (await res.json()) as ApiEnvelope;
    } catch {
      json = { success: false, message: "Invalid response from login service." };
    }

    if (!json.success) {
      return NextResponse.json(
        {
          success: false,
          message: json.message || "Login failed. Check your credentials.",
        },
        { status: res.status || 401 }
      );
    }

    const data = json.data || {};

    if (data.requiresSecurity) {
      return NextResponse.json({
        success: true,
        requiresSecurity: true,
        message:
          (data.security as { message?: string })?.message ||
          "Security verification required.",
        data: {
          requiresSecurity: true,
          // Avoid leaking full security challenge internals to the browser
          challenge: (data.security as { type?: string })?.type || "otp",
        },
      });
    }

    const accessToken = (data.accessToken || data.token) as string | undefined;
    const refreshToken = data.refreshToken as string | undefined;

    return NextResponse.json({
      success: true,
      message: json.message || "Logged in successfully.",
      data: {
        accessToken,
        refreshToken,
        user: data.user,
        tenant: data.tenant,
        expiresIn: data.expiresIn,
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Login service temporarily unavailable. Please try again.",
      },
      { status: 502 }
    );
  }
}

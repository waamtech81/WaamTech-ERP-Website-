import { NextResponse } from "next/server";
import { authConfig, normalizeApiBase } from "@/lib/auth/config";

type ApiEnvelope = {
  success?: boolean;
  message?: string;
  data?: Record<string, unknown>;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body || {};

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
      json = { success: false, message: "Invalid response from WaamTech API." };
    }

    if (!json.success) {
      return NextResponse.json(
        {
          success: false,
          message: json.message || "Login failed. Check your credentials.",
          data: json.data,
        },
        { status: res.status || 401 }
      );
    }

    const data = json.data || {};

    // Security challenge (2FA) — send back to client to show OTP step
    if (data.requiresSecurity) {
      return NextResponse.json({
        success: true,
        requiresSecurity: true,
        message: (data.security as { message?: string })?.message || "Security verification required.",
        data,
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
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to reach WaamTech login service.";
    return NextResponse.json(
      {
        success: false,
        message:
          message.includes("fetch") || message.includes("ECONNREFUSED")
            ? "Cannot connect to WaamTech API. Make sure the SaaS Core API is running, or set WAAMTECH_API_URL."
            : message,
      },
      { status: 502 }
    );
  }
}

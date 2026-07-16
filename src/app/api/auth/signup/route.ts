import { NextResponse } from "next/server";
import { authConfig, normalizeApiBase } from "@/lib/auth/config";

type ApiEnvelope = {
  success?: boolean;
  message?: string;
  data?: Record<string, unknown>;
};

async function callCore(path: string, body: unknown) {
  const base = normalizeApiBase(authConfig.apiUrl);
  const url = `${base}/v1${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  let json: ApiEnvelope = {};
  try {
    json = (await res.json()) as ApiEnvelope;
  } catch {
    json = { success: false, message: "Invalid response from WaamTech API." };
  }

  return { status: res.status, json };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      username,
      password,
      phone,
      company_name,
      company_phone,
      company_email,
      profile_id,
      plan,
    } = body || {};

    if (!name || !password || !(username || email) || !company_name || !profile_id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please fill name, email or username, password, company name, and business profile.",
        },
        { status: 400 }
      );
    }

    const { status, json } = await callCore("/auth/signup", {
      name,
      email,
      username: username || email?.split("@")[0],
      password,
      phone,
      company_name,
      company_phone,
      company_email,
      profile_id,
      // plan is marketing intent — Core signup uses profile_id; trial is applied automatically
      metadata: plan ? { intended_plan: plan } : undefined,
    });

    if (!json.success) {
      return NextResponse.json(
        {
          success: false,
          message: json.message || "Signup failed. Please try again.",
        },
        { status: status || 400 }
      );
    }

    const data = json.data || {};
    const accessToken = (data.accessToken || data.token) as string | undefined;
    const refreshToken = data.refreshToken as string | undefined;

    return NextResponse.json({
      success: true,
      message:
        json.message ||
        `Account created. Your ${authConfig.trialDays}-day free trial has started.`,
      data: {
        accessToken,
        refreshToken,
        user: data.user,
        tenant: data.tenant,
        provisioning: data.provisioning,
        trialDays: authConfig.trialDays,
        plan: plan || "trial",
        profile_id,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to reach WaamTech signup service.";
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

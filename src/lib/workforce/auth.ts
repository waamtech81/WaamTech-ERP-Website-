import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { NextResponse, type NextRequest } from "next/server";
import { getClientIp, isSameOrigin, rateLimit } from "@/lib/security/guards";

const DEFAULT_API_URL = "https://api.license.waamto.com/api/v1/workforce";
const DEFAULT_ISSUER = "https://license.waamto.com/workforce";
const DEFAULT_CLIENT_ID = "waamto-website";
const DEFAULT_CONTROL_CENTER_URL = "https://license.waamto.com/control-center";
const SSO_AUDIENCE = "waamto:website-sso";

export const WORKFORCE_COOKIES = {
  challenge: "wt_workforce_challenge",
  pkceVerifier: "wt_workforce_pkce_verifier",
  pkceState: "wt_workforce_pkce_state",
  pkceNonce: "wt_workforce_pkce_nonce",
  pkceRedirect: "wt_workforce_pkce_redirect",
  access: "wt_workforce_access",
  refresh: "wt_workforce_refresh",
} as const;

type JsonRecord = Record<string, unknown>;

export type WorkforceIdentity = {
  id?: string;
  sub?: string;
  email?: string;
  name?: string;
  role?: string;
  roles?: string[];
  organization_id?: string;
  [key: string]: unknown;
};

export type WorkforceTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  identity?: WorkforceIdentity;
};

export type WorkforceChallenge = {
  challengeId: string;
  challengeType: string;
  correlationId?: string;
  riskScore?: number;
};

type WorkforceConfig = {
  apiUrl: string;
  issuer: string;
  clientId: string;
  controlCenterUrl: string;
};

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

function record(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

export function unwrapData(value: unknown): JsonRecord {
  const outer = record(value);
  const data = record(outer.data);
  return Object.keys(data).length ? { ...outer, ...data } : outer;
}

function strictUrl(
  raw: string | undefined,
  fallback: string,
  options: { productionOnly?: boolean; requiredPathSuffix?: string } = {}
): string {
  const input = (raw || fallback).trim();
  const url = new URL(input);
  const loopback =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "[::1]";

  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.protocol !== "https:" && !(url.protocol === "http:" && loopback))
  ) {
    throw new Error("Invalid Workforce URL configuration.");
  }
  if (options.productionOnly && url.protocol !== "https:") {
    throw new Error("Control Center must use a production HTTPS URL.");
  }

  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  if (
    options.requiredPathSuffix &&
    !url.pathname.endsWith(options.requiredPathSuffix)
  ) {
    throw new Error("WORKFORCE_API_URL must end with /api/v1/workforce.");
  }
  return url.toString().replace(/\/$/, "");
}

export function workforceConfig(): WorkforceConfig {
  const clientId = (process.env.WORKFORCE_CLIENT_ID || DEFAULT_CLIENT_ID).trim();
  if (!/^[A-Za-z0-9._:-]{3,128}$/.test(clientId)) {
    throw new Error("Invalid WORKFORCE_CLIENT_ID.");
  }

  return {
    apiUrl: strictUrl(process.env.WORKFORCE_API_URL, DEFAULT_API_URL, {
      requiredPathSuffix: "/api/v1/workforce",
    }),
    issuer: strictUrl(process.env.WORKFORCE_ISSUER, DEFAULT_ISSUER),
    clientId,
    controlCenterUrl: strictUrl(
      process.env.NEXT_PUBLIC_CONTROL_CENTER_URL,
      DEFAULT_CONTROL_CENTER_URL,
      { productionOnly: true }
    ),
  };
}

export function noStoreHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("Cache-Control", "no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  headers.set("X-Content-Type-Options", "nosniff");
  return headers;
}

export function json(
  body: unknown,
  init: { status?: number; headers?: HeadersInit } = {}
): NextResponse {
  return NextResponse.json(body, {
    status: init.status,
    headers: noStoreHeaders(init.headers),
  });
}

export async function requireMutationRequest(
  request: Request,
  bucket: string,
  limit: number,
  windowMs: number
): Promise<NextResponse | null> {
  if (!isSameOrigin(request)) {
    return json({ success: false, message: "Invalid request origin." }, { status: 403 });
  }
  const hit = await rateLimit(
    `workforce:${bucket}:${getClientIp(request)}`,
    limit,
    windowMs
  );
  if (!hit.ok) {
    return json(
      {
        success: false,
        message: `Too many attempts. Try again in ${hit.retryAfter}s.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(hit.retryAfter) },
      }
    );
  }
  return null;
}

export async function readJsonBody(request: Request): Promise<JsonRecord | null> {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("application/json")) return null;
  try {
    return record(await request.json());
  } catch {
    return null;
  }
}

export function safeString(value: unknown, max: number): string {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max)
    : "";
}

export async function upstream(
  path: string,
  init: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: JsonRecord; headers: Headers }> {
  const config = workforceConfig();
  const response = await fetch(`${config.apiUrl}${path}`, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  let data: JsonRecord = {};
  try {
    data = record(await response.json());
  } catch {
    // Upstream errors may have no JSON body.
  }
  return {
    ok: response.ok,
    status: response.status,
    data,
    headers: response.headers,
  };
}

export function upstreamMessage(data: unknown, fallback: string): string {
  const value = unwrapData(data);
  const message = safeString(value.message || value.error_description, 240);
  return message || fallback;
}

export function parseLoginResult(data: unknown):
  | { kind: "mfa"; challenge: WorkforceChallenge }
  | { kind: "authenticated"; tokens: WorkforceTokens }
  | null {
  const value = unwrapData(data);
  const status = safeString(value.status, 32);
  if (status === "mfa_required") {
    const challengeId = safeString(value.challenge_id, 2048);
    const challengeType = safeString(value.challenge_type, 64);
    if (!challengeId || !challengeType) return null;
    return {
      kind: "mfa",
      challenge: {
        challengeId,
        challengeType,
        correlationId: safeString(value.correlation_id, 256) || undefined,
        riskScore:
          typeof value.risk_score === "number" ? value.risk_score : undefined,
      },
    };
  }

  if (status === "authenticated" || value.access_token) {
    const accessToken = safeString(value.access_token, 16_384);
    const refreshToken = safeString(value.refresh_token, 16_384);
    if (!accessToken || !refreshToken) return null;
    return {
      kind: "authenticated",
      tokens: {
        accessToken,
        refreshToken,
        expiresIn:
          typeof value.expires_in === "number" ? value.expires_in : undefined,
        identity: record(value.identity) as WorkforceIdentity,
      },
    };
  }
  return null;
}

function encodeCookieJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodeCookieJson(value: string | undefined): JsonRecord | null {
  if (!value) return null;
  try {
    return record(JSON.parse(Buffer.from(value, "base64url").toString("utf8")));
  } catch {
    return null;
  }
}

function cookieSecure(): boolean {
  return process.env.NODE_ENV === "production";
}

const tempCookie = {
  httpOnly: true,
  secure: cookieSecure(),
  sameSite: "lax" as const,
  path: "/",
  priority: "high" as const,
  maxAge: 10 * 60,
};

export function setChallengeCookie(
  response: NextResponse,
  challenge: WorkforceChallenge
): void {
  response.cookies.set(
    WORKFORCE_COOKIES.challenge,
    encodeCookieJson(challenge),
    tempCookie
  );
}

export function readChallengeCookie(request: NextRequest): WorkforceChallenge | null {
  const value = decodeCookieJson(
    request.cookies.get(WORKFORCE_COOKIES.challenge)?.value
  );
  const challengeId = safeString(value?.challengeId, 2048);
  const challengeType = safeString(value?.challengeType, 64);
  if (!challengeId || !challengeType) return null;
  return {
    challengeId,
    challengeType,
    correlationId: safeString(value?.correlationId, 256) || undefined,
    riskScore:
      typeof value?.riskScore === "number" ? value.riskScore : undefined,
  };
}

export function clearChallengeCookie(response: NextResponse): void {
  response.cookies.set(WORKFORCE_COOKIES.challenge, "", {
    ...tempCookie,
    maxAge: 0,
  });
}

function randomBase64Url(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

function sha256Base64Url(value: string): string {
  return createHash("sha256").update(value).digest("base64url");
}

function safeRequestOrigin(request: Request): string {
  const url = new URL(request.url);
  const loopback =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "[::1]";
  if (url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) {
    throw new Error("Untrusted Website origin.");
  }
  return url.origin;
}

function parseAuthorizationCode(
  data: JsonRecord,
  location: string | null,
  expectedRedirect: string,
  expectedState: string
): string | null {
  const value = unwrapData(data);
  const candidate = safeString(
    value.redirect_to || value.redirect_uri || value.redirect_url || value.location,
    8192
  ) || location || "";
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    if (`${url.origin}${url.pathname}` !== expectedRedirect) return null;
    if (url.searchParams.get("state") !== expectedState) return null;
    return safeString(url.searchParams.get("code"), 4096) || null;
  } catch {
    return null;
  }
}

async function revokeBootstrap(accessToken: string): Promise<void> {
  try {
    await upstream("/sso/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    // Best effort only; no bootstrap token is persisted or returned to the browser.
  }
}

export async function createSsoBootstrap(
  request: Request,
  tokens: WorkforceTokens
): Promise<
  | { ok: true; redirectUrl: string; applyCookies: (response: NextResponse) => void }
  | { ok: false; status: number; message: string }
> {
  const verifier = randomBase64Url(48);
  const state = randomBase64Url(24);
  const nonce = randomBase64Url(24);
  const challenge = sha256Base64Url(verifier);
  const redirectUri = `${safeRequestOrigin(request)}/api/workforce/sso/callback`;
  const config = workforceConfig();

  try {
    const result = await upstream("/sso/authorize", {
      method: "POST",
      redirect: "manual",
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
      body: JSON.stringify({
        client_id: config.clientId,
        redirect_uri: redirectUri,
        state,
        nonce,
        code_challenge: challenge,
        code_challenge_method: "S256",
      }),
    });
    const code = parseAuthorizationCode(
      result.data,
      result.headers.get("location"),
      redirectUri,
      state
    );
    if (!result.ok && result.status !== 302 && result.status !== 303) {
      return {
        ok: false,
        status: result.status || 502,
        message: upstreamMessage(result.data, "Unable to start secure sign-in."),
      };
    }
    if (!code) {
      return {
        ok: false,
        status: 502,
        message: "The identity service returned an invalid authorization response.",
      };
    }

    const callback = new URL(redirectUri);
    callback.searchParams.set("code", code);
    callback.searchParams.set("state", state);
    return {
      ok: true,
      redirectUrl: callback.toString(),
      applyCookies(response) {
        response.cookies.set(WORKFORCE_COOKIES.pkceVerifier, verifier, tempCookie);
        response.cookies.set(WORKFORCE_COOKIES.pkceState, state, tempCookie);
        response.cookies.set(WORKFORCE_COOKIES.pkceNonce, nonce, tempCookie);
        response.cookies.set(
          WORKFORCE_COOKIES.pkceRedirect,
          encodeCookieJson({ redirectUri }),
          tempCookie
        );
      },
    };
  } finally {
    await revokeBootstrap(tokens.accessToken);
  }
}

function constantEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function readPkceContext(request: NextRequest): {
  verifier: string;
  state: string;
  nonce: string;
  redirectUri: string;
} | null {
  const verifier =
    request.cookies.get(WORKFORCE_COOKIES.pkceVerifier)?.value || "";
  const state = request.cookies.get(WORKFORCE_COOKIES.pkceState)?.value || "";
  const nonce = request.cookies.get(WORKFORCE_COOKIES.pkceNonce)?.value || "";
  const redirect = decodeCookieJson(
    request.cookies.get(WORKFORCE_COOKIES.pkceRedirect)?.value
  );
  const redirectUri = safeString(redirect?.redirectUri, 2048);
  if (verifier.length < 43 || state.length < 8 || nonce.length < 8 || !redirectUri) {
    return null;
  }
  return { verifier, state, nonce, redirectUri };
}

export function clearPkceCookies(response: NextResponse): void {
  for (const name of [
    WORKFORCE_COOKIES.pkceVerifier,
    WORKFORCE_COOKIES.pkceState,
    WORKFORCE_COOKIES.pkceNonce,
    WORKFORCE_COOKIES.pkceRedirect,
  ]) {
    response.cookies.set(name, "", { ...tempCookie, maxAge: 0 });
  }
}

export async function exchangeAuthorizationCode(
  code: string,
  context: { verifier: string; redirectUri: string }
): Promise<
  { ok: true; tokens: WorkforceTokens } | { ok: false; status: number; message: string }
> {
  const config = workforceConfig();
  const result = await upstream("/sso/token", {
    method: "POST",
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: context.redirectUri,
      client_id: config.clientId,
      code_verifier: context.verifier,
      audience: SSO_AUDIENCE,
    }),
  });
  const parsed = parseLoginResult({
    ...unwrapData(result.data),
    status: "authenticated",
  });
  if (!result.ok || !parsed || parsed.kind !== "authenticated") {
    return {
      ok: false,
      status: result.status || 401,
      message: upstreamMessage(result.data, "The authorization code is invalid or expired."),
    };
  }
  return { ok: true, tokens: parsed.tokens };
}

function jwksProvider(): ReturnType<typeof createRemoteJWKSet> {
  if (!jwks) {
    const config = workforceConfig();
    jwks = createRemoteJWKSet(
      new URL(`${config.apiUrl}/.well-known/jwks.json`),
      { cooldownDuration: 30_000, cacheMaxAge: 10 * 60_000 }
    );
  }
  return jwks;
}

export async function verifyAccessToken(
  token: string,
  expectedNonce?: string
): Promise<JWTPayload> {
  const config = workforceConfig();
  const verified = await jwtVerify(token, jwksProvider(), {
    algorithms: ["EdDSA"],
    issuer: config.issuer,
    audience: SSO_AUDIENCE,
    clockTolerance: 5,
  });
  if (!verified.payload.sub) throw new Error("Missing token subject.");
  if (
    expectedNonce &&
    (typeof verified.payload.nonce !== "string" ||
      !constantEqual(verified.payload.nonce, expectedNonce))
  ) {
    throw new Error("Invalid token nonce.");
  }
  return verified.payload;
}

function sessionIdentity(data: unknown): WorkforceIdentity {
  const value = unwrapData(data);
  const session = record(value.session);
  const identity = record(value.identity);
  const nestedIdentity = record(session.identity);
  return (
    Object.keys(identity).length
      ? identity
      : Object.keys(nestedIdentity).length
        ? nestedIdentity
        : record(value.user)
  ) as WorkforceIdentity;
}

export async function validateUpstreamSession(
  accessToken: string,
  subject: string,
  sessionId?: string
): Promise<
  | { ok: true; identity: WorkforceIdentity; data: JsonRecord }
  | { ok: false; status: number }
> {
  const result = await upstream("/sso/session", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const value = unwrapData(result.data);
  if (
    !result.ok ||
    value.active === false ||
    value.revoked === true ||
    value.status === "revoked" ||
    value.status === "expired"
  ) {
    return { ok: false, status: result.status || 401 };
  }
  const identity = sessionIdentity(result.data);
  const upstreamSubject = safeString(
    identity.sub || identity.id || value.sub || value.subject,
    256
  );
  const upstreamSessionId = safeString(value.sid, 256);
  if (
    value.valid !== true ||
    !upstreamSubject ||
    !constantEqual(upstreamSubject, subject) ||
    (sessionId &&
      (!upstreamSessionId || !constantEqual(upstreamSessionId, sessionId)))
  ) {
    return { ok: false, status: 401 };
  }
  return { ok: true, identity, data: value };
}

export async function validateWorkforceSession(
  accessToken: string
): Promise<
  | { ok: true; payload: JWTPayload; identity: WorkforceIdentity }
  | { ok: false; status: number }
> {
  try {
    const payload = await verifyAccessToken(accessToken);
    const active = await validateUpstreamSession(
      accessToken,
      payload.sub!,
      typeof payload.sid === "string" ? payload.sid : undefined
    );
    if (!active.ok) return active;
    return { ok: true, payload, identity: active.identity };
  } catch {
    return { ok: false, status: 401 };
  }
}

export function setSessionCookies(
  response: NextResponse,
  tokens: WorkforceTokens,
  payload: JWTPayload
): void {
  const now = Math.floor(Date.now() / 1000);
  const jwtLifetime = typeof payload.exp === "number" ? payload.exp - now : 3600;
  const accessMaxAge = Math.max(60, Math.min(jwtLifetime, 8 * 60 * 60));
  const common = {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax" as const,
    path: "/",
    priority: "high" as const,
  };
  response.cookies.set(WORKFORCE_COOKIES.access, tokens.accessToken, {
    ...common,
    maxAge: accessMaxAge,
  });
  response.cookies.set(WORKFORCE_COOKIES.refresh, tokens.refreshToken, {
    ...common,
    maxAge: 7 * 24 * 60 * 60,
  });
}

export function clearSessionCookies(response: NextResponse): void {
  const options = {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax" as const,
    path: "/",
    priority: "high" as const,
    maxAge: 0,
  };
  response.cookies.set(WORKFORCE_COOKIES.access, "", options);
  response.cookies.set(WORKFORCE_COOKIES.refresh, "", options);
  clearChallengeCookie(response);
  clearPkceCookies(response);
}

export function accessTokenFrom(request: NextRequest): string {
  return request.cookies.get(WORKFORCE_COOKIES.access)?.value || "";
}

export function safeIdentity(identity: WorkforceIdentity): WorkforceIdentity {
  const allowed = [
    "id",
    "sub",
    "email",
    "name",
    "first_name",
    "last_name",
    "role",
    "roles",
    "organization_id",
    "organization_name",
    "permissions",
  ];
  return Object.fromEntries(
    allowed
      .filter((key) => identity[key] !== undefined)
      .map((key) => [key, identity[key]])
  ) as WorkforceIdentity;
}

export { constantEqual, SSO_AUDIENCE };

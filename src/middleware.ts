import { NextResponse, type NextRequest } from "next/server";
import { isBlockedPath, rateLimit, safeInternalPath } from "@/lib/security/guards";
import { isValidSessionToken } from "@/lib/security/session-token";
import { detectCurrency, detectLanguage, countryFromHeaders } from "@/lib/geo";
import { normalizeLanguage, LOCALE_STORAGE } from "@/i18n";
import { normalizeCurrency } from "@/lib/currency/config";

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-DNS-Prefetch-Control": "off",
  // Deny Chrome Local Network Access so login never prompts
  // "Allow other apps and services on this device" (loopback-network).
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(), local-network=(), loopback-network=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-Permitted-Cross-Domain-Policies": "none",
};

const PORTAL_ACCESS_COOKIE = "wt_portal_at";
const PORTAL_REFRESH_COOKIE = "wt_portal_rt";

const PROTECTED_PORTAL_PREFIXES = [
  "/portal",
  "/api/portal",
];

const NO_STORE_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/portal",
  "/api/auth",
  "/api/portal",
];

function applyHeaders(res: NextResponse, pathname?: string) {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(k, v);
  }
  if (
    pathname &&
    NO_STORE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    res.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
    res.headers.set("Pragma", "no-cache");
  }
  return res;
}

function clientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function hasPortalSession(req: NextRequest) {
  const access = req.cookies.get(PORTAL_ACCESS_COOKIE)?.value;
  const refresh = req.cookies.get(PORTAL_REFRESH_COOKIE)?.value;
  return Boolean(
    isValidSessionToken(access) || isValidSessionToken(refresh)
  );
}

function isProtectedPath(pathname: string) {
  return PROTECTED_PORTAL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year — remember preference

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  if (isBlockedPath(pathname)) {
    return applyHeaders(new NextResponse(null, { status: 404 }), pathname);
  }

  // Site-wide maintenance mode (env flag — does not touch License Engine / ERP)
  const maintenanceOn =
    process.env.SITE_MAINTENANCE === "1" ||
    process.env.NEXT_PUBLIC_SITE_MAINTENANCE === "1";
  if (
    maintenanceOn &&
    pathname !== "/maintenance" &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next")
  ) {
    const maintenanceUrl = req.nextUrl.clone();
    maintenanceUrl.pathname = "/maintenance";
    maintenanceUrl.search = "";
    return applyHeaders(NextResponse.redirect(maintenanceUrl), pathname);
  }

  if (pathname.startsWith("/api/auth/")) {
    const limited = await rateLimit(`mw-auth:${clientIp(req)}`, 60, 60_000);
    if (!limited.ok) {
      return applyHeaders(
        NextResponse.json(
          {
            success: false,
            code: "RATE_LIMITED",
            message: "Too many requests. Please wait a moment and try again.",
          },
          { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
        ),
        pathname
      );
    }
  }

  if (pathname.startsWith("/api/") && req.method === "POST") {
    const limited = await rateLimit(`mw-api:${clientIp(req)}`, 120, 60_000);
    if (!limited.ok) {
      return applyHeaders(
        NextResponse.json(
          {
            success: false,
            code: "RATE_LIMITED",
            message: "Too many requests. Please wait a moment and try again.",
          },
          { status: 429 }
        ),
        pathname
      );
    }
  }

  // Protect Customer Portal pages + APIs (session cookies from License Engine JWT)
  if (isProtectedPath(pathname) && !hasPortalSession(req)) {
    if (pathname.startsWith("/api/")) {
      return applyHeaders(
        NextResponse.json(
          {
            success: false,
            code: "UNAUTHORIZED",
            message: "Authentication required.",
          },
          { status: 401 }
        ),
        pathname
      );
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    // Only ever bounce back to a safe internal portal path
    loginUrl.searchParams.set("next", safeInternalPath(pathname));
    return applyHeaders(NextResponse.redirect(loginUrl), pathname);
  }

  // --- Locale & currency detection (additive; pages only) ---------------------
  if (pathname.startsWith("/api/")) {
    return applyHeaders(NextResponse.next(), pathname);
  }

  const cookieLang = req.cookies.get(LOCALE_STORAGE.langCookie)?.value;
  const cookieCurrency = req.cookies.get(LOCALE_STORAGE.currencyCookie)?.value;
  const queryLang = searchParams.get("lang");
  const queryCurrency = searchParams.get("currency");

  // Priority: explicit ?lang= → saved cookie → Accept-Language → GeoIP → default
  const language = queryLang
    ? normalizeLanguage(queryLang)
    : cookieLang
      ? normalizeLanguage(cookieLang)
      : detectLanguage(req.headers);

  const currency = queryCurrency
    ? normalizeCurrency(queryCurrency)
    : cookieCurrency
      ? normalizeCurrency(cookieCurrency)
      : detectCurrency(req.headers);

  const country = countryFromHeaders(req.headers) || req.cookies.get(LOCALE_STORAGE.countryCookie)?.value || "";

  // Forward detection to the server layout so first paint is correct (no flicker).
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-wt-lang", language);
  requestHeaders.set("x-wt-currency", currency);
  requestHeaders.set("x-wt-pathname", pathname);
  if (country) requestHeaders.set("x-wt-country", country);

  const res = NextResponse.next({ request: { headers: requestHeaders } });

  // Persist detection/selection so preference survives sessions.
  if (cookieLang !== language || queryLang) {
    res.cookies.set(LOCALE_STORAGE.langCookie, language, {
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      sameSite: "lax",
    });
  }
  if (cookieCurrency !== currency || queryCurrency) {
    res.cookies.set(LOCALE_STORAGE.currencyCookie, currency, {
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      sameSite: "lax",
    });
  }
  if (country && req.cookies.get(LOCALE_STORAGE.countryCookie)?.value !== country) {
    res.cookies.set(LOCALE_STORAGE.countryCookie, country, {
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      sameSite: "lax",
    });
  }

  return applyHeaders(res, pathname);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

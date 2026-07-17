import { NextResponse, type NextRequest } from "next/server";
import { isBlockedPath, rateLimit } from "@/lib/security/guards";
import { detectCurrency, detectLanguage, countryFromHeaders } from "@/lib/geo";
import { normalizeLanguage, LOCALE_STORAGE } from "@/i18n";
import { normalizeCurrency } from "@/lib/currency/config";

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-DNS-Prefetch-Control": "off",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-Permitted-Cross-Domain-Policies": "none",
};

function applyHeaders(res: NextResponse) {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(k, v);
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

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year — remember preference

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  if (isBlockedPath(pathname)) {
    return applyHeaders(new NextResponse(null, { status: 404 }));
  }

  if (pathname.startsWith("/api/auth/")) {
    const limited = rateLimit(`mw-auth:${clientIp(req)}`, 60, 60_000);
    if (!limited.ok) {
      return applyHeaders(
        NextResponse.json(
          { success: false, message: "Too many requests." },
          { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
        )
      );
    }
  }

  if (pathname.startsWith("/api/") && req.method === "POST") {
    const limited = rateLimit(`mw-api:${clientIp(req)}`, 120, 60_000);
    if (!limited.ok) {
      return applyHeaders(
        NextResponse.json(
          { success: false, message: "Too many requests." },
          { status: 429 }
        )
      );
    }
  }

  // --- Locale & currency detection (additive; pages only) ---------------------
  if (pathname.startsWith("/api/")) {
    return applyHeaders(NextResponse.next());
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

  return applyHeaders(res);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

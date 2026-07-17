import { NextResponse, type NextRequest } from "next/server";
import { isBlockedPath, rateLimit } from "@/lib/security/guards";

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

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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

  return applyHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

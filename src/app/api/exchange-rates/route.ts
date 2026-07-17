import { NextResponse } from "next/server";
import { getRates, RATE_TTL_SECONDS } from "@/lib/currency/exchange";

/**
 * Public, cacheable USD-based exchange rates for the client currency service.
 * All external provider calls happen here (server-side) so the browser only
 * talks same-origin (CSP connect-src 'self').
 */
export async function GET() {
  const table = await getRates();
  return NextResponse.json(
    { success: true, ...table },
    {
      headers: {
        // Cache at the edge/CDN; allow stale while revalidating.
        "Cache-Control": `public, max-age=300, s-maxage=${RATE_TTL_SECONDS}, stale-while-revalidate=86400`,
      },
    }
  );
}

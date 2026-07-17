import { NextResponse } from "next/server";
import { createContactCaptcha } from "@/lib/security/contact-captcha";
import { getClientIp, isSameOrigin, rateLimit } from "@/lib/security/guards";

export async function GET(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { success: false, message: "Invalid request origin." },
      { status: 403 }
    );
  }

  const ip = getClientIp(request);
  const limited = await rateLimit(`contact-captcha:${ip}`, 20, 15 * 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { success: false, message: "Too many captcha requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  const challenge = createContactCaptcha();
  return NextResponse.json({
    success: true,
    question: challenge.question,
    token: challenge.token,
    trackWidth: challenge.trackWidth,
    pieceSize: challenge.pieceSize,
    background: challenge.background,
    piece: challenge.piece,
  });
}

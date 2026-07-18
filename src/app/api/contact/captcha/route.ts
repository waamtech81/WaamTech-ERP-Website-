import { ApiErrorCode } from "@/lib/api/codes";
import { withApiHandler } from "@/lib/api/handler";
import { apiFail } from "@/lib/api/response";
import { createContactCaptcha } from "@/lib/security/contact-captcha";
import { getClientIp, isSameOrigin, rateLimit } from "@/lib/security/guards";

export const GET = withApiHandler(
  async (request) => {
    if (!isSameOrigin(request)) {
      return apiFail("Invalid request origin.", {
        status: 403,
        code: ApiErrorCode.FORBIDDEN,
      });
    }

    const ip = getClientIp(request);
    const limited = await rateLimit(`contact-captcha:${ip}`, 20, 15 * 60_000);
    if (!limited.ok) {
      return apiFail("Too many captcha requests. Please try again later.", {
        status: 429,
        code: ApiErrorCode.RATE_LIMITED,
        headers: { "Retry-After": String(limited.retryAfter) },
      });
    }

    const challenge = createContactCaptcha();
    return Response.json({
      success: true,
      message: "OK",
      question: challenge.question,
      token: challenge.token,
      trackWidth: challenge.trackWidth,
      pieceSize: challenge.pieceSize,
      background: challenge.background,
      piece: challenge.piece,
    });
  },
  { endpoint: "/api/contact/captcha" }
);

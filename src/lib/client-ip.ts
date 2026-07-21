/** Best-effort visitor IP behind nginx / Cloudflare / reverse proxies. */

export function isPrivateOrLocalIp(ip: string): boolean {
  const v = ip.trim().toLowerCase();
  if (!v || v === "unknown" || v === "::1" || v === "localhost") return true;
  if (v.startsWith("127.") || v.startsWith("10.") || v.startsWith("192.168.")) {
    return true;
  }
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(v)) return true;
  if (v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80:")) return true;
  return false;
}

/** Resolve the public client IP from common proxy headers. */
export function clientIpFromHeaders(headers: Headers): string {
  const direct =
    headers.get("cf-connecting-ip") ||
    headers.get("true-client-ip") ||
    headers.get("x-real-ip") ||
    headers.get("x-client-ip") ||
    "";
  const trimmed = direct.trim();
  if (trimmed && !isPrivateOrLocalIp(trimmed)) return trimmed;

  const xff = headers.get("x-forwarded-for");
  if (xff) {
    for (const part of xff.split(",")) {
      const ip = part.trim();
      if (ip && !isPrivateOrLocalIp(ip)) return ip;
    }
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }

  return trimmed;
}

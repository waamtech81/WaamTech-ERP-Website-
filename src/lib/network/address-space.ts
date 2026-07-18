/**
 * Helpers for Chrome Local Network Access (LNA).
 *
 * Chrome 145+ splits LNA into:
 * - loopback-network → UI: "Apps on device" / "Allow other apps and services on this device"
 * - local-network → UI: "Local Network"
 *
 * A browser request from a public or private-network origin to localhost/127.0.0.1
 * triggers the Apps-on-device prompt. WAAMTO email/password login must never do that:
 * Control Center identity calls stay server-side via /api/auth/*.
 */

export function isLoopbackHostname(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.+$/, "");
  if (!host) return false;
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "::1" || host === "[::1]") return true;
  // IPv4 loopback 127.0.0.0/8
  if (/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  return false;
}

export function isLoopbackUrl(value: string): boolean {
  try {
    const raw = value.trim();
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return isLoopbackHostname(url.hostname);
  } catch {
    return false;
  }
}

/**
 * True when a browser navigation/fetch from `pageOrigin` to `targetUrl`
 * would require Chrome's loopback-network ("Apps on device") permission.
 */
export function wouldTriggerLoopbackPermission(
  pageOrigin: string,
  targetUrl: string
): boolean {
  if (!isLoopbackUrl(targetUrl)) return false;
  try {
    const page = new URL(pageOrigin);
    // Loopback → loopback does not require the permission.
    return !isLoopbackHostname(page.hostname);
  } catch {
    return true;
  }
}

/** Upstream License Engine fetch with a hard timeout (prevents Cloudflare 502 on hang). */
export const LICENSE_UPSTREAM_TIMEOUT_MS = Number(
  process.env.LICENSE_REQUEST_TIMEOUT_MS || 18_000
);

export async function fetchLicenseUpstream(
  url: string,
  init: RequestInit = {},
  timeoutMs = LICENSE_UPSTREAM_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function licenseUpstreamErrorMessage(error: unknown): string {
  if (error instanceof Error && error.name === "AbortError") {
    return "License service timed out.";
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Could not reach license server.";
}

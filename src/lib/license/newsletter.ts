import { logApiError } from "@/lib/api/logger";
import { licenseConfig, normalizeLicenseBase } from "@/lib/license/config";

type SubscribeResult = {
  ok: boolean;
  message: string;
  alreadySubscribed?: boolean;
};

function licenseHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (licenseConfig.apiKey) {
    headers.Authorization = `Bearer ${licenseConfig.apiKey}`;
  }
  return headers;
}

/** Store footer newsletter signup in License Engine. */
export async function subscribeNewsletterOnLicenseServer(
  email: string
): Promise<SubscribeResult> {
  const base = normalizeLicenseBase(licenseConfig.apiUrl);
  const paths = ["/v1/public/newsletter/subscribe", "/public/newsletter/subscribe"];
  const body = { email, source: "website_footer" };

  for (const path of paths) {
    try {
      const res = await fetch(`${base}${path}`, {
        method: "POST",
        headers: licenseHeaders(),
        body: JSON.stringify(body),
        cache: "no-store",
      });

      let json: { success?: boolean; message?: string; data?: { created?: boolean } } = {};
      try {
        json = (await res.json()) as typeof json;
      } catch {
        json = { success: false, message: "Invalid response from license server." };
      }

      if (json.success === true || (res.ok && json.success === undefined)) {
        return {
          ok: true,
          message:
            json.message || "Thanks — you are subscribed to product updates.",
          alreadySubscribed: json.data?.created === false,
        };
      }

      const technical =
        json.message || `Newsletter subscribe failed (${res.status}).`;
      logApiError(new Error(technical), {
        endpoint: path,
        userEmail: email,
        httpStatus: res.status,
        technicalMessage: technical,
      });
      if (res.status !== 404) {
        return { ok: false, message: technical };
      }
    } catch (error) {
      const technical =
        error instanceof Error ? error.message : "Could not reach license server.";
      logApiError(error, {
        endpoint: path,
        userEmail: email,
        httpStatus: 502,
        technicalMessage: technical,
      });
    }
  }

  return {
    ok: false,
    message: "Could not complete subscription. Please try again.",
  };
}

/** Remove email from License Engine newsletter list. */
export async function unsubscribeNewsletterOnLicenseServer(
  email: string
): Promise<SubscribeResult> {
  const base = normalizeLicenseBase(licenseConfig.apiUrl);
  const paths = ["/v1/public/newsletter/unsubscribe", "/public/newsletter/unsubscribe"];
  const body = { email };

  for (const path of paths) {
    try {
      const res = await fetch(`${base}${path}`, {
        method: "POST",
        headers: licenseHeaders(),
        body: JSON.stringify(body),
        cache: "no-store",
      });

      let json: { success?: boolean; message?: string } = {};
      try {
        json = (await res.json()) as typeof json;
      } catch {
        json = { success: false, message: "Invalid response from license server." };
      }

      if (json.success === true || (res.ok && json.success === undefined)) {
        return {
          ok: true,
          message:
            json.message || "You have been unsubscribed from WAAMTO product updates.",
        };
      }

      const technical =
        json.message || `Newsletter unsubscribe failed (${res.status}).`;
      logApiError(new Error(technical), {
        endpoint: path,
        userEmail: email,
        httpStatus: res.status,
        technicalMessage: technical,
      });
      if (res.status !== 404) {
        return { ok: false, message: technical };
      }
    } catch (error) {
      const technical =
        error instanceof Error ? error.message : "Could not reach license server.";
      logApiError(error, {
        endpoint: path,
        userEmail: email,
        httpStatus: 502,
        technicalMessage: technical,
      });
    }
  }

  return {
    ok: false,
    message: "Could not complete unsubscribe. Please try again.",
  };
}

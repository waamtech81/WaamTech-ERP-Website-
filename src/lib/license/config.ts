export const licenseConfig = {
  /** License Engine API — identity login, OTP, licenses, refresh tokens */
  apiUrl:
    process.env.LICENSE_API_URL ||
    process.env.WAAMTECH_LICENSE_API_URL ||
    "https://license.waamto.com/api",
  /** Optional customer/license portal (external) */
  portalUrl:
    process.env.NEXT_PUBLIC_LICENSE_PORTAL_URL ||
    process.env.LICENSE_PORTAL_URL ||
    "https://license.waamto.com",
  apiKey: process.env.LICENSE_API_KEY || "",
};

export function normalizeLicenseBase(url: string) {
  return url.replace(/\/+$/, "");
}

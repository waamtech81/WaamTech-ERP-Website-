export const licenseConfig = {
  /** License server API — trial registration, package activation, license email */
  apiUrl:
    process.env.LICENSE_API_URL ||
    process.env.WAAMTECH_LICENSE_API_URL ||
    "https://license.waamto.com/api",
  /** Optional customer/license portal (manage packages & licenses) */
  portalUrl:
    process.env.NEXT_PUBLIC_LICENSE_PORTAL_URL ||
    process.env.LICENSE_PORTAL_URL ||
    "https://license.waamto.com",
  apiKey: process.env.LICENSE_API_KEY || "",
};

export function normalizeLicenseBase(url: string) {
  return url.replace(/\/+$/, "");
}

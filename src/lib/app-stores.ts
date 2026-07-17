/** Native app store URLs — set in .env when listings go live. */
export const appStoreConfig = {
  googlePlay:
    process.env.NEXT_PUBLIC_GOOGLE_PLAY_URL?.trim() || "",
  appStore:
    process.env.NEXT_PUBLIC_APP_STORE_URL?.trim() || "",
};

export function getGooglePlayUrl() {
  return appStoreConfig.googlePlay || "/mobile-app";
}

export function getAppStoreUrl() {
  return appStoreConfig.appStore || "/mobile-app";
}

export function isExternalStoreUrl(url: string) {
  return url.startsWith("http://") || url.startsWith("https://");
}

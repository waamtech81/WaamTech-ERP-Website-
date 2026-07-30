/** Auth flows where third-party widgets and commercial prefetch must stay minimal. */
export const AUTH_SURFACE_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
] as const;

export function isAuthSurfacePath(pathname: string): boolean {
  const path = (pathname || "/").toLowerCase();
  return AUTH_SURFACE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

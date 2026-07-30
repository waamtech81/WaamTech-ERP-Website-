"use client";

import { usePathname } from "next/navigation";
import type { UiLanguage } from "@/i18n";
import { OfflineBanner } from "@/components/layout/offline-banner";
import { GoogleTranslateBoot } from "@/components/providers/google-translate";
import { isAuthSurfacePath } from "@/lib/routing/auth-surfaces";

/**
 * Client pathname gate so soft navigations into /portal drop marketing chrome
 * immediately (server headers alone can lag until a full reload).
 */
export function SiteShellClient({
  children,
  language,
  header,
  footer,
  cookieBanner,
}: {
  children: React.ReactNode;
  language: UiLanguage;
  header: React.ReactNode;
  footer: React.ReactNode;
  cookieBanner: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const isPortal = pathname === "/portal" || pathname.startsWith("/portal/");
  const isAuthSurface = isAuthSurfacePath(pathname);
  const translateBoot = !isAuthSurface ? (
    <GoogleTranslateBoot language={language} />
  ) : null;

  if (isPortal) {
    return (
      <>
        {translateBoot}
        <OfflineBanner />
        {children}
      </>
    );
  }

  return (
    <>
      {translateBoot}
      <OfflineBanner />
      {header}
      <main className="relative z-[1] flex-1 overflow-x-clip bg-background">{children}</main>
      {footer}
      {cookieBanner}
    </>
  );
}

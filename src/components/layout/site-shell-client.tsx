"use client";

import { usePathname } from "next/navigation";
import type { UiLanguage } from "@/i18n";
import { OfflineBanner } from "@/components/layout/offline-banner";
import { GoogleTranslateBoot } from "@/components/providers/google-translate";

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

  if (isPortal) {
    return (
      <>
        <GoogleTranslateBoot language={language} />
        <OfflineBanner />
        {children}
      </>
    );
  }

  return (
    <>
      <GoogleTranslateBoot language={language} />
      <OfflineBanner />
      {header}
      <main className="relative z-[1] flex-1 bg-background">{children}</main>
      {footer}
      {cookieBanner}
    </>
  );
}

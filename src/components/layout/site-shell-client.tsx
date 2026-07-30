"use client";

import { usePathname } from "next/navigation";
import { OfflineBanner } from "@/components/layout/offline-banner";
import { isAuthSurfacePath } from "@/lib/routing/auth-surfaces";

/**
 * Client pathname gate so soft navigations into /portal drop marketing chrome
 * immediately (server headers alone can lag until a full reload).
 */
export function SiteShellClient({
  children,
  header,
  footer,
  cookieBanner,
}: {
  children: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
  cookieBanner: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const isPortal = pathname === "/portal" || pathname.startsWith("/portal/");

  if (isPortal) {
    return (
      <>
        <OfflineBanner />
        {children}
      </>
    );
  }

  return (
    <>
      <OfflineBanner />
      {header}
      <main className="relative z-[1] flex-1 overflow-x-clip bg-background">{children}</main>
      {footer}
      {cookieBanner}
    </>
  );
}

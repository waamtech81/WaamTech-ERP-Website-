import type { UiLanguage } from "@/i18n";
import { headers } from "next/headers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { OfflineBanner } from "@/components/layout/offline-banner";
import { GoogleTranslateBoot } from "@/components/providers/google-translate";

export async function SiteShell({
  children,
  language,
}: {
  children: React.ReactNode;
  language: UiLanguage;
}) {
  const h = await headers();
  const pathname = h.get("x-wt-pathname") || "";
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
      <Header />
      <main className="relative z-[1] flex-1 bg-background">{children}</main>
      <Footer />
      <CookieBanner />
    </>
  );
}

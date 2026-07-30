import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { SiteShellClient } from "@/components/layout/site-shell-client";

export async function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <SiteShellClient
      header={<Header />}
      footer={<Footer />}
      cookieBanner={<CookieBanner />}
    >
      {children}
    </SiteShellClient>
  );
}

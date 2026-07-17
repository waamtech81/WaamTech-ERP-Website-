import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ScrollProgress } from "@/components/layout/scroll-progress";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { GoogleTranslateBoot } from "@/components/providers/google-translate";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GoogleTranslateBoot />
      <ScrollProgress />
      <Header />
      {/* Solid stack above sticky footer so Huekland-style reveal works */}
      <main className="relative z-[1] flex-1 bg-background">{children}</main>
      <Footer />
      <CookieBanner />
    </>
  );
}

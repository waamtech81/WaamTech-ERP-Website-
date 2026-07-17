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
      <main className="flex-1">{children}</main>
      <Footer />
      <CookieBanner />
    </>
  );
}

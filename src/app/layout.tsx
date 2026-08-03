import type { Metadata, Viewport } from "next";
import { headers, cookies } from "next/headers";
import Script from "next/script";
import { SiteShell } from "@/components/layout/site-shell";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { SearchIndexProvider } from "@/components/providers/search-index-provider";
import { SiteJsonLd } from "@/components/seo/json-ld";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { TawkChat } from "@/components/analytics/tawk-to-chat";
import { AuthRecaptchaBootstrap } from "@/components/security/auth-recaptcha-bootstrap";
import { siteConfig } from "@/lib/data/site";
import { fontVariablesClassName } from "@/lib/fonts";
import { getSiteOrigin } from "@/lib/urls";
import { buildSiteSearchIndexFromEngine, getSiteSearchIndex } from "@/lib/search";
import { isAuthSurfacePath } from "@/lib/routing/auth-surfaces";
import {
  seoDescription,
  seoKeywords,
  seoSiteName,
  seoThemeColor,
  seoTitleDefault,
} from "@/lib/seo";
import { LOCALE_STORAGE } from "@/i18n";
import { normalizeCurrency } from "@/lib/currency/config";
import { fallbackTable } from "@/lib/currency/exchange";
import "./globals.css";

async function resolveLocale() {
  const [h, c] = await Promise.all([headers(), cookies()]);
  const currency = normalizeCurrency(
    h.get("x-wt-currency") || c.get(LOCALE_STORAGE.currencyCookie)?.value || "USD"
  );
  const country =
    h.get("x-wt-country") || c.get(LOCALE_STORAGE.countryCookie)?.value || null;
  return { currency, country };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: seoThemeColor },
    { media: "(prefers-color-scheme: dark)", color: "#09215b" },
  ],
  colorScheme: "light",
};

export async function generateMetadata(): Promise<Metadata> {
  const origin = getSiteOrigin();
  return {
    metadataBase: new URL(origin),
    title: {
      default: seoTitleDefault,
      template: `%s | ${seoSiteName}`,
    },
    description: seoDescription,
    applicationName: seoSiteName,
    keywords: [...seoKeywords],
    authors: [{ name: siteConfig.companyName, url: siteConfig.companyUrl }],
    creator: siteConfig.companyName,
    publisher: siteConfig.companyName,
    category: "Business Software",
    classification: "Enterprise Resource Planning (ERP)",
    referrer: "origin-when-cross-origin",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
        { url: "/favicon-waamto-v2-32.webp", type: "image/webp", sizes: "32x32" },
        { url: "/favicon-waamto-v2-48.webp", type: "image/webp", sizes: "48x48" },
        { url: "/icon-512.webp", type: "image/webp", sizes: "512x512" },
      ],
      apple: [{ url: "/apple-touch-icon-waamto-v2.webp", type: "image/webp", sizes: "180x180" }],
      shortcut: ["/favicon.ico"],
    },
    alternates: {
      canonical: origin,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: origin,
      siteName: seoSiteName,
      title: seoTitleDefault,
      description: seoDescription,
      images: [
        {
          url: "/og/waamto-share.webp",
          width: 1200,
          height: 630,
          alt: seoTitleDefault,
          type: "image/webp",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitleDefault,
      description: seoDescription,
      creator: "@waamto",
      site: "@waamto",
      images: [
        {
          url: "/og/waamto-share.webp",
          width: 1200,
          height: 630,
          alt: seoTitleDefault,
        },
      ],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    other: {
      "geo.region": "AE-DU",
      "geo.placename": "Dubai",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { currency, country } = await resolveLocale();
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_GOOGLE_CAPTCHA_SITE_KEY?.trim() || "";
  // Don't block HTML on live exchange rates — client refreshes via /api/exchange-rates.
  const table = fallbackTable();
  const headerStore = await headers();
  const pathname = headerStore.get("x-wt-pathname") || "";
  const isAuthSurface = isAuthSurfacePath(pathname);
  // Avoid competing License Engine calls on auth pages (login/signup must stay fast).
  // Marketing: serve warm Engine index when already cached; otherwise seed products
  // immediately (no Promise.race) and warm Engine in the background. Client provider
  // completes industries/categories via existing commercial BFF routes.
  if (!isAuthSurface) {
    void buildSiteSearchIndexFromEngine();
  }
  const searchIndex = getSiteSearchIndex();

  return (
    <html lang="en" dir="ltr" className={`${fontVariablesClassName} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <Script id="waamto-recaptcha-site-key" strategy="beforeInteractive">
          {`window.__WAAMTO_RECAPTCHA_SITE_KEY__ = ${JSON.stringify(recaptchaSiteKey)};`}
        </Script>
        <AuthRecaptchaBootstrap enabled={isAuthSurface} siteKey={recaptchaSiteKey} />
        <LocaleProvider
          initialCurrency={currency}
          initialCountry={country}
          initialRates={table.rates}
        >
          <SearchIndexProvider index={searchIndex}>
            <SiteJsonLd />
            <GoogleAnalytics />
            <TawkChat />
            <SiteShell>{children}</SiteShell>
          </SearchIndexProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}

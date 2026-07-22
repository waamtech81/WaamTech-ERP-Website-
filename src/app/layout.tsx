import type { Metadata, Viewport } from "next";
import { headers, cookies } from "next/headers";
import { SiteShell } from "@/components/layout/site-shell";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { SiteJsonLd } from "@/components/seo/json-ld";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { siteConfig } from "@/lib/data/site";
import { fontVariablesClassName } from "@/lib/fonts";
import { getSiteOrigin } from "@/lib/urls";
import {
  seoDescription,
  seoKeywords,
  seoSiteName,
  seoThemeColor,
  seoTitleDefault,
} from "@/lib/seo";
import {
  directionForLanguage,
  normalizeLanguage,
  LOCALE_CODE_BY_LANG,
  LOCALE_STORAGE,
} from "@/i18n";
import { normalizeCurrency } from "@/lib/currency/config";
import { fallbackTable } from "@/lib/currency/exchange";
import "./globals.css";

async function resolveLocale() {
  const [h, c] = await Promise.all([headers(), cookies()]);
  const language = normalizeLanguage(
    h.get("x-wt-lang") || c.get(LOCALE_STORAGE.langCookie)?.value || "en"
  );
  const currency = normalizeCurrency(
    h.get("x-wt-currency") || c.get(LOCALE_STORAGE.currencyCookie)?.value || "USD"
  );
  const country =
    h.get("x-wt-country") || c.get(LOCALE_STORAGE.countryCookie)?.value || null;
  return { language, currency, country, direction: directionForLanguage(language) };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: seoThemeColor },
    { media: "(prefers-color-scheme: dark)", color: "#09215b" },
  ],
  colorScheme: "light",
};

export async function generateMetadata(): Promise<Metadata> {
  const { language } = await resolveLocale();
  const ogLocale = (LOCALE_CODE_BY_LANG[language] || "en-US").replace("-", "_");
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
        { url: "/favicon-waamto-v2-32.webp", type: "image/webp", sizes: "32x32" },
        { url: "/favicon-waamto-v2-48.webp", type: "image/webp", sizes: "48x48" },
        { url: "/icon-512.webp", type: "image/webp", sizes: "512x512" },
      ],
      apple: [{ url: "/apple-touch-icon-waamto-v2.webp", type: "image/webp", sizes: "180x180" }],
      shortcut: ["/favicon-waamto-v2-32.webp"],
    },
    alternates: {
      canonical: origin,
      languages: {
        "x-default": origin,
        en: `${origin}?lang=en`,
        ar: `${origin}?lang=ar`,
        fr: `${origin}?lang=fr`,
      },
    },
    openGraph: {
      type: "website",
      locale: ogLocale,
      url: origin,
      siteName: seoSiteName,
      title: seoTitleDefault,
      description: seoDescription,
      images: [
        {
          url: "/og/waamto-share.png",
          width: 1200,
          height: 630,
          alt: seoTitleDefault,
          type: "image/png",
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
          url: "/og/waamto-share.png",
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
  const { language, currency, country, direction } = await resolveLocale();
  // Don't block HTML on live exchange rates — client refreshes via /api/exchange-rates.
  const table = fallbackTable();

  return (
    <html
      lang="en"
      dir={direction}
      data-locale={language}
      data-dir={direction}
      className={`${fontVariablesClassName} h-full antialiased`}
    >
      <body
        dir={direction}
        className="min-h-full flex flex-col bg-background text-foreground font-sans"
      >
        <LocaleProvider
          initialLanguage={language}
          initialCurrency={currency}
          initialCountry={country}
          initialRates={table.rates}
        >
          <SiteJsonLd />
          <GoogleAnalytics />
          <SiteShell language={language}>{children}</SiteShell>
        </LocaleProvider>
      </body>
    </html>
  );
}

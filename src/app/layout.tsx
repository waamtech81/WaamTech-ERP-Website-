import type { Metadata } from "next";
import { headers, cookies } from "next/headers";
import { SiteShell } from "@/components/layout/site-shell";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { SiteJsonLd } from "@/components/seo/json-ld";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { siteConfig } from "@/lib/data/site";
import { fontVariablesClassName } from "@/lib/fonts";
import { getSiteOrigin } from "@/lib/urls";
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

export async function generateMetadata(): Promise<Metadata> {
  const { language } = await resolveLocale();
  const ogLocale = (LOCALE_CODE_BY_LANG[language] || "en-US").replace("-", "_");
  const origin = getSiteOrigin();
  return {
    metadataBase: new URL(origin),
    title: {
      default: `${siteConfig.name} | ${siteConfig.productLine}`,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    keywords: [
      "ERP",
      "enterprise software",
      "inventory management",
      "POS",
      "CRM",
      "WAAMTO",
      "WaamTech",
      "business software",
    ],
    authors: [{ name: siteConfig.companyName }],
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "32x32" },
        { url: "/favicon.png", type: "image/png", sizes: "32x32" },
        { url: "/favicon-48.webp", type: "image/webp", sizes: "48x48" },
        { url: siteConfig.logo, type: "image/webp", sizes: "512x204" },
      ],
      apple: [{ url: "/apple-touch-icon.webp", type: "image/webp", sizes: "180x180" }],
      shortcut: ["/favicon.ico"],
    },
    alternates: {
      canonical: origin,
      languages: {
        "x-default": origin,
        en: `${origin}?lang=en`,
        ar: `${origin}?lang=ar`,
        fr: `${origin}?lang=fr`,
        es: `${origin}?lang=es`,
        de: `${origin}?lang=de`,
      },
    },
    openGraph: {
      type: "website",
      locale: ogLocale,
      url: origin,
      siteName: siteConfig.name,
      title: `${siteConfig.name} | ${siteConfig.productLine}`,
      description: siteConfig.description,
      images: [
        {
          url: siteConfig.logo,
          width: 512,
          height: 204,
          alt: siteConfig.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${siteConfig.name} | ${siteConfig.productLine}`,
      description: siteConfig.description,
      images: [siteConfig.logo],
    },
    robots: {
      index: true,
      follow: true,
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
      lang={language}
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

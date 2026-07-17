import type { Metadata } from "next";
import { headers, cookies } from "next/headers";
import { Poppins } from "next/font/google";
import { SiteShell } from "@/components/layout/site-shell";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { siteConfig } from "@/lib/data/site";
import {
  directionForLanguage,
  normalizeLanguage,
  LOCALE_CODE_BY_LANG,
  LOCALE_STORAGE,
} from "@/i18n";
import { normalizeCurrency } from "@/lib/currency/config";
import { fallbackTable } from "@/lib/currency/exchange";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

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
  return {
    metadataBase: new URL(siteConfig.url),
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
      canonical: siteConfig.url,
      languages: {
        "x-default": siteConfig.url,
        en: `${siteConfig.url}?lang=en`,
        ar: `${siteConfig.url}?lang=ar`,
        fr: `${siteConfig.url}?lang=fr`,
        es: `${siteConfig.url}?lang=es`,
        de: `${siteConfig.url}?lang=de`,
      },
    },
    openGraph: {
      type: "website",
      locale: ogLocale,
      url: siteConfig.url,
      siteName: siteConfig.name,
      title: `${siteConfig.name} | ${siteConfig.productLine}`,
      description: siteConfig.description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${siteConfig.name} | ${siteConfig.productLine}`,
      description: siteConfig.description,
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
      className={`${poppins.variable} h-full antialiased`}
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
          <SiteShell language={language}>{children}</SiteShell>
        </LocaleProvider>
      </body>
    </html>
  );
}

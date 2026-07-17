import { siteConfig } from "@/lib/data/site";

type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Organization + WebSite schema for the marketing site root. */
export function SiteJsonLd() {
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.companyName,
    legalName: siteConfig.companyName,
    url: siteConfig.companyUrl,
    logo: `${siteConfig.url}${siteConfig.logo}`,
    email: siteConfig.email,
    telephone: siteConfig.phone,
    sameAs: Object.values(siteConfig.social).filter(Boolean),
    brand: {
      "@type": "Brand",
      name: siteConfig.name,
    },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    publisher: {
      "@type": "Organization",
      name: siteConfig.companyName,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/knowledge-base?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: siteConfig.url,
    description: siteConfig.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free trial available",
      url: `${siteConfig.url}/signup`,
    },
    provider: {
      "@type": "Organization",
      name: siteConfig.companyName,
      url: siteConfig.companyUrl,
    },
  };

  return (
    <>
      <JsonLd data={org} />
      <JsonLd data={website} />
      <JsonLd data={software} />
    </>
  );
}

export function breadcrumbJsonLd(
  items: { name: string; path?: string }[]
): Record<string, unknown> {
  const list = [
    { name: "Home", path: "/" },
    ...items,
  ];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: list.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path
        ? { item: item.path.startsWith("http") ? item.path : `${siteConfig.url}${item.path}` }
        : {}),
    })),
  };
}

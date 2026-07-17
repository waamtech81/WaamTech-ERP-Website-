import type { ServerOffering } from "@/types";

export const serverHero = {
  eyebrow: "Infrastructure & Hosting",
  title: "Servers, cloud hosting & deployment",
  description:
    "From managed cloud hosting to dedicated ERP deployment — WaamTech and WaamHost deliver the infrastructure your business runs on.",
  image:
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fm=webp&fit=crop&w=2000&q=70",
};

export const serverOfferings: ServerOffering[] = [
  {
    id: "cloud-hosting",
    name: "WaamHost Cloud",
    tagline: "3× faster managed cloud hosting",
    description:
      "Premium SSD cloud hosting with LiteSpeed, free SSL, daily backups, and 24/7 support — trusted by 100+ domains worldwide.",
    icon: "Cloud",
    image:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fm=webp&fit=crop&w=1600&q=70",
    priceFrom: 5.99,
    originalPrice: 6.99,
    features: [
      "LiteSpeed + Cloudflare CDN",
      "Free SSL & 30-day backups",
      "cPanel + Softaculous installer",
      "Malware scan & removal",
      "7-day money-back guarantee",
    ],
    href: "https://waamhost.com",
    external: true,
  },
  {
    id: "erp-cloud",
    name: "WaamTech ERP Cloud",
    tagline: "Fully managed SaaS deployment",
    description:
      "Run WaamTech ERP on our secure multi-tenant cloud — automatic updates, backups, and 14-day free trial included.",
    icon: "Boxes",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fm=webp&fit=crop&w=1600&q=70",
    priceFrom: 9,
    originalPrice: 19,
    features: [
      "14-day free trial",
      "30+ business profiles",
      "All ERP modules included",
      "WhatsApp & API integrations",
      "Priority support on Growth+",
    ],
    href: "/pricing",
  },
  {
    id: "own-cloud",
    name: "Own Cloud Server",
    tagline: "Dedicated cloud for your ERP",
    description:
      "Deploy WaamTech on your own cloud instance — AWS, Azure, DigitalOcean, or WaamHost VPS with full data control.",
    icon: "Server",
    image:
      "https://images.unsplash.com/photo-1544197150-b99a580bb7a0?auto=format&fm=webp&fit=crop&w=1600&q=70",
    priceFrom: 0,
    features: [
      "Dedicated server resources",
      "Your domain & branding",
      "Custom backup schedule",
      "Managed or self-managed",
      "SLA options available",
    ],
    href: "/contact?intent=own-cloud",
  },
  {
    id: "local-server",
    name: "Local / On-Premise",
    tagline: "Run ERP on your local network",
    description:
      "Need ERP on a local server without internet dependency? We install, configure, and support on-premise deployments.",
    icon: "HardDrive",
    image:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fm=webp&fit=crop&w=1600&q=70",
    priceFrom: 0,
    features: [
      "No internet required for daily ops",
      "Local network access",
      "Full data sovereignty",
      "On-site installation support",
      "Annual maintenance plans",
    ],
    href: "/contact?intent=local-server",
  },
  {
    id: "whitelabel",
    name: "Whitelabel ERP",
    tagline: "Your brand, our platform",
    description:
      "Resell or deploy WaamTech under your own brand — custom domain, logo, colors, and client-facing portal.",
    icon: "Sparkles",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fm=webp&fit=crop&w=1600&q=70",
    priceFrom: 0,
    features: [
      "Custom branding & domain",
      "Partner revenue share",
      "Multi-tenant management",
      "Sales & onboarding kits",
      "Dedicated partner manager",
    ],
    href: "/contact?intent=whitelabel",
  },
  {
    id: "domain-hosting",
    name: "Domain & Web Services",
    tagline: "Complete internet solutions since 2010",
    description:
      "Domain registration, responsive web design, CMS, mobile apps, SEO, and ongoing support from the WaamTech team.",
    icon: "Globe",
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fm=webp&fit=crop&w=1600&q=70",
    priceFrom: 14.99,
    features: [
      "Domain registration (.com from $14.99)",
      "Web design & development",
      "CMS & mobile apps",
      "SEO & digital marketing",
      "24×7 support",
    ],
    href: "https://waamtech.com/our-services/",
    external: true,
  },
];

export const waamHostPlans = [
  {
    name: "StartUp Cloud",
    price: 5.99,
    original: 6.99,
    storage: "1 GB SSD",
    bandwidth: "10 GB",
    emails: "5 Emails",
  },
  {
    name: "Business Cloud",
    price: 7.99,
    original: 8.99,
    storage: "10 GB SSD",
    bandwidth: "50 GB",
    emails: "50 Emails",
    popular: true,
  },
  {
    name: "Enterprise Cloud",
    price: 11.99,
    original: 13.99,
    storage: "20 GB SSD",
    bandwidth: "100 GB",
    emails: "Unlimited Emails",
  },
];

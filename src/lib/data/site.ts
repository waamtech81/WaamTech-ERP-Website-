import type {
  CaseStudy,
  DeploymentOption,
  FaqItem,
  Industry,
  NavItem,
  PricingPlan,
  Product,
  Testimonial,
} from "@/types";

export const siteConfig = {
  name: "WAAMTO",
  fullName: "WAAMTO",
  companyName: "WaamTech",
  companyUrl: "https://waamtech.com",
  productLine: "Enterprise ERP Platform",
  tagline: "Enterprise ERP Platform by WaamTech",
  description:
    "Run your entire business from one secure cloud platform. Finance, CRM, HR, Inventory, POS, Manufacturing, Payroll, Procurement, Projects and much more—all in one modern ERP solution.",
  url: "https://waamto.com",
  appUrl: "https://app.waamto.com",
  licensePortalUrl: "https://license.waamto.com",
  email: "hello@waamto.com",
  supportEmail: "support@waamto.com",
  phone: "+971 563344886",
  address: "DXB, UAE. ISB, PK",
  logo: "/waamto-logo.webp",
  social: {
    linkedin: "https://linkedin.com/company/waamto",
    twitter: "https://twitter.com/waamto",
    youtube: "https://youtube.com/@waamto",
    github: "https://github.com/waamtech81",
  },
};

export const mainNav: NavItem[] = [
  { title: "Products", href: "/products" },
  { title: "Industries", href: "/industries" },
  { title: "Pricing", href: "/pricing" },
];

/** Secondary links grouped under the header “Other” mega menu */
export const otherMegaMenu: {
  category: string;
  items: NavItem[];
}[] = [
  {
    category: "Platform",
    items: [
      {
        title: "ERP Features",
        href: "/erp-features",
        description: "Deep capabilities across every department.",
        icon: "Sparkles",
      },
      {
        title: "Mobile App",
        href: "/mobile-app",
        description: "Responsive web + native field app.",
        icon: "Smartphone",
      },
      {
        title: "Servers & Hosting",
        href: "/servers",
        description: "Cloud hosting, own server & local deployment.",
        icon: "Server",
      },
    ],
  },
  {
    category: "Resources",
    items: [
      { title: "Knowledge Base", href: "https://doc.waamto.com", description: "WAAMTO product documentation and guides.", icon: "Layers" },
      { title: "Support Center", href: "/support", description: "Email, live chat & portal tickets.", icon: "ShieldCheck" },
      { title: "FAQs", href: "/faqs", description: "Quick answers to common questions.", icon: "Sparkles" },
    ],
  },
  {
    category: "Company",
    items: [
      { title: "About WaamTech", href: "/about", description: "Our story since 2012 — mission, vision & team.", icon: "Building2" },
      { title: "Blog", href: "/blog", description: "Product updates, guides & industry insights.", icon: "FileText" },
      { title: "Contact", href: "/contact", description: "Sales, support & partnership inquiries.", icon: "MessageCircle" },
    ],
  },
];

export const companyMenu: NavItem[] = otherMegaMenu.find((c) => c.category === "Company")!.items;
export const resourcesMenu: NavItem[] = otherMegaMenu.find((c) => c.category === "Resources")!.items;

export const productMegaMenu: {
  category: string;
  items: NavItem[];
}[] = [
  {
    category: "Intelligence",
    items: [
      { title: "AI Workspace", href: "/products#ai", description: "Assistant, Document AI, insights & recommendations.", icon: "Bot" },
      { title: "All Modules", href: "/products", description: "Explore the full WAAMTO module suite.", icon: "Boxes" },
      { title: "ERP Features", href: "/erp-features", description: "Deep capabilities across every department.", icon: "Sparkles" },
      { title: "Mobile App", href: "/mobile-app", description: "Responsive web + native field app.", icon: "Smartphone" },
    ],
  },
  {
    category: "Management",
    items: [
      { title: "CRM", href: "/products#crm", description: "Pipeline, loyalty & customer 360.", icon: "Users" },
      { title: "Finance", href: "/products#finance", description: "GL, banks, budgets & period close.", icon: "Wallet" },
      { title: "HR & Payroll", href: "/products#hr", description: "Attendance, leave, payroll & ESS.", icon: "UserCog" },
      { title: "Manufacturing", href: "/products#manufacturing", description: "BOM, MRP, work orders & shop floor.", icon: "Factory" },
    ],
  },
  {
    category: "Operations",
    items: [
      { title: "Inventory", href: "/products#inventory", description: "Multi-warehouse stock, batches, serials & reorders.", icon: "Package" },
      { title: "POS", href: "/products#pos", description: "Fast checkout with offline mode & shifts.", icon: "ShoppingCart" },
      { title: "Purchasing", href: "/products#wms", description: "POs, GRN, 3-way match & vendor scores.", icon: "ShoppingBag" },
      { title: "Sales", href: "/products#sales", description: "Quotes, orders, deliveries & invoicing.", icon: "TrendingUp" },
    ],
  },
];

export const products: Product[] = [
  {
    id: "inventory",
    name: "Inventory",
    slug: "inventory",
    tagline: "Know every unit, warehouse, and movement",
    description:
      "Product catalog, variants, warehouses, transfers, batches, serials, valuations, and reorder alerts — real-time stock you can trust.",
    category: "Operations",
    icon: "Package",
    features: ["Multi-warehouse", "Batch & serial", "Stock ledger", "Reorder alerts"],
    status: "available",
  },
  {
    id: "pos",
    name: "POS",
    slug: "pos",
    tagline: "Checkout built for speed and reliability",
    description:
      "Fast terminals with holds, returns, promotions, loyalty, gift cards, shifts, offline sync, and WhatsApp/email receipts.",
    category: "Operations",
    icon: "ShoppingCart",
    features: ["Offline mode", "Multi-till", "Loyalty", "Shift close"],
    status: "available",
  },
  {
    id: "sales",
    name: "Sales",
    slug: "sales",
    tagline: "Quote to cash without friction",
    description:
      "Quotations, sales orders, delivery notes, invoices, returns, customer payments, price lists, and commissions.",
    category: "Operations",
    icon: "TrendingUp",
    features: ["Quotations", "Invoices", "Deliveries", "AR payments"],
    status: "available",
  },
  {
    id: "wms",
    name: "Purchasing",
    slug: "wms",
    tagline: "Procure smarter with supplier clarity",
    description:
      "Vendors, purchase requests, RFQs, POs, GRN, purchase invoices, 3-way match, landed costs, and vendor performance.",
    category: "Operations",
    icon: "ShoppingBag",
    features: ["POs & GRN", "3-way match", "Landed cost", "Vendor score"],
    status: "available",
  },
  {
    id: "finance",
    name: "Finance",
    slug: "finance",
    tagline: "Books, cash, and control in one ledger",
    description:
      "Chart of accounts, journals, GL, cash book, banks, reconciliation, budgets, tax, multi-currency, and period close.",
    category: "Management",
    icon: "Wallet",
    features: ["General ledger", "Bank recon", "Budgets", "P&L"],
    status: "available",
  },
  {
    id: "crm",
    name: "CRM",
    slug: "crm",
    tagline: "Customers, pipeline, and loyalty together",
    description:
      "Leads, accounts, contacts, opportunities, activities, campaigns, territories, loyalty, gift cards, and customer 360.",
    category: "Management",
    icon: "Users",
    features: ["Pipeline", "Loyalty", "Campaigns", "Customer 360"],
    status: "available",
  },
  {
    id: "hr",
    name: "HR & Payroll",
    slug: "hr",
    tagline: "People operations without the chaos",
    description:
      "Employees, attendance, leave, payroll, shifts, overtime, recruitment, performance, claims, and self-service portals.",
    category: "Management",
    icon: "UserCog",
    features: ["Attendance", "Payroll", "Leave", "ESS portal"],
    status: "available",
  },
  {
    id: "manufacturing",
    name: "Manufacturing",
    slug: "manufacturing",
    tagline: "Plan production with inventory confidence",
    description:
      "BOMs, routings, work orders, MRP, shop floor, capacity, scrap/rework, WIP costing, and quality checks.",
    category: "Management",
    icon: "Factory",
    features: ["BOM", "Work orders", "MRP", "Shop floor"],
    status: "available",
  },
  {
    id: "ai",
    name: "AI Workspace",
    slug: "ai",
    tagline: "Ask, extract, and act — privately on your data",
    description:
      "Built-in AI Assistant, Document AI with OCR, smart recommendations, analytics insights, and module-aware suggestions — runs locally on your stack, no cloud AI keys required.",
    category: "Intelligence",
    icon: "Bot",
    features: ["AI Assistant", "Document OCR", "Reorder & sales tips", "Private / local AI"],
    status: "available",
  },
];

export const industries: Industry[] = [
  { id: "retail", name: "Retail", slug: "retail", description: "Unify stores, stock, and customer experience.", icon: "Store", benefits: ["Omnichannel POS", "Promotions", "Loyalty"] },
  { id: "wholesale", name: "Wholesale", slug: "wholesale", description: "Scale B2B ordering and distribution.", icon: "Truck", benefits: ["Bulk pricing", "Credit control", "Route delivery"] },
  { id: "manufacturing", name: "Manufacturing", slug: "manufacturing", description: "Plan production with inventory confidence.", icon: "Factory", benefits: ["BOM", "Work orders", "Costing"] },
  { id: "healthcare", name: "Healthcare", slug: "healthcare", description: "Operational systems for care providers.", icon: "HeartPulse", benefits: ["Inventory control", "Billing", "Compliance"] },
  { id: "pharmacy", name: "Pharmacy", slug: "pharmacy", description: "Specialized pharmacy and drug retail ops.", icon: "Pill", benefits: ["Expiry control", "Rx", "Regulatory"] },
  { id: "warehouse", name: "Warehouse", slug: "warehouse", description: "High-velocity warehouse operations.", icon: "Warehouse", benefits: ["Scanning", "SLAs", "Throughput"] },
  { id: "construction", name: "Construction", slug: "construction", description: "Projects, materials, and job costing.", icon: "HardHat", benefits: ["Job costing", "Procurement", "Assets"] },
  { id: "real-estate", name: "Real Estate", slug: "real-estate", description: "Property portfolios and tenant ops.", icon: "Building", benefits: ["Leases", "Maintenance", "Collections"] },
  { id: "education", name: "Education", slug: "education", description: "Campus and institution administration.", icon: "GraduationCap", benefits: ["Fee management", "Inventory", "HR"] },
  { id: "restaurant", name: "Restaurant", slug: "restaurant", description: "Kitchen, inventory, and outlet control.", icon: "UtensilsCrossed", benefits: ["Recipes", "Waste", "Multi-outlet"] },
  { id: "distribution", name: "Distribution", slug: "distribution", description: "End-to-end distribution networks.", icon: "Network", benefits: ["Routes", "Van sales", "Returns"] },
  { id: "automotive", name: "Automotive", slug: "automotive", description: "Parts, service, and dealership ops.", icon: "Car", benefits: ["Parts catalog", "Service", "Warranty"] },
  { id: "electronics", name: "Electronics", slug: "electronics", description: "Serial-tracked electronics retail & wholesale.", icon: "Cpu", benefits: ["Serials", "Warranty", "Channels"] },
  { id: "fashion", name: "Fashion", slug: "fashion", description: "Variant-rich apparel and footwear.", icon: "Shirt", benefits: ["Variants", "Seasons", "Transfers"] },
  { id: "furniture", name: "Furniture", slug: "furniture", description: "Made-to-order and showroom operations.", icon: "Armchair", benefits: ["Custom orders", "Showrooms", "Delivery"] },
];

export const pricingPlans: PricingPlan[] = [];

/** @deprecated Comparison matrix is built dynamically from License Engine plans. */
export const comparisonFeatures: Array<Record<string, string | boolean>> = [];

export const deploymentOptions: DeploymentOption[] = [
  {
    id: "cloud-saas",
    title: "Cloud SaaS",
    description: "Fully managed WaamTech cloud — start in minutes with automatic updates and backups.",
    icon: "Cloud",
    highlights: ["14-day free trial", "No setup fees", "Auto updates"],
    cta: "Start free trial",
    href: "/signup",
    featured: true,
  },
  {
    id: "own-cloud",
    title: "Own Cloud Server",
    description: "Deploy on your dedicated cloud instance with full control over data and resources.",
    icon: "Server",
    highlights: ["AWS, Azure, DO, WaamHost", "Your domain", "Custom SLA"],
    cta: "Contact for deployment",
    href: "/contact?intent=own-cloud",
  },
  {
    id: "whitelabel",
    title: "Whitelabel",
    description: "Resell WaamTech under your brand — custom portal, logo, and client management.",
    icon: "Sparkles",
    highlights: ["Your branding", "Partner program", "Multi-tenant"],
    cta: "Become a partner",
    href: "/contact?intent=whitelabel",
  },
  {
    id: "local-server",
    title: "Local / On-Premise",
    description: "Run ERP on your local network — ideal when internet access is limited or data must stay on-site.",
    icon: "HardDrive",
    highlights: ["No internet needed", "Local network", "On-site install"],
    cta: "Contact for local setup",
    href: "/contact?intent=local-server",
  },
];

export const pricingLaunchBanner = {
  title: "50% Launch Discount",
  description:
    "Limited-time launch pricing — aligned with Pakistan market rates (Finivo, Tredus, Splendid from PKR 2,000–5,500/mo). Lock in your rate today.",
};

export const testimonials: Testimonial[] = [
  {
    id: "1",
    quote:
      "WAAMTO brought our parts inventory, purchasing, and sales into one system. Stock levels across Dubai warehouses are finally accurate, and our team closes purchase cycles much faster.",
    name: "Oussama Nouni",
    role: "Director",
    company: "Tamshiiparts, Dubai",
    rating: 5,
  },
  {
    id: "2",
    quote:
      "We needed a serious ERP for manufacturing in Germany — WAAMTO delivered clear workflows from production to finance. Month-end reporting went from days of chasing spreadsheets to a single dashboard.",
    name: "Mr. Yameen",
    role: "CEO",
    company: "Hükland, Germany",
    rating: 5,
  },
  {
    id: "3",
    quote:
      "From Australia we run multi-site operations on WAAMTO. POS, warehouse, and CRM stay in sync, and onboarding new staff took days instead of weeks because everything is intuitive.",
    name: "Naddem Ashraf",
    role: "CEO",
    company: "WesterWolf, Australia",
    rating: 4.5,
  },
];

export const caseStudies: CaseStudy[] = [
  {
    id: "1",
    title: "National retailer unified 48 stores",
    industry: "Retail",
    result: "Stockouts reduced",
    metric: "37%",
    description: "Centralized inventory, POS, and promotions across regional stores with live stock visibility.",
  },
  {
    id: "2",
    title: "Distributor cut order cycle time",
    industry: "Wholesale",
    result: "Faster fulfillment",
    metric: "2.4×",
    description: "Warehouse scanning and route planning streamlined B2B order-to-delivery operations.",
  },
  {
    id: "3",
    title: "Pharmacy network improved compliance",
    industry: "Healthcare",
    result: "Audit readiness",
    metric: "100%",
    description: "Expiry controls, batch tracking, and pharmacy workflows strengthened regulatory confidence.",
  },
];

export { blogPosts } from "@/lib/data/blog-posts";

export const faqs: FaqItem[] = [
  {
    id: "1",
    question: "What modules are included in WAAMTO?",
    answer:
      "WAAMTO includes Inventory, POS, Sales, Purchasing, Finance, CRM, HR & Payroll, Manufacturing, Warehouse & Logistics, Documents, Service, Projects, and industry packs (Restaurant, Pharmacy, Automotive, and more). Your plan controls how many users and which modules unlock — see Pricing for the full matrix.",
    category: "Product",
  },
  {
    id: "2",
    question: "Can I switch plans later?",
    answer:
      "Yes. You can upgrade or downgrade at any time. Changes are prorated and reflected on your next billing cycle through the customer portal.",
    category: "Billing",
  },
  {
    id: "3",
    question: "Is there a free trial?",
    answer:
      "Yes. New workspaces start with a 14-day free trial. Pick your business profile at signup — no credit card required to begin.",
    category: "Billing",
  },
  {
    id: "4",
    question: "How many users are included in each plan?",
    answer:
      "Starter includes 1 user. Business includes 10 users, and Lifetime includes 25 users. Extra seats are available on demand for Business and Lifetime. Enterprise has unlimited users.",
    category: "Billing",
  },
  {
    id: "5",
    question: "What AI features does WAAMTO include?",
    answer:
      "WAAMTO includes a private AI Workspace: AI Assistant (ask questions across your modules), Document AI with OCR, smart recommendations (reorder, sales, CRM follow-ups), plus Analytics and Reports AI. Inference stays on your stack — no external AI API keys required.",
    category: "Product",
  },
  {
    id: "6",
    question: "Do you support multi-company and multi-branch setups?",
    answer:
      "Yes. Business, Lifetime, and Enterprise plans support multi-company, multi-branch, and multi-warehouse structures with role-based permissions.",
    category: "Product",
  },
  {
    id: "7",
    question: "How does support work?",
    answer:
      "All plans include email support. Higher tiers unlock priority response, WhatsApp support, dedicated success management, and optional SLAs.",
    category: "Support",
  },
  {
    id: "8",
    question: "Is WAAMTO secure and compliant?",
    answer:
      "We use industry-standard encryption, role-based access, audit trails, and enterprise security practices. AI activity is audited. Enterprise customers can request additional controls such as SSO.",
    category: "Security",
  },
  {
    id: "9",
    question: "Can we integrate with existing tools?",
    answer:
      "Yes. API access is available on Business, Lifetime, and Enterprise plans for connecting accounting tools, e-commerce, payment gateways, and custom systems.",
    category: "Integrations",
  },
  {
    id: "10",
    question: "Do you offer onboarding and training?",
    answer:
      "Yes. Guided onboarding is available on higher plans, and Enterprise includes tailored training for administrators and end users.",
    category: "Support",
  },
  {
    id: "11",
    question: "How can the AI Assistant help my team use WAAMTO?",
    answer:
      "The built-in AI Assistant helps users ask how-to questions in plain language, understand module workflows, and find the right next screen across areas such as Inventory, Sales, Finance, and CRM.",
    category: "Product",
  },
  {
    id: "12",
    question: "Where can I find complete WAAMTO ERP documentation?",
    answer:
      "Complete WAAMTO ERP documentation is available at https://doc.waamto.com, with guides to help users learn modules, workflows, configuration, and day-to-day operations.",
    category: "Support",
  },
  {
    id: "13",
    question: "Is WAAMTO video training available?",
    answer:
      "Yes. Visit the WAAMTO YouTube channel at https://youtube.com/@waamto for product walkthroughs and training videos.",
    category: "Support",
  },
];

export const erpFeatureGroups = [
  {
    id: "operations",
    title: "Operations",
    description: "Run day-to-day business processes with clarity.",
    icon: "Cog",
    features: ["Work orders", "Task workflows", "Branch operations", "Document control"],
  },
  {
    id: "finance",
    title: "Finance",
    description: "Keep books accurate and leadership informed.",
    icon: "Landmark",
    features: ["General ledger", "AR & AP", "Tax-ready reports", "Bank reconciliation"],
  },
  {
    id: "sales",
    title: "Sales",
    description: "Quote, fulfill, and invoice without friction.",
    icon: "TrendingUp",
    features: ["Quotations", "Orders", "Pricing rules", "Customer history"],
  },
  {
    id: "inventory",
    title: "Inventory",
    description: "Know exactly what you have and where it is.",
    icon: "Package",
    features: ["Stock levels", "Transfers", "Adjustments", "Valuation"],
  },
  {
    id: "purchase",
    title: "Purchase",
    description: "Procure smarter with supplier visibility.",
    icon: "ShoppingBag",
    features: ["Purchase requests", "POs", "Goods receipt", "Vendor scorecards"],
  },
  {
    id: "hr",
    title: "HR",
    description: "Organize people data and daily workforce ops.",
    icon: "UserCog",
    features: ["Employee profiles", "Attendance", "Leave", "Departments"],
  },
  {
    id: "crm",
    title: "CRM",
    description: "Grow relationships with a complete customer view.",
    icon: "Handshake",
    features: ["Leads", "Opportunities", "Activities", "Follow-ups"],
  },
  {
    id: "ai",
    title: "AI Workspace",
    description: "Built-in intelligence that helps your team use WAAMTO every day.",
    icon: "Bot",
    features: ["AI Assistant", "Document OCR", "Smart recommendations", "Private / local AI"],
  },
  {
    id: "analytics",
    title: "Analytics",
    description: "Turn operational data into leadership insight.",
    icon: "BarChart3",
    features: ["KPI dashboards", "Trends", "Custom metrics", "Exports"],
  },
  {
    id: "reports",
    title: "Reports",
    description: "Generate the reports finance and ops rely on.",
    icon: "FileText",
    features: ["Financial statements", "Inventory reports", "Sales reports", "Scheduled delivery"],
  },
  {
    id: "automation",
    title: "Automation",
    description: "Reduce manual work with intelligent workflows.",
    icon: "Zap",
    features: ["Approvals", "Alerts", "Scheduled jobs", "Rule engines"],
  },
  {
    id: "integrations",
    title: "Integrations",
    description: "Connect WAAMTO to the systems you already use.",
    icon: "Plug",
    features: ["REST API", "Webhooks", "Payment gateways", "Messaging"],
  },
];

/** Hero stats for the ERP Features landing page */
export const erpFeatureStats = [
  { label: "ERP modules", value: "12+" },
  { label: "Industries", value: "17+" },
  { label: "Business profiles", value: "100+" },
  { label: "AI built in", value: "Yes" },
] as const;

/** How business-profile preinstall works */
export const erpPreinstallSteps = [
  {
    title: "Pick your industry & business",
    description:
      "Choose retail, pharmacy, restaurant, manufacturing, wholesale, or another profile at signup — WAAMTO knows what that business needs.",
    icon: "Store",
  },
  {
    title: "Common features come preinstalled",
    description:
      "Modules, workflows, KPIs, POS layouts, and feature packs for your business type are ready on day one — no blank workspace.",
    icon: "Layers",
  },
  {
    title: "Expand when you grow",
    description:
      "Add Finance, CRM, HR, Manufacturing, AI Workspace, mobile field app, and more without rebuilding your stack.",
    icon: "Sparkles",
  },
] as const;

/** Example business profiles with preinstalled modules */
export const erpPreinstallExamples = [
  { name: "Retail Store", modules: ["Inventory", "POS", "CRM", "Finance", "Sales"] },
  { name: "Pharmacy", modules: ["Inventory", "POS", "CRM", "Finance", "Batch & expiry"] },
  { name: "Restaurant", modules: ["POS", "Inventory", "HR", "Finance", "Kitchen flow"] },
  { name: "Manufacturing", modules: ["Inventory", "Manufacturing", "WMS", "HR", "Finance"] },
  { name: "Wholesale", modules: ["Inventory", "Sales", "CRM", "Finance", "Credit control"] },
] as const;

export const stats = [
  { label: "Businesses powered", value: 1200, suffix: "+" },
  { label: "Modules available", value: 11, suffix: "" },
  { label: "Avg. onboarding time", value: 14, suffix: " days" },
  { label: "Customer satisfaction", value: 98, suffix: "%" },
];

export const whyWaamTech = [
  {
    title: "Built-in AI that stays private",
    description:
      "Ask the Assistant, run Document OCR, and get reorder or sales tips — without sending your data to public AI clouds.",
    icon: "Bot",
  },
  {
    title: "Modular by design",
    description: "Start with what you need and expand into deeper suites without ripping out foundations.",
    icon: "Layers",
  },
  {
    title: "Operational trust",
    description: "Audit trails, permissions, and consistent data models built for serious businesses.",
    icon: "ShieldCheck",
  },
  {
    title: "Premium experience",
    description: "Thoughtful UX, performance, and polish that make daily software feel effortless.",
    icon: "Gem",
  },
];

/** AI capabilities promoted on the marketing site (aligned with SaaS AI module) */
export const aiHighlights = [
  {
    title: "AI Assistant",
    description: "Ask questions in plain language across Inventory, Sales, Finance, CRM, and more — then jump straight to the right screen.",
    icon: "MessageCircle",
  },
  {
    title: "Document AI & OCR",
    description: "Extract data from invoices, receipts, and documents, validate, approve, and apply into ERP workflows.",
    icon: "FileText",
  },
  {
    title: "Smart recommendations",
    description: "Reorder suggestions, cross-sell tips, lead follow-ups, and cash or stock alerts grounded in your live data.",
    icon: "Sparkles",
  },
  {
    title: "Private by design",
    description: "Runs on your stack with local models — no public AI API keys and no sending business data to outside clouds.",
    icon: "ShieldCheck",
  },
] as const;

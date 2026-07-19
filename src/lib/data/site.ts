import type {
  BlogPost,
  CaseStudy,
  DeploymentOption,
  DocCategory,
  FaqItem,
  Industry,
  KbArticle,
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
    "WAAMTO is a cloud Enterprise ERP by WaamTech — Inventory, POS, Sales, Purchasing, Finance, CRM, HR, Manufacturing, and AI Workspace. Run multi-branch operations across 17+ industries. Start a free trial.",
  url: "https://waamto.com",
  appUrl: "https://app.waamto.com",
  licensePortalUrl: "https://license.waamtech.com",
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
      { title: "Documentation", href: "/docs", description: "Setup guides, APIs & developer docs.", icon: "FileText" },
      { title: "Knowledge Base", href: "/knowledge-base", description: "How-to articles for every module.", icon: "Layers" },
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

export const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "How modern ERPs reduce operational blind spots",
    slug: "modern-erp-operational-visibility",
    excerpt: "A practical look at unifying inventory, finance, and sales data into one decision layer.",
    category: "ERP",
    author: "WaamTech Team",
    date: "2026-06-12",
    readTime: "6 min",
    featured: true,
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fm=webp&fit=crop&w=1200&q=70",
    content: [
      "Modern enterprises lose time and money when inventory, finance, and sales live in separate tools. Reports disagree, teams chase spreadsheets, and decisions lag behind reality.",
      "A modern ERP closes those gaps by making one shared record the source of truth. Stock movements update costing, invoices reflect real fulfillment, and managers see the same numbers on every screen.",
      "Start with the workflows operators touch daily — receiving, selling, and reconciling — then expand modules as the business grows. Clarity and data integrity matter more than feature count.",
    ],
  },
  {
    id: "2",
    title: "Designing inventory systems for multi-warehouse brands",
    slug: "multi-warehouse-inventory-design",
    excerpt: "Patterns that keep stock accurate when products move across regions and channels.",
    category: "Inventory",
    author: "Product Team",
    date: "2026-05-28",
    readTime: "5 min",
    image:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fm=webp&fit=crop&w=1200&q=70",
    content: [
      "Multi-warehouse brands fail when each location invents its own stock rules. Transfers get lost, channels oversell, and cycle counts never catch up.",
      "Design around location-aware quantities, clear transfer statuses, and reservation rules for online and POS demand. Every movement should leave an auditable trail.",
      "When warehouses share one inventory model, planners can rebalance stock before stockouts — and finance can trust landed cost across regions.",
    ],
  },
  {
    id: "3",
    title: "What enterprise buyers expect from SaaS UX",
    slug: "enterprise-saas-ux-expectations",
    excerpt: "Clarity, speed, and trust — the UX principles that separate premium software from noise.",
    category: "Product",
    author: "Design Team",
    date: "2026-05-10",
    readTime: "7 min",
    image:
      "https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fm=webp&fit=crop&w=1200&q=70",
    content: [
      "Enterprise buyers judge SaaS in the first few sessions: can people find work quickly, trust the numbers, and finish tasks without training decks?",
      "Premium UX is not decoration. It is predictable navigation, fast forms, clear status, and layouts that respect how operators actually work under pressure.",
      "Teams that ship clarity win adoption. Teams that ship clutter create shadow processes in Excel — and the product never becomes the system of record.",
    ],
  },
  {
    id: "4",
    title: "A practical guide to ERP subscription planning",
    slug: "erp-subscription-planning",
    excerpt: "How to choose the right plan as your team, locations, and modules grow.",
    category: "Pricing",
    author: "Customer Success",
    date: "2026-04-22",
    readTime: "4 min",
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fm=webp&fit=crop&w=1200&q=70",
    content: [
      "Pick a plan for how you operate today — and how you expect to grow in the next year. Overbuying modules you will not use creates noise; underbuying creates painful mid-year upgrades.",
      "Map users, branches, and must-have modules first. Then compare seat limits, multi-company support, and support tiers against that list.",
      "Treat subscription planning as an operating decision, not a one-time purchase. Review usage quarterly and adjust before the next renewal cycle.",
    ],
  },
  {
    id: "5",
    title: "POS and inventory: keeping the counter and the warehouse in sync",
    slug: "pos-inventory-sync",
    excerpt: "Why real-time stock at the till prevents overselling, shrinkage, and end-of-day surprises.",
    category: "POS",
    author: "Product Team",
    date: "2026-07-08",
    readTime: "5 min",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fm=webp&fit=crop&w=1200&q=70",
    content: [
      "When POS and inventory run on different clocks, cashiers sell what the warehouse already moved — or refuse sales that stock could cover.",
      "A unified stack reserves and depletes stock at sale time, supports returns cleanly, and keeps branch managers aligned with finance on daily totals.",
      "Retail and restaurant operators who close that loop spend less time reconciling and more time serving customers.",
    ],
  },
  {
    id: "6",
    title: "Using AI in ERP without losing control of your data",
    slug: "ai-in-erp-data-control",
    excerpt: "Practical ways to use assistants and document AI while keeping audit trails and privacy intact.",
    category: "AI",
    author: "WaamTech Team",
    date: "2026-07-02",
    readTime: "6 min",
    image:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fm=webp&fit=crop&w=1200&q=70",
    content: [
      "AI in ERP should speed up questions, document capture, and recommendations — not send sensitive business data into opaque third-party black boxes.",
      "Prefer assistants that work against your own modules, with logged activity and clear limits on what they can change.",
      "The winning pattern is simple: AI suggests, operators confirm, and every action stays auditable for finance and compliance teams.",
    ],
  },
  {
    id: "7",
    title: "Multi-branch finance: one ledger, many locations",
    slug: "multi-branch-finance",
    excerpt: "How shared accounting structures help growing brands stay audit-ready across cities.",
    category: "Finance",
    author: "Customer Success",
    date: "2026-06-24",
    readTime: "5 min",
    image:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fm=webp&fit=crop&w=1200&q=70",
    content: [
      "Growing brands often open branches faster than they fix reporting. Each site invents local spreadsheets, and group finance spends weeks closing the month.",
      "A shared chart of accounts, branch dimensions, and consistent posting rules make consolidation routine instead of heroic.",
      "When every location posts into one controlled ledger, leadership gets timely P&L — and auditors get a clear trail.",
    ],
  },
  {
    id: "8",
    title: "Onboarding teams to a new ERP without the chaos",
    slug: "erp-onboarding-without-chaos",
    excerpt: "A phased rollout approach that protects daily operations while people learn the new system.",
    category: "Operations",
    author: "WaamTech Team",
    date: "2026-06-18",
    readTime: "6 min",
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fm=webp&fit=crop&w=1200&q=70",
    content: [
      "Big-bang go-lives create fear and shadow systems. Teams need a path that keeps selling and shipping while they learn new screens.",
      "Phase by workflow: master data first, then purchasing and inventory, then sales and finance. Train champions in each branch before the wider rollout.",
      "Measure adoption with simple signals — fewer spreadsheet exports, faster order cycle times, and cleaner month-end — not just login counts.",
    ],
  },
];

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
];

export const docCategories: DocCategory[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Set up your workspace and invite your team.",
    articles: [
      { title: "Create your workspace", href: "/docs#create-workspace" },
      { title: "Invite users & roles", href: "/docs#invite-users" },
      { title: "Configure company settings", href: "/docs#company-settings" },
    ],
  },
  {
    id: "erp",
    title: "ERP Core",
    description: "Master the operational backbone of WaamTech.",
    articles: [
      { title: "Chart of accounts", href: "/docs#chart-of-accounts" },
      { title: "Sales & purchase flow", href: "/docs#sales-purchase" },
      { title: "Inventory basics", href: "/docs#inventory-basics" },
    ],
  },
  {
    id: "modules",
    title: "Modules",
    description: "Deep dives into POS, CRM, Warehouse, and more.",
    articles: [
      { title: "POS setup", href: "/docs#pos-setup" },
      { title: "CRM pipeline", href: "/docs#crm-pipeline" },
      { title: "Warehouse scanning", href: "/docs#warehouse-scanning" },
    ],
  },
  {
    id: "admin",
    title: "Administration",
    description: "Security, billing, and workspace governance.",
    articles: [
      { title: "Permissions matrix", href: "/docs#permissions" },
      { title: "Billing & licenses", href: "/docs#billing" },
      { title: "Audit logs", href: "/docs#audit-logs" },
    ],
  },
];

export const kbArticles: KbArticle[] = [
  { id: "1", title: "How to create your first invoice", category: "Finance", excerpt: "Step-by-step guide to issuing invoices and tracking payment status.", popular: true },
  { id: "2", title: "Setting up multi-warehouse stock", category: "Inventory", excerpt: "Configure locations, transfers, and safety stock thresholds.", popular: true },
  { id: "3", title: "Connecting WhatsApp notifications", category: "Integrations", excerpt: "Enable order and payment alerts for customers and staff.", popular: true },
  { id: "4", title: "Managing user roles and permissions", category: "Admin", excerpt: "Grant the right access without exposing sensitive modules." },
  { id: "5", title: "POS offline mode troubleshooting", category: "POS", excerpt: "Resolve sync issues and keep checkout running during outages." },
  { id: "6", title: "Month-end closing checklist", category: "Finance", excerpt: "A practical checklist for accurate books and reporting." },
  { id: "7", title: "Importing products via CSV", category: "Inventory", excerpt: "Bulk upload SKUs, variants, prices, and opening stock." },
  { id: "8", title: "Creating support tickets", category: "Support", excerpt: "How to escalate issues and track resolution in the portal." },
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
    description: "Connect WaamTech to the systems you already use.",
    icon: "Plug",
    features: ["REST API", "Webhooks", "Payment gateways", "Messaging"],
  },
];

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

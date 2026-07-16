import type {
  BlogPost,
  CaseStudy,
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
  name: "WaamTech",
  fullName: "WaamTech Technologies",
  tagline: "Control your business. Optimize operations. Unlock growth.",
  description:
    "WaamTech SaaS Core is a modular ERP platform for Inventory, POS, Sales, Purchasing, Finance, CRM, HR, and Manufacturing — configured for 30+ business profiles.",
  url: "https://waamtech.com",
  email: "hello@waamtech.com",
  supportEmail: "support@waamtech.com",
  phone: "+1 (800) 555-0199",
  address: "1200 Enterprise Ave, Suite 400, Austin, TX 78701",
  social: {
    linkedin: "https://linkedin.com/company/waamtech",
    twitter: "https://twitter.com/waamtech",
    youtube: "https://youtube.com/@waamtech",
    github: "https://github.com/waamtech81",
  },
};

export const mainNav: NavItem[] = [
  { title: "Products", href: "/products" },
  { title: "ERP Features", href: "/erp-features" },
  { title: "Industries", href: "/industries" },
  { title: "Pricing", href: "/pricing" },
  { title: "Resources", href: "/docs" },
  { title: "Company", href: "/about" },
];

export const productMegaMenu: {
  category: string;
  items: NavItem[];
}[] = [
  {
    category: "Core Platform",
    items: [
      { title: "WaamTech ERP", href: "/products#erp", description: "Unified operations across every department." },
      { title: "Inventory", href: "/products#inventory", description: "Real-time stock, warehouses, and transfers." },
      { title: "POS", href: "/products#pos", description: "Fast retail checkout with offline resilience." },
      { title: "CRM", href: "/products#crm", description: "Pipeline, accounts, and customer success." },
    ],
  },
  {
    category: "Business Suites",
    items: [
      { title: "Finance", href: "/products#finance", description: "Ledgers, invoicing, and cash control." },
      { title: "HR", href: "/products#hr", description: "People, payroll readiness, and attendance." },
      { title: "Property", href: "/products#property", description: "Assets, tenants, and facility ops." },
      { title: "Pharmacy", href: "/products#pharmacy", description: "Compliance-ready pharmacy workflows." },
    ],
  },
  {
    category: "Connected Tools",
    items: [
      { title: "Warehouse", href: "/products#warehouse", description: "Pick, pack, ship with precision." },
      { title: "Maps", href: "/products#maps", description: "Location intelligence for field teams." },
      { title: "WhatsApp", href: "/products#whatsapp", description: "Conversational commerce and alerts." },
      { title: "All Products", href: "/products", description: "Explore the complete WaamTech suite." },
    ],
  },
];

export const products: Product[] = [
  {
    id: "erp",
    name: "WaamTech ERP",
    slug: "erp",
    tagline: "One system of record for the entire business",
    description:
      "Orchestrate finance, inventory, sales, purchasing, HR, and analytics in a single enterprise platform designed for clarity and control.",
    category: "Core",
    icon: "Boxes",
    features: ["Multi-company", "Role-based access", "Workflow automation", "Real-time dashboards"],
    status: "available",
  },
  {
    id: "inventory",
    name: "Inventory",
    slug: "inventory",
    tagline: "Stock accuracy you can trust",
    description:
      "Track multi-warehouse inventory, batches, serials, and replenishment with live visibility across every location.",
    category: "Operations",
    icon: "Package",
    features: ["Multi-warehouse", "Batch & serial", "Reorder rules", "Stock valuation"],
    status: "available",
  },
  {
    id: "pos",
    name: "POS",
    slug: "pos",
    tagline: "Checkout built for speed",
    description:
      "Modern point of sale with offline mode, promotions, receipts, and store-level analytics.",
    category: "Retail",
    icon: "ShoppingCart",
    features: ["Offline mode", "Promotions", "Multi-store", "Receipt templates"],
    status: "available",
  },
  {
    id: "crm",
    name: "CRM",
    slug: "crm",
    tagline: "Customer relationships with context",
    description:
      "Manage leads, opportunities, accounts, and service history with a clean sales workspace.",
    category: "Growth",
    icon: "Users",
    features: ["Pipeline views", "Activity timeline", "Quotes", "Customer 360"],
    status: "available",
  },
  {
    id: "finance",
    name: "Finance",
    slug: "finance",
    tagline: "Financial clarity at every close",
    description:
      "General ledger, AR/AP, banking, and reporting designed for modern finance teams.",
    category: "Finance",
    icon: "Wallet",
    features: ["GL & journals", "AR/AP", "Bank reconciliation", "Financial reports"],
    status: "available",
  },
  {
    id: "hr",
    name: "HR",
    slug: "hr",
    tagline: "People operations, simplified",
    description:
      "Employee records, attendance, leave, and organizational structure in one place.",
    category: "People",
    icon: "UserCog",
    features: ["Employee directory", "Attendance", "Leave management", "Org chart"],
    status: "available",
  },
  {
    id: "property",
    name: "Property",
    slug: "property",
    tagline: "Property and facility control",
    description:
      "Manage properties, leases, maintenance, and tenant communications with operational precision.",
    category: "Assets",
    icon: "Building2",
    features: ["Lease tracking", "Maintenance", "Tenant portal", "Asset registry"],
    status: "available",
  },
  {
    id: "pharmacy",
    name: "Pharmacy",
    slug: "pharmacy",
    tagline: "Pharmacy workflows that stay compliant",
    description:
      "Prescription handling, controlled inventory, expiry tracking, and retail pharmacy POS.",
    category: "Healthcare",
    icon: "Pill",
    features: ["Rx workflows", "Expiry alerts", "Controlled drugs", "Insurance-ready"],
    status: "available",
  },
  {
    id: "warehouse",
    name: "Warehouse",
    slug: "warehouse",
    tagline: "Fulfillment without friction",
    description:
      "Inbound, putaway, picking, packing, and shipping with barcode-first warehouse operations.",
    category: "Logistics",
    icon: "Warehouse",
    features: ["Wave picking", "Barcode scanning", "Putaway rules", "Shipping labels"],
    status: "available",
  },
  {
    id: "maps",
    name: "Maps",
    slug: "maps",
    tagline: "Location intelligence for operations",
    description:
      "Visualize routes, territories, delivery zones, and field activity on interactive maps.",
    category: "Connected",
    icon: "Map",
    features: ["Route planning", "Geofencing", "Territory maps", "Live tracking"],
    status: "available",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    slug: "whatsapp",
    tagline: "Business messaging that converts",
    description:
      "Send order updates, invoices, campaigns, and support replies through WhatsApp Business.",
    category: "Connected",
    icon: "MessageCircle",
    features: ["Order alerts", "Templates", "Inbox", "Campaigns"],
    status: "available",
  },
  {
    id: "ai-insights",
    name: "AI Insights",
    slug: "ai-insights",
    tagline: "Predictive intelligence for leaders",
    description:
      "Demand forecasting, anomaly detection, and natural-language business queries — coming soon.",
    category: "Future",
    icon: "Sparkles",
    features: ["Forecasting", "Anomaly alerts", "NL queries", "Smart recommendations"],
    status: "coming-soon",
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

export const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "For growing teams launching digital operations.",
    monthlyPrice: 49,
    yearlyPrice: 39,
    cta: "Start free trial",
    href: "/signup?plan=starter",
    features: [
      "Up to 5 users",
      "Core ERP modules",
      "Inventory & invoicing",
      "Email support",
      "Standard reports",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    description: "For businesses that need deeper operational control.",
    monthlyPrice: 129,
    yearlyPrice: 99,
    popular: true,
    cta: "Start free trial",
    href: "/signup?plan=professional",
    features: [
      "Up to 25 users",
      "All Starter features",
      "CRM, POS & Warehouse",
      "Automation workflows",
      "Priority email support",
      "Advanced analytics",
    ],
  },
  {
    id: "business",
    name: "Business",
    description: "For multi-location organizations scaling fast.",
    monthlyPrice: 249,
    yearlyPrice: 199,
    cta: "Start free trial",
    href: "/signup?plan=business",
    features: [
      "Up to 100 users",
      "All Professional features",
      "Multi-company & multi-branch",
      "API access",
      "WhatsApp & Maps",
      "Dedicated success manager",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Custom architecture, security, and scale.",
    monthlyPrice: null,
    yearlyPrice: null,
    cta: "Contact sales",
    href: "/contact?intent=enterprise",
    features: [
      "Unlimited users",
      "Custom modules",
      "SSO & advanced security",
      "SLA & premium support",
      "Onboarding & training",
      "Dedicated infrastructure options",
    ],
  },
];

export const testimonials: Testimonial[] = [
  {
    id: "1",
    quote:
      "WaamTech replaced three disconnected systems. Our inventory accuracy and month-end close improved within the first quarter.",
    name: "Amira Hassan",
    role: "COO",
    company: "Northline Retail Group",
  },
  {
    id: "2",
    quote:
      "The interface feels premium and calm. Our teams adopted it quickly because every workflow is clear and intentional.",
    name: "Daniel Okoye",
    role: "Head of Operations",
    company: "Cedar Manufacturing",
  },
  {
    id: "3",
    quote:
      "From POS to warehouse to finance, WaamTech gave us one source of truth. That alone changed how we make decisions.",
    name: "Sofia Martinez",
    role: "CFO",
    company: "Harbor Distribution",
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
  },
];

export const faqs: FaqItem[] = [
  {
    id: "1",
    question: "What is included in WaamTech ERP?",
    answer:
      "WaamTech ERP includes core modules for operations, finance, sales, inventory, purchasing, HR, CRM, analytics, and reporting. Additional suites like POS, Warehouse, Pharmacy, Maps, and WhatsApp can be added based on your plan.",
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
      "Yes. Starter, Professional, and Business plans include a free trial so your team can evaluate workflows before committing.",
    category: "Billing",
  },
  {
    id: "4",
    question: "Do you support multi-company and multi-branch setups?",
    answer:
      "Yes. Business and Enterprise plans support multi-company, multi-branch, and multi-warehouse structures with role-based permissions.",
    category: "Product",
  },
  {
    id: "5",
    question: "How does support work?",
    answer:
      "All plans include email support. Higher tiers unlock priority response, WhatsApp support, dedicated success management, and optional SLAs.",
    category: "Support",
  },
  {
    id: "6",
    question: "Is WaamTech secure and compliant?",
    answer:
      "We use industry-standard encryption, role-based access, audit trails, and enterprise security practices. Enterprise customers can request additional controls such as SSO.",
    category: "Security",
  },
  {
    id: "7",
    question: "Can we integrate with existing tools?",
    answer:
      "Yes. API access is available on Business and Enterprise plans for connecting accounting tools, e-commerce, payment gateways, and custom systems.",
    category: "Integrations",
  },
  {
    id: "8",
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
    title: "Enterprise clarity",
    description: "Clean information architecture that helps teams find answers and act faster.",
    icon: "Sparkles",
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

export const comparisonFeatures = [
  { name: "Users included", starter: "5", professional: "25", business: "100", enterprise: "Unlimited" },
  { name: "Core ERP", starter: true, professional: true, business: true, enterprise: true },
  { name: "Inventory & Invoicing", starter: true, professional: true, business: true, enterprise: true },
  { name: "CRM", starter: false, professional: true, business: true, enterprise: true },
  { name: "POS", starter: false, professional: true, business: true, enterprise: true },
  { name: "Warehouse", starter: false, professional: true, business: true, enterprise: true },
  { name: "Multi-company", starter: false, professional: false, business: true, enterprise: true },
  { name: "API access", starter: false, professional: false, business: true, enterprise: true },
  { name: "WhatsApp & Maps", starter: false, professional: false, business: true, enterprise: true },
  { name: "SSO", starter: false, professional: false, business: false, enterprise: true },
  { name: "Dedicated success manager", starter: false, professional: false, business: true, enterprise: true },
  { name: "Custom SLA", starter: false, professional: false, business: false, enterprise: true },
];

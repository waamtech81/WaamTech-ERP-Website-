import { heroImageUrl, optimizeImageUrl } from "@/lib/images";
import { products } from "@/lib/data/site";
import { coreModules } from "@/lib/data/core";

export type ProductShowcase = {
  id: string;
  slug: string;
  name: string;
  category: string;
  icon: string;
  tagline: string;
  description: string;
  /** What this product is */
  about: string;
  /** Who / what it's for */
  forWhom: string;
  /** Key benefits */
  benefits: string[];
  features: string[];
  image: string;
  imageAlt: string;
  accent: string;
  preview?: (typeof coreModules)[number]["preview"];
};

const details: Record<
  string,
  {
    about: string;
    forWhom: string;
    benefits: string[];
    image: string;
    imageAlt: string;
    accent: string;
  }
> = {
  inventory: {
    about:
      "A real-time stock control system that tracks every SKU across warehouses, batches, and serials — so you always know what you have and where it is.",
    forWhom:
      "Retailers, distributors, manufacturers, and multi-branch businesses that need accurate stock, transfers, and reorder alerts.",
    benefits: [
      "Prevent stockouts and overstock with live levels",
      "Multi-warehouse transfers without spreadsheet chaos",
      "Batch & serial traceability for audits",
      "Valuation you can trust at month-end",
    ],
    image:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fm=webp&fit=crop&w=1400&q=70",
    imageAlt: "Warehouse inventory shelves and stock management",
    accent: "#2563eb",
  },
  pos: {
    about:
      "A fast point-of-sale built for busy counters — holds, returns, promotions, loyalty, and offline sync so checkout never slows your floor.",
    forWhom:
      "Retail stores, pharmacies, restaurants, and multi-till outlets that need reliable daily sales and shift control.",
    benefits: [
      "Speed up checkout and reduce queues",
      "Keep selling offline when internet drops",
      "Close shifts with clear cash variance",
      "Grow repeat visits with loyalty & promos",
    ],
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fm=webp&fit=crop&w=1400&q=70",
    imageAlt: "Retail POS checkout counter",
    accent: "#0ea5e9",
  },
  sales: {
    about:
      "End-to-end quote-to-cash: quotations, orders, deliveries, invoices, returns, and customer payments in one connected flow.",
    forWhom:
      "B2B sellers, wholesalers, and field sales teams who need clean order tracking and receivables visibility.",
    benefits: [
      "Convert quotes to invoices without rework",
      "Track deliveries against every order",
      "See due and overdue AR at a glance",
      "Control price lists and commissions",
    ],
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fm=webp&fit=crop&w=1400&q=70",
    imageAlt: "Sales analytics and order management",
    accent: "#4f46e5",
  },
  wms: {
    about:
      "Purchasing that connects vendors, POs, GRN, invoices, and 3-way match — so procurement stays controlled and cost-accurate.",
    forWhom:
      "Procurement teams, warehouses, and growing companies managing suppliers, landed costs, and receiving.",
    benefits: [
      "Approve POs with clear spend visibility",
      "Match GRN to invoices and reduce leakage",
      "Track vendor performance over time",
      "Capture landed costs into true COGS",
    ],
    image:
      "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?auto=format&fm=webp&fit=crop&w=1400&q=70",
    imageAlt: "Purchase orders and warehouse receiving",
    accent: "#0891b2",
  },
  finance: {
    about:
      "Your books, banks, budgets, and period close in one ledger — GL, cash, reconciliation, tax, and multi-currency ready.",
    forWhom:
      "Finance teams and business owners who need accurate P&L, cash control, and clean month-end close.",
    benefits: [
      "One source of truth for cash & banks",
      "Faster bank reconciliation",
      "Budget vs actual without extra tools",
      "Confident period close and reporting",
    ],
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fm=webp&fit=crop&w=1400&q=70",
    imageAlt: "Finance and accounting workspace",
    accent: "#059669",
  },
  crm: {
    about:
      "Customers, pipeline, campaigns, and loyalty together — from first lead to lifetime value and customer 360.",
    forWhom:
      "Sales and marketing teams that need pipeline clarity, follow-ups, and loyalty programs in one place.",
    benefits: [
      "Never lose a lead in chat or sheets",
      "See full customer history in seconds",
      "Run campaigns with clear outcomes",
      "Reward loyalty that actually converts",
    ],
    image:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fm=webp&fit=crop&w=1400&q=70",
    imageAlt: "CRM team collaboration and customer pipeline",
    accent: "#db2777",
  },
  hr: {
    about:
      "People operations without the chaos — attendance, leave, payroll, shifts, and employee self-service in one module.",
    forWhom:
      "HR and ops managers running payroll, attendance, and leave across stores, offices, or factories.",
    benefits: [
      "Accurate attendance and overtime",
      "Payroll ready on schedule",
      "Self-service leave for employees",
      "Less admin, fewer payroll disputes",
    ],
    image:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fm=webp&fit=crop&w=1400&q=70",
    imageAlt: "HR team and workforce management",
    accent: "#7c3aed",
  },
  manufacturing: {
    about:
      "Plan and run production with BOM, MRP, work orders, and shop-floor visibility — tied tightly to inventory and costing.",
    forWhom:
      "Manufacturers and light production units that need work orders, material planning, and WIP control.",
    benefits: [
      "Plan materials before shortages hit",
      "Track every work order on the floor",
      "Reduce scrap and rework surprises",
      "True WIP and production costing",
    ],
    image:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fm=webp&fit=crop&w=1400&q=70",
    imageAlt: "Manufacturing factory floor and production",
    accent: "#ea580c",
  },
  ai: {
    about:
      "An enterprise AI workspace that understands your installed modules — chat for answers, OCR for documents, and recommendations you can accept or reject.",
    forWhom:
      "Owners and managers who want faster decisions, less manual data entry, and insights without hiring a data team — while keeping data private.",
    benefits: [
      "Ask natural questions across Inventory, Sales, Finance & CRM",
      "Turn invoices and receipts into ERP-ready data with OCR",
      "Get reorder, sales, and follow-up recommendations",
      "Keep AI local — no public cloud AI keys required",
    ],
    image:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fm=webp&fit=crop&w=1400&q=70",
    imageAlt: "AI assistant and analytics workspace",
    accent: "#2563eb",
  },
};

const moduleById = Object.fromEntries(coreModules.map((m) => [m.id, m]));

export const productShowcases: ProductShowcase[] = products.map((p) => {
  const d = details[p.id];
  const moduleData = moduleById[p.id];
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    icon: p.icon,
    tagline: p.tagline,
    description: p.description,
    about: d?.about ?? p.description,
    forWhom: d?.forWhom ?? `Teams that need ${p.name} as part of their ERP stack.`,
    benefits: d?.benefits ?? p.features,
    features: p.features,
    image: heroImageUrl(d?.image ?? "https://images.unsplash.com/photo-1460925895917-afdab827c52f", 1400),
    imageAlt: d?.imageAlt ?? `${p.name} module`,
    accent: d?.accent ?? "#2563eb",
    preview: moduleData?.preview,
  };
});

export function getProductThumb(url: string) {
  return optimizeImageUrl(url, { width: 720, quality: 70 });
}

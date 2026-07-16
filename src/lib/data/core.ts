/** SaaS Core–aligned marketing content for WaamTech website */

export const coreModules = [
  {
    id: "inventory",
    name: "Inventory",
    short: "Stock",
    tagline: "Know every unit, warehouse, and movement",
    description:
      "Product catalog, variants, warehouses, transfers, batches, serials, valuations, and reorder alerts — real-time stock you can trust.",
    icon: "Package",
    highlights: ["Multi-warehouse", "Batch & serial", "Stock ledger", "Reorder alerts"],
    preview: {
      title: "Stock overview",
      kpis: [
        { label: "SKUs", value: "12,480", tone: "neutral" },
        { label: "Low stock", value: "37", tone: "warn" },
        { label: "Value", value: "₨ 8.2M", tone: "good" },
        { label: "Transfers", value: "14", tone: "neutral" },
      ],
      rows: [
        { ref: "SKU-1042", name: "Wireless Mouse", qty: "128", status: "Healthy" },
        { ref: "SKU-2201", name: "USB-C Hub", qty: "12", status: "Low" },
        { ref: "SKU-8810", name: "LED Monitor 27\"", qty: "64", status: "Healthy" },
      ],
    },
  },
  {
    id: "pos",
    name: "POS",
    short: "POS",
    tagline: "Checkout built for speed and reliability",
    description:
      "Fast terminals with holds, returns, promotions, loyalty, gift cards, shifts, offline sync, and WhatsApp/email receipts.",
    icon: "ShoppingCart",
    highlights: ["Offline mode", "Multi-till", "Loyalty", "Shift close"],
    preview: {
      title: "POS terminal",
      kpis: [
        { label: "Today sales", value: "₨ 184K", tone: "good" },
        { label: "Tickets", value: "312", tone: "neutral" },
        { label: "Avg basket", value: "₨ 590", tone: "good" },
        { label: "Open tills", value: "4", tone: "neutral" },
      ],
      rows: [
        { ref: "T-9182", name: "Counter 1 · Cash", qty: "₨ 42K", status: "Open" },
        { ref: "T-9183", name: "Counter 2 · Card", qty: "₨ 61K", status: "Open" },
        { ref: "T-9170", name: "Counter 3 · Mixed", qty: "₨ 38K", status: "Closed" },
      ],
    },
  },
  {
    id: "sales",
    name: "Sales",
    short: "Sales",
    tagline: "Quote to cash without friction",
    description:
      "Quotations, sales orders, delivery notes, invoices, returns, customer payments, price lists, and commissions.",
    icon: "TrendingUp",
    highlights: ["Quotations", "Invoices", "Deliveries", "AR payments"],
    preview: {
      title: "Sales invoices",
      kpis: [
        { label: "Total", value: "₨ 2.4M", tone: "neutral" },
        { label: "Paid", value: "₨ 1.9M", tone: "good" },
        { label: "Due", value: "₨ 410K", tone: "warn" },
        { label: "Overdue", value: "₨ 92K", tone: "bad" },
      ],
      rows: [
        { ref: "INV-24081", name: "Northline Retail", qty: "₨ 128,000", status: "Paid" },
        { ref: "INV-24082", name: "Cedar Traders", qty: "₨ 64,500", status: "Due" },
        { ref: "INV-24070", name: "Harbor Dist.", qty: "₨ 91,200", status: "Overdue" },
      ],
    },
  },
  {
    id: "wms",
    name: "Purchasing",
    short: "Purchasing",
    tagline: "Procure smarter with supplier clarity",
    description:
      "Vendors, purchase requests, RFQs, POs, GRN, purchase invoices, 3-way match, landed costs, and vendor performance.",
    icon: "ShoppingBag",
    highlights: ["POs & GRN", "3-way match", "Landed cost", "Vendor score"],
    preview: {
      title: "Purchase orders",
      kpis: [
        { label: "Open POs", value: "28", tone: "neutral" },
        { label: "Receiving", value: "6", tone: "warn" },
        { label: "Matched", value: "19", tone: "good" },
        { label: "Spend MTD", value: "₨ 1.1M", tone: "neutral" },
      ],
      rows: [
        { ref: "PO-5521", name: "Alpha Supplies", qty: "₨ 220K", status: "Approved" },
        { ref: "PO-5528", name: "Metro Packaging", qty: "₨ 84K", status: "Receiving" },
        { ref: "PO-5510", name: "Prime Chemicals", qty: "₨ 156K", status: "Matched" },
      ],
    },
  },
  {
    id: "finance",
    name: "Finance",
    short: "Finance",
    tagline: "Books, cash, and control in one ledger",
    description:
      "Chart of accounts, journals, GL, cash book, banks, reconciliation, budgets, tax, multi-currency, and period close.",
    icon: "Wallet",
    highlights: ["General ledger", "Bank recon", "Budgets", "P&L"],
    preview: {
      title: "Cash & banks",
      kpis: [
        { label: "Cash", value: "₨ 640K", tone: "good" },
        { label: "Bank", value: "₨ 3.1M", tone: "good" },
        { label: "Payables", value: "₨ 820K", tone: "warn" },
        { label: "Receivables", value: "₨ 1.4M", tone: "neutral" },
      ],
      rows: [
        { ref: "JB- Habib", name: "Operating account", qty: "₨ 2.1M", status: "Synced" },
        { ref: "Meezan-01", name: "Collections", qty: "₨ 980K", status: "Synced" },
        { ref: "Cash-HQ", name: "Petty cash", qty: "₨ 42K", status: "Open" },
      ],
    },
  },
  {
    id: "crm",
    name: "CRM",
    short: "CRM",
    tagline: "Customers, pipeline, and loyalty together",
    description:
      "Leads, accounts, contacts, opportunities, activities, campaigns, territories, loyalty, gift cards, and customer 360.",
    icon: "Users",
    highlights: ["Pipeline", "Loyalty", "Campaigns", "Customer 360"],
    preview: {
      title: "Sales pipeline",
      kpis: [
        { label: "Open deals", value: "64", tone: "neutral" },
        { label: "Pipeline", value: "₨ 9.8M", tone: "good" },
        { label: "Won MTD", value: "12", tone: "good" },
        { label: "Follow-ups", value: "23", tone: "warn" },
      ],
      rows: [
        { ref: "OPP-301", name: "City Mart rollout", qty: "₨ 1.2M", status: "Negotiation" },
        { ref: "OPP-288", name: "Pharma chain POS", qty: "₨ 860K", status: "Proposal" },
        { ref: "OPP-275", name: "Warehouse WMS", qty: "₨ 2.4M", status: "Qualified" },
      ],
    },
  },
  {
    id: "hr",
    name: "HR & Payroll",
    short: "HR",
    tagline: "People operations without the chaos",
    description:
      "Employees, attendance, leave, payroll, shifts, overtime, recruitment, performance, claims, and self-service portals.",
    icon: "UserCog",
    highlights: ["Attendance", "Payroll", "Leave", "ESS portal"],
    preview: {
      title: "Workforce today",
      kpis: [
        { label: "Present", value: "186", tone: "good" },
        { label: "On leave", value: "11", tone: "neutral" },
        { label: "Late", value: "7", tone: "warn" },
        { label: "Payroll due", value: "3d", tone: "neutral" },
      ],
      rows: [
        { ref: "EMP-104", name: "Sara Ahmed · Sales", qty: "09:02", status: "Present" },
        { ref: "EMP-221", name: "Bilal Khan · Warehouse", qty: "Leave", status: "Approved" },
        { ref: "EMP-088", name: "Hina Raza · Finance", qty: "09:41", status: "Late" },
      ],
    },
  },
  {
    id: "manufacturing",
    name: "Manufacturing",
    short: "MRP",
    tagline: "Plan production with inventory confidence",
    description:
      "BOMs, routings, work orders, MRP, shop floor, capacity, scrap/rework, WIP costing, and quality checks.",
    icon: "Factory",
    highlights: ["BOM", "Work orders", "MRP", "Shop floor"],
    preview: {
      title: "Production board",
      kpis: [
        { label: "Active WOs", value: "18", tone: "neutral" },
        { label: "On time", value: "94%", tone: "good" },
        { label: "Scrap", value: "1.8%", tone: "warn" },
        { label: "WIP", value: "₨ 760K", tone: "neutral" },
      ],
      rows: [
        { ref: "WO-441", name: "Assembly Line A", qty: "80%", status: "Running" },
        { ref: "WO-438", name: "Packaging Bay 2", qty: "100%", status: "Done" },
        { ref: "WO-450", name: "QC Station", qty: "12%", status: "Queued" },
      ],
    },
  },
] as const;

export const coreBusinesses = [
  { id: "retail_store", name: "Retail Store", description: "General retail with POS, stock, loyalty, and promotions.", icon: "Store", modules: ["Inventory", "POS", "CRM", "Finance", "Sales"] },
  { id: "pharmacy", name: "Pharmacy", description: "Batch, expiry, prescription gates, and controlled medicines.", icon: "Pill", modules: ["Inventory", "POS", "CRM", "Finance"] },
  { id: "grocery", name: "Grocery", description: "PLU, weight scales, perishables, and spoilage control.", icon: "ShoppingCart", modules: ["Inventory", "POS", "WMS", "Finance"] },
  { id: "supermarket", name: "Supermarket", description: "Multi-till, departments, loyalty, and multi-warehouse.", icon: "Store", modules: ["Inventory", "POS", "HR", "CRM"] },
  { id: "restaurant", name: "Restaurant", description: "Tables, kitchen tickets, recipes, and food cost.", icon: "UtensilsCrossed", modules: ["POS", "Inventory", "HR", "Finance"] },
  { id: "cafe", name: "Cafe", description: "Quick service, recipes, and outlet-level stock.", icon: "UtensilsCrossed", modules: ["POS", "Inventory", "Finance"] },
  { id: "bakery", name: "Bakery", description: "Batch production, expiry, and recipe costing.", icon: "Factory", modules: ["Inventory", "POS", "Manufacturing"] },
  { id: "garments", name: "Garments", description: "Variants, seasons, transfers, and multi-store retail.", icon: "Shirt", modules: ["Inventory", "POS", "CRM", "Sales"] },
  { id: "electronics", name: "Electronics", description: "Serial tracking, warranty, and channel sales.", icon: "Cpu", modules: ["Inventory", "POS", "CRM", "Sales"] },
  { id: "furniture", name: "Furniture", description: "Custom orders, showrooms, and delivery workflows.", icon: "Armchair", modules: ["Inventory", "Sales", "CRM", "Finance"] },
  { id: "auto_parts", name: "Auto Parts", description: "Parts catalogs, compatibility, and counter sales.", icon: "Car", modules: ["Inventory", "POS", "Sales", "WMS"] },
  { id: "manufacturing", name: "Manufacturing", description: "BOM, MRP, work orders, and shop-floor control.", icon: "Factory", modules: ["Inventory", "Manufacturing", "WMS", "HR"] },
  { id: "warehouse", name: "Warehouse & Distribution", description: "Inbound, putaway, picking, and route delivery.", icon: "Warehouse", modules: ["Inventory", "WMS", "Sales", "Finance"] },
  { id: "wholesale", name: "Wholesale", description: "Bulk pricing, credit control, and B2B ordering.", icon: "Truck", modules: ["Inventory", "Sales", "CRM", "Finance"] },
  { id: "distribution", name: "Distribution", description: "Routes, van sales, returns, and territory coverage.", icon: "Network", modules: ["Inventory", "Sales", "CRM", "WMS"] },
  { id: "property", name: "Property", description: "Leases, maintenance, tenants, and collections.", icon: "Building2", modules: ["Finance", "CRM", "Documents", "Assets"] },
  { id: "services", name: "Professional Services", description: "Service orders, SLAs, field visits, and billing.", icon: "Handshake", modules: ["Service", "CRM", "Finance", "Projects"] },
  { id: "ecommerce_backend", name: "E-commerce Backend", description: "Channel inventory, fulfillment, and order sync.", icon: "Network", modules: ["Inventory", "Sales", "WMS", "CRM"] },
] as const;

export const coreCapabilities = [
  {
    title: "Business Profile Engine",
    description: "Pick your industry and WaamTech configures modules, feature packs, workflows, KPIs, and POS layouts automatically.",
    icon: "Layers",
  },
  {
    title: "Feature Packs",
    description: "Add batch tracking, expiry, prescription, kitchen, table service, route delivery, rentals, and more — without rebuilding your stack.",
    icon: "Sparkles",
  },
  {
    title: "Modular Clean Core",
    description: "Platform stays clean. Business power lives in installable modules — Inventory, POS, Sales, Finance, HR, Manufacturing, and more.",
    icon: "Boxes",
  },
  {
    title: "Approvals & Automation",
    description: "Workflow engine, alerts, low-stock rules, till variance checks, and audit-ready activity trails out of the box.",
    icon: "Zap",
  },
] as const;

export const homeStats = [
  { label: "Industries served", value: 30, suffix: "+" },
  { label: "Core modules", value: 12, suffix: "" },
  { label: "Feature packs", value: 40, suffix: "+" },
  { label: "Setup to go-live", value: 14, suffix: " days" },
] as const;

/** Native mobile app vs responsive web — by business profile */

import {
  getBusinessCategory,
  resolveBusinessCategoryId,
} from "@/lib/data/business-hierarchy";

export type MobileAppLevel = "required" | "recommended" | "available";

export type IndustryMobileApp = {
  level: MobileAppLevel;
  /** Short badge label */
  badge: string;
  /** Why this profile needs / gets the app */
  note: string;
  /** Field use cases shown in UI */
  useCases: string[];
};

export const mobileAppLevelCopy: Record<
  MobileAppLevel,
  { title: string; description: string; color: string }
> = {
  required: {
    title: "Mobile app required",
    description:
      "This business runs in the field. The native mobile app is included so your team can work on the road — not only at a desk.",
    color: "#dc2626",
  },
  recommended: {
    title: "Mobile app recommended",
    description:
      "Your team will work smoother with the native mobile app for floor, delivery, or on-the-go checks. Included with this profile.",
    color: "#d97706",
  },
  available: {
    title: "Mobile app available",
    description:
      "You get the full responsive web app on any device. The native mobile app can be enabled when your team needs field access.",
    color: "#2563eb",
  },
};

/** Which SaaS Core profiles get / need the native mobile app */
export const industryMobileApp: Record<string, IndustryMobileApp> = {
  // Field-critical
  distribution: {
    level: "required",
    badge: "Mobile app required",
    note: "Route planning, van loads, and delivery confirmation happen in the field — drivers need the native app.",
    useCases: ["Route checklist", "Delivery confirm", "Van load status", "Exception alerts"],
  },
  water_management: {
    level: "required",
    badge: "Mobile app required",
    note: "Bottle issue/return and daily routes are field work. Delivery staff use the mobile app every stop.",
    useCases: ["Bottle issue/return", "Route delivery", "Deposit check", "Subscription renew"],
  },
  services: {
    level: "required",
    badge: "Mobile app required",
    note: "Technicians dispatch, complete jobs, and close SLAs on site — the mobile app is part of the profile.",
    useCases: ["Job dispatch", "Work complete", "SLA timer", "On-site invoice"],
  },
  warehouse: {
    level: "required",
    badge: "Mobile app required",
    note: "Pick, pack, putaway, and cycle counts are floor work. Warehouse staff run the native app with barcode scanning.",
    useCases: ["Pick & pack", "Putaway", "Cycle count", "Transfer confirm"],
  },
  property: {
    level: "required",
    badge: "Mobile app required",
    note: "Maintenance teams handle requests on site. The mobile app keeps SLA and unit work mobile-first.",
    useCases: ["Maintenance jobs", "Unit check", "Photo notes", "SLA alerts"],
  },

  // Strongly recommended
  building_materials: {
    level: "recommended",
    badge: "Mobile app included",
    note: "Yard and site deliveries benefit from mobile confirmations and credit-safe dispatch on the go.",
    useCases: ["Delivery confirm", "Site photos", "Credit check", "Tonnage note"],
  },
  agriculture: {
    level: "recommended",
    badge: "Mobile app included",
    note: "Seasonal yard sales and bulk dispatch are smoother when field staff carry the mobile app.",
    useCases: ["Bulk sale", "Dispatch confirm", "Hazard check", "Stock glance"],
  },
  ecommerce_backend: {
    level: "recommended",
    badge: "Mobile app included",
    note: "Fulfillment teams pick and pack faster with barcode-friendly mobile workflows.",
    useCases: ["Order pick", "Pack confirm", "Stock scan", "Ship ready"],
  },
  restaurant: {
    level: "recommended",
    badge: "Mobile app included",
    note: "Floor staff can take table orders and check kitchen status on phones or tablets.",
    useCases: ["Table order", "Waiter view", "Kitchen status", "Bill settle"],
  },
  cafe: {
    level: "recommended",
    badge: "Mobile app included",
    note: "Quick-serve teams use tablets/phones for rush orders and stock checks.",
    useCases: ["Quick order", "Kitchen ticket", "Stock check", "Loyalty scan"],
  },
  professional_services: {
    level: "recommended",
    badge: "Mobile app included",
    note: "Consultants log timesheets and project updates from the field or client sites.",
    useCases: ["Timesheet", "Project update", "Expense note", "Milestone check"],
  },
  manufacturing: {
    level: "recommended",
    badge: "Mobile app included",
    note: "Shop-floor material issue and quality checks work better on handheld devices.",
    useCases: ["Material issue", "QC check", "Production status", "Shortage alert"],
  },
  auto_parts: {
    level: "recommended",
    badge: "Mobile app included",
    note: "Counter and workshop staff look up OEM fitment and issue parts from mobile.",
    useCases: ["OEM lookup", "Parts issue", "Fitment check", "Stock scan"],
  },

  // Available for all others — responsive web always; native optional
  retail_store: {
    level: "available",
    badge: "Responsive web + mobile ready",
    note: "Run the full store on responsive web from phone, tablet, or desktop. Native app available when you need it.",
    useCases: ["Sales glance", "Stock alert", "Till summary", "Approvals"],
  },
  pharmacy: {
    level: "available",
    badge: "Responsive web + mobile ready",
    note: "Dispense and stock work on any screen size. Native app available for managers on the move.",
    useCases: ["Expiry alerts", "Stock check", "Daily summary", "Approvals"],
  },
  grocery: {
    level: "available",
    badge: "Responsive web + mobile ready",
    note: "Checkout stays on POS; managers monitor sales and spoilage from any device.",
    useCases: ["Sales glance", "Spoilage alert", "Reorder", "Dept summary"],
  },
  supermarket: {
    level: "available",
    badge: "Responsive web + mobile ready",
    note: "Multi-till ops on desktop/POS; supervisors use phones for live till and stock checks.",
    useCases: ["Till variance", "Dept sales", "Promo status", "Stock move"],
  },
  bakery: {
    level: "available",
    badge: "Responsive web + mobile ready",
    note: "Production and counter on web; mobile helps bakers check bake plans and batch status.",
    useCases: ["Bake plan", "Batch status", "Sales glance", "Waste note"],
  },
  garments: {
    level: "available",
    badge: "Responsive web + mobile ready",
    note: "Full apparel ERP on any device. Native app for floor stock and size checks when needed.",
    useCases: ["Size check", "Sell-through", "Stock scan", "Markdowns"],
  },
  shoes: {
    level: "available",
    badge: "Responsive web + mobile ready",
    note: "Size matrices on web; mobile helps floor staff verify pairs and stock quickly.",
    useCases: ["Size lookup", "Stock scan", "Exchange", "Sales glance"],
  },
  cosmetics: {
    level: "available",
    badge: "Responsive web + mobile ready",
    note: "Beauty counter on responsive web; mobile for expiry and shade checks on the floor.",
    useCases: ["Shade check", "Expiry alert", "Loyalty", "Stock glance"],
  },
  electronics: {
    level: "available",
    badge: "Responsive web + mobile ready",
    note: "Serial and warranty on web; mobile helps after-sales and stock checks in showrooms.",
    useCases: ["Serial lookup", "Warranty", "Service claim", "Stock"],
  },
  mobile_shop: {
    level: "available",
    badge: "Responsive web + mobile ready",
    note: "IMEI sales on web/POS; managers can review IMEI and warranty from phones anytime.",
    useCases: ["IMEI lookup", "Warranty", "Accessory attach", "Stock"],
  },
  furniture: {
    level: "available",
    badge: "Responsive web + mobile ready",
    note: "Quotes and deposits on web; delivery teams can use mobile for schedule confirmations.",
    useCases: ["Delivery slot", "Deposit due", "Order status", "Customer note"],
  },
  hardware: {
    level: "available",
    badge: "Responsive web + mobile ready",
    note: "Counter POS on web; mobile helps trade customers and stock lookups on the floor.",
    useCases: ["Stock lookup", "Reorder", "Warranty", "Sales glance"],
  },
  medical_supplies: {
    level: "available",
    badge: "Responsive web + mobile ready",
    note: "Cold-chain and expiry on web; warehouse teams can add native app for scanning.",
    useCases: ["Expiry alert", "Cold-chain", "Fill rate", "Stock scan"],
  },
  textile: {
    level: "available",
    badge: "Responsive web + mobile ready",
    note: "Roll and shade control on web; floor tablets/phones available when cutting teams need them.",
    useCases: ["Roll balance", "Cut issue", "Shade check", "Yield"],
  },
  wholesale: {
    level: "available",
    badge: "Responsive web + mobile ready",
    note: "B2B pricing and credit on web; sales reps can use mobile for quotes and stock reservation.",
    useCases: ["Quote", "Credit check", "Stock reserve", "Statement"],
  },
  chemical: {
    level: "available",
    badge: "Responsive web + mobile ready",
    note: "Hazard gates and SDS on web; dispatch teams can use mobile for gated confirmations.",
    useCases: ["Hazard gate", "SDS check", "Dispatch", "Lot trace"],
  },
  pet_store: {
    level: "available",
    badge: "Responsive web + mobile ready",
    note: "Retail and subscriptions on responsive web across phone, tablet, and desktop.",
    useCases: ["POS glance", "Subscription", "Expiry", "Loyalty"],
  },
};

export function getIndustryMobileApp(industryId: string): IndustryMobileApp {
  if (industryMobileApp[industryId]) {
    return industryMobileApp[industryId];
  }

  const category = getBusinessCategory(resolveBusinessCategoryId(industryId));
  if (category?.mobile_mode === "required") {
    return {
      level: "required",
      badge: "Mobile app included",
      note: "This business category includes the native mobile app so your team can work on the road — not only at a desk.",
      useCases: ["Field updates", "Approvals", "Stock glance", "Alerts"],
    };
  }

  return {
    level: "available" as const,
    badge: "Responsive web + mobile ready",
    note: "Use WaamTech on any device in the browser. Native mobile app available when your team needs field access.",
    useCases: ["Dashboard", "Approvals", "Stock glance", "Alerts"],
  };
}

export const mobileAppPage = {
  hero: {
    eyebrow: "Access anywhere",
    title: "One platform — responsive web + native mobile app",
    description:
      "WaamTech runs as a full responsive web app on desktop, tablet, and phone. For businesses that work in the field, we also provide a native mobile app — included based on your business profile.",
    image:
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fm=webp&fit=crop&w=1600&q=70",
    imageAlt: "Person using business mobile app on smartphone",
  },
  dual: [
    {
      id: "web",
      title: "Responsive web app",
      subtitle: "Every plan · every device",
      description:
        "Open WaamTech in the browser on desktop, laptop, tablet, or phone. Layouts adapt automatically — no install required. Work from the office, home, or a store counter anytime.",
      image:
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fm=webp&fit=crop&w=1400&q=70",
      points: [
        "Desktop, tablet & mobile browsers",
        "Same login, same live data",
        "No app store wait for web access",
        "Ideal for office, POS, and managers",
      ],
    },
    {
      id: "native",
      title: "Native mobile app",
      subtitle: "Field businesses · profile-based",
      description:
        "When your business profile needs field work — delivery, warehouse, technicians, maintenance — the WaamTech mobile app is included so staff can scan, confirm, and update on the road.",
      image:
        "https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fm=webp&fit=crop&w=1400&q=70",
      points: [
        "Built for field & floor teams",
        "Barcode / IMEI friendly workflows",
        "Offline-friendly patterns where needed",
        "Depends on your business profile",
      ],
    },
  ],
  devices: [
    {
      title: "Desktop",
      text: "Full ERP depth — finance, reports, multi-branch setup, and admin.",
      icon: "Monitor",
    },
    {
      title: "Tablet",
      text: "Floor and counter friendly — POS, kitchen, pick lists, showroom.",
      icon: "Tablet",
    },
    {
      title: "Mobile web",
      text: "Approvals, alerts, and dashboards in any phone browser.",
      icon: "Smartphone",
    },
    {
      title: "Native app",
      text: "Field delivery, warehouse, and service jobs in a dedicated app.",
      icon: "AppWindow",
    },
  ],
  pricingNote: {
    title: "Mobile app & your plan",
    items: [
      {
        plan: "Starter",
        text: "1 user · full responsive web on all devices. Native app available when your profile recommends it.",
      },
      {
        plan: "Professional",
        text: "5 users included (extra on demand) · responsive web + native mobile for recommended field profiles.",
      },
      {
        plan: "Business & above",
        text: "10+ users (extra on demand) · responsive web + native mobile for all field roles, with Maps & WhatsApp where enabled.",
      },
      {
        plan: "Lifetime",
        text: "25 users included (extra on demand) · full modules, AI Workspace, and mobile for field roles.",
      },
      {
        plan: "By business profile",
        text: "If you pick Distribution, Water delivery, Field service, Warehouse, or Property — mobile app is marked required and included in onboarding.",
      },
    ],
  },
};

export const mobileAppRequiredIds = Object.entries(industryMobileApp)
  .filter(([, v]) => v.level === "required")
  .map(([id]) => id);

export const mobileAppRecommendedIds = Object.entries(industryMobileApp)
  .filter(([, v]) => v.level === "recommended")
  .map(([id]) => id);

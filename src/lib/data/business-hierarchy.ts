/**
 * UI presentation chrome ONLY — not an Industry/Category registry.
 * Registry data must come from License Engine public catalog APIs.
 * Prefer: `@/lib/commercial/engine-industry-ssot` and `useCatalogIndustries`.
 */

import { optimizeImageUrl } from "@/lib/images";

export type PosMode = "required" | "optional" | "disabled";
export type MobileMode = "required" | "disabled";

/** Presentation-only: icon + accent color keyed by Engine industry code/slug. */
export const industryPresentation: Record<
  string,
  { icon: string; color: string }
> = {
  automotive_vehicle: { icon: "car", color: "#1d4ed8" },
  healthcare_pharmacy: { icon: "pill", color: "#059669" },
  real_estate_property: { icon: "building", color: "#0f766e" },
  manufacturing: { icon: "factory", color: "#475569" },
  retail_commerce: { icon: "store", color: "#2563eb" },
  wholesale_distribution: { icon: "truck", color: "#0369a1" },
  warehouse_logistics: { icon: "warehouse", color: "#334155" },
  restaurant_food_service: { icon: "utensils", color: "#dc2626" },
  education: { icon: "graduation-cap", color: "#7c3aed" },
  hospital_medical: { icon: "hospital", color: "#0e7490" },
  agriculture: { icon: "sprout", color: "#65a30d" },
  textile_garments: { icon: "shirt", color: "#7e22ce" },
  furniture_interior: { icon: "sofa", color: "#b45309" },
  building_materials_hardware: { icon: "brick-wall", color: "#a16207" },
  beauty_cosmetics: { icon: "sparkles", color: "#db2777" },
  pet_veterinary: { icon: "paw-print", color: "#c2410c" },
  water_management: { icon: "droplets", color: "#0284c7" },
  services: { icon: "briefcase", color: "#4f46e5" },
};

/** Featured industry ids for mega-menu ordering (presentation curation). */
export const featuredIndustryIds = [
  "retail_commerce",
  "automotive_vehicle",
  "healthcare_pharmacy",
  "restaurant_food_service",
  "manufacturing",
  "wholesale_distribution",
  "warehouse_logistics",
  "real_estate_property",
] as const;

/** Hot badges in mega menu (presentation curation — not registry data). */
export const hotCategoryIds = new Set<string>([
  "retail_store",
  "supermarket",
  "grocery_store",
  "auto_parts_retail",
  "auto_workshop_service",
  "retail_pharmacy",
  "restaurant",
  "cafe",
  "general_manufacturing",
  "general_wholesale",
  "warehouse",
  "property_management",
]);

/** Old marketing / signup permalink aliases → category mapping keys. */
export const legacyProfileMap: Record<string, string> = {
  auto_parts: "auto_parts_retail",
  pharmacy: "retail_pharmacy",
  property: "property_management",
  manufacturing: "general_manufacturing",
  chemical: "chemical_manufacturing",
  general_retail: "retail_store",
  grocery: "grocery_store",
  wholesale: "general_wholesale",
  distribution: "regional_distributor",
  logistics: "third_party_logistics",
  education: "school",
  veterinary: "veterinary_clinic",
  agriculture: "farm",
  garments: "garment_retail",
  textile: "textile_mill",
  furniture: "furniture_retail",
  hardware: "hardware_store",
  cosmetics: "cosmetics_store",
  salon: "beauty_salon",
  pet_store: "pet_shop",
  water_management: "water_utility",
};

export function isHotCategory(
  category:
    | string
    | { id?: string | null; slug?: string | null; code?: string | null }
): boolean {
  if (typeof category === "string") {
    const key = category.trim().toLowerCase();
    return Boolean(key) && hotCategoryIds.has(key);
  }
  const keys = [category.id, category.slug, category.code]
    .map((v) => String(v || "").trim().toLowerCase())
    .filter(Boolean);
  return keys.some((k) => hotCategoryIds.has(k));
}

/** Lucide icon name overrides for SaaS Core / Engine icon keys */
export const industryIconMap: Record<string, string> = {
  car: "Car",
  pill: "Pill",
  building: "Building2",
  factory: "Factory",
  store: "Store",
  truck: "Truck",
  warehouse: "Warehouse",
  utensils: "UtensilsCrossed",
  "graduation-cap": "GraduationCap",
  hospital: "Hospital",
  sprout: "Sprout",
  shirt: "Shirt",
  sofa: "Armchair",
  "brick-wall": "BrickWall",
  sparkles: "Sparkles",
  "paw-print": "PawPrint",
  droplets: "Droplets",
  briefcase: "Briefcase",
};

export const industryImages: Record<string, { image: string; imageAlt: string }> = {
  automotive_vehicle: {
    image:
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fm=webp&fit=crop&w=900&q=70",
    imageAlt: "Auto mechanic working on a vehicle in a service bay",
  },
  healthcare_pharmacy: {
    image:
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fm=webp&fit=crop&w=900&q=70",
    imageAlt: "Pharmacy shelves stocked with medicines",
  },
  real_estate_property: {
    image:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fm=webp&fit=crop&w=900&q=70",
    imageAlt: "Modern residential and commercial property exterior",
  },
  manufacturing: {
    image:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fm=webp&fit=crop&w=900&q=70",
    imageAlt: "Manufacturing engineer on a modern production floor",
  },
  retail_commerce: {
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fm=webp&fit=crop&w=900&q=70",
    imageAlt: "Bright modern retail store aisle",
  },
  wholesale_distribution: {
    image:
      "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fm=webp&fit=crop&w=900&q=70",
    imageAlt: "Wholesale distribution center with pallet racks",
  },
  warehouse_logistics: {
    image:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fm=webp&fit=crop&w=900&q=70",
    imageAlt: "Warehouse logistics team moving inventory",
  },
  restaurant_food_service: {
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fm=webp&fit=crop&w=900&q=70",
    imageAlt: "Restaurant dining room ready for service",
  },
  education: {
    image:
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fm=webp&fit=crop&w=900&q=70",
    imageAlt: "University lecture hall and campus learning space",
  },
  hospital_medical: {
    image:
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fm=webp&fit=crop&w=900&q=70",
    imageAlt: "Hospital corridor and medical care facility",
  },
  agriculture: {
    image:
      "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fm=webp&fit=crop&w=900&q=70",
    imageAlt: "Green agriculture field and farming operations",
  },
  textile_garments: {
    image:
      "https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fm=webp&fit=crop&w=900&q=70",
    imageAlt: "Colorful textile fabric rolls in a garment factory",
  },
  furniture_interior: {
    image:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fm=webp&fit=crop&w=900&q=70",
    imageAlt: "Styled furniture and interior design showroom",
  },
  building_materials_hardware: {
    image:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fm=webp&fit=crop&w=900&q=70",
    imageAlt: "Building materials and hardware at a construction site",
  },
  beauty_cosmetics: {
    image:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fm=webp&fit=crop&w=900&q=70",
    imageAlt: "Beauty and cosmetics products on display",
  },
  pet_veterinary: {
    image:
      "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fm=webp&fit=crop&w=900&q=70",
    imageAlt: "Pet care and veterinary clinic setting",
  },
  water_management: {
    image:
      "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fm=webp&fit=crop&w=900&q=70",
    imageAlt: "Bottled water packaging and delivery operations",
  },
  services: {
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fm=webp&fit=crop&w=900&q=70",
    imageAlt: "Professional services team in a modern office",
  },
};

function presentationKey(raw: string): string {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
}

export function getIndustryPresentation(industryId: string | null | undefined) {
  const key = presentationKey(industryId || "");
  return (
    industryPresentation[key] || {
      icon: "building",
      color: "#2563eb",
    }
  );
}

export function getIndustryLucideIcon(
  industry: { icon?: string | null; id?: string | null } | string
) {
  if (typeof industry === "string") {
    const icon = getIndustryPresentation(industry).icon;
    return industryIconMap[icon] || "Boxes";
  }
  const icon =
    industry.icon || getIndustryPresentation(industry.id || "").icon || "building";
  return industryIconMap[icon] || "Boxes";
}

function industryMediaLookupKeys(raw: string): string[] {
  const s = String(raw || "")
    .trim()
    .toLowerCase();
  if (!s) return [];
  const underscored = s.replace(/-/g, "_");
  const hyphenated = s.replace(/_/g, "-");
  return [...new Set([s, underscored, hyphenated])];
}

/** Industry imagery — unique WebP per industry; width defaults to card size. */
export function getIndustryMedia(industryId: string, width = 640) {
  const keys = industryMediaLookupKeys(industryId);
  let raw: { image: string; imageAlt: string } | undefined;
  for (const key of keys) {
    if (industryImages[key]) {
      raw = industryImages[key];
      break;
    }
  }
  if (!raw) {
    raw = {
      image:
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fm=webp&fit=crop&w=900&q=70",
      imageAlt: "Business team reviewing operations",
    };
  }
  return {
    image: optimizeImageUrl(raw.image, { width, quality: 70 }),
    imageAlt: raw.imageAlt,
  };
}

/** Resolve legacy marketing permalink → category mapping key (not a registry). */
export function resolveLegacyCategoryKey(
  profileOrLegacyId: string | null | undefined
): string | null {
  const raw = String(profileOrLegacyId || "").trim();
  if (!raw) return null;
  const key = raw.toLowerCase().replace(/-/g, "_");
  return legacyProfileMap[raw] || legacyProfileMap[key] || null;
}

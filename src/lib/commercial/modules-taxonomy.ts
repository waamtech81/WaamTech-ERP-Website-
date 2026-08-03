/**
 * Presentation taxonomy for module browse pages.
 * License Engine currently publishes category=ERP / industry=General for every
 * module — these helpers derive useful browse groups from module codes/names
 * without inventing a second commercial registry.
 */
import type { CatalogModule } from "@/lib/commercial/types";
import { slugifyLabel } from "@/lib/commercial/module-builder";

export type ModuleBrowseCategory =
  | "Operations"
  | "Sales & CRM"
  | "Finance"
  | "People"
  | "Projects & Service"
  | "Platform"
  | "Industry packs";

/** Functional / platform modules (shared across industries). */
const CATEGORY_BY_CODE: Record<string, ModuleBrowseCategory> = {
  inventory: "Operations",
  pos: "Operations",
  wms: "Operations",
  manufacturing: "Operations",
  logistics: "Operations",
  wholesale: "Operations",
  sales: "Sales & CRM",
  crm: "Sales & CRM",
  finance: "Finance",
  assets: "Finance",
  hr: "People",
  service: "Projects & Service",
  project_management: "Projects & Service",
  documents: "Platform",
};

/** Industry pack modules — only these appear on Modules by Industry. */
const INDUSTRY_BY_CODE: Record<string, string> = {
  agriculture: "Agriculture",
  automotive: "Automotive",
  beauty: "Beauty & Cosmetics",
  building_materials: "Building Materials",
  education: "Education",
  furniture: "Furniture",
  hospital: "Hospital & Medical",
  pet: "Pet & Veterinary",
  pharmacy: "Healthcare & Pharmacy",
  property: "Real Estate & Property",
  restaurant: "Restaurant & Food",
  textile: "Textile & Garments",
  water: "Water Management",
};

const CATEGORY_ORDER: ModuleBrowseCategory[] = [
  "Operations",
  "Sales & CRM",
  "Finance",
  "People",
  "Projects & Service",
  "Platform",
  "Industry packs",
];

function codeKey(mod: Pick<CatalogModule, "code" | "slug">): string {
  return String(mod.code || mod.slug || "")
    .trim()
    .toLowerCase();
}

export function isIndustryPackModule(
  mod: Pick<CatalogModule, "code" | "slug" | "category">
): boolean {
  if (/^industry$/i.test(String(mod.category || ""))) return true;
  return Boolean(INDUSTRY_BY_CODE[codeKey(mod)]);
}

/** Browse category used on Modules by Category. Prefer License Engine category when set. */
export function browseCategoryForModule(
  mod: Pick<CatalogModule, "code" | "slug" | "name" | "category">
): ModuleBrowseCategory {
  const key = codeKey(mod);
  const raw = String(mod.category || "").trim();
  // License Engine Industry category = industry packs (never predefined-plan modules).
  if (/^industry$/i.test(raw) || INDUSTRY_BY_CODE[key]) return "Industry packs";
  if (CATEGORY_BY_CODE[key]) return CATEGORY_BY_CODE[key];
  // Fallback: keep Engine category only when it is not the flat "ERP" bucket.
  if (raw && !/^erp$/i.test(raw) && !/^general$/i.test(raw)) {
    return raw as ModuleBrowseCategory;
  }
  return "Platform";
}

/** Industry label for industry-pack modules; null for shared/core modules. */
export function browseIndustryForModule(
  mod: Pick<CatalogModule, "code" | "slug" | "name" | "industry" | "category">
): string | null {
  const key = codeKey(mod);
  if (INDUSTRY_BY_CODE[key]) return INDUSTRY_BY_CODE[key];
  if (/^industry$/i.test(String(mod.category || ""))) {
    return String(mod.name || key).trim() || key;
  }
  const raw = String(mod.industry || "").trim();
  if (raw && !/^general$/i.test(raw) && !/^erp$/i.test(raw)) return raw;
  return null;
}

export function uniqueBrowseCategories(modules: CatalogModule[]): string[] {
  const set = new Set(modules.map((m) => browseCategoryForModule(m)));
  return CATEGORY_ORDER.filter((c) => set.has(c)).concat(
    [...set].filter((c) => !CATEGORY_ORDER.includes(c as ModuleBrowseCategory)).sort()
  );
}

/** Only distinct industry packs — used on Modules by Industry. */
export function uniqueBrowseIndustries(modules: CatalogModule[]): string[] {
  const set = new Set<string>();
  for (const m of modules) {
    const ind = browseIndustryForModule(m);
    if (ind) set.add(ind);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function filterModulesByBrowseCategory(
  modules: CatalogModule[],
  filter: string | null
): CatalogModule[] {
  if (!filter) return modules;
  const slug = slugifyLabel(filter);
  return modules.filter((m) => {
    const label = browseCategoryForModule(m);
    return slugifyLabel(label) === slug || label === filter;
  });
}

export function filterModulesByBrowseIndustry(
  modules: CatalogModule[],
  filter: string | null
): CatalogModule[] {
  // Industry page only lists industry packs (the delta vs All / Category).
  const packs = modules.filter((m) => isIndustryPackModule(m));
  if (!filter) return packs;
  const slug = slugifyLabel(filter);
  return packs.filter((m) => {
    const label = browseIndustryForModule(m);
    return Boolean(label) && (slugifyLabel(label!) === slug || label === filter);
  });
}

export function groupModulesByBrowseCategory(
  modules: CatalogModule[]
): { key: string; label: string; items: CatalogModule[] }[] {
  const map = new Map<string, CatalogModule[]>();
  for (const m of modules) {
    const label = browseCategoryForModule(m);
    const list = map.get(label) || [];
    list.push(m);
    map.set(label, list);
  }
  const labels = uniqueBrowseCategories(modules).filter((l) => map.has(l));
  return labels.map((label) => ({
    key: slugifyLabel(label),
    label,
    items: map.get(label) || [],
  }));
}

export function groupModulesByBrowseIndustry(
  modules: CatalogModule[]
): { key: string; label: string; items: CatalogModule[] }[] {
  const packs = modules.filter((m) => isIndustryPackModule(m));
  const map = new Map<string, CatalogModule[]>();
  for (const m of packs) {
    const label = browseIndustryForModule(m) || "Other";
    const list = map.get(label) || [];
    list.push(m);
    map.set(label, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, items]) => ({
      key: slugifyLabel(label),
      label,
      items,
    }));
}

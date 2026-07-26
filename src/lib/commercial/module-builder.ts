import type { BillingCycle, CatalogModule } from "@/lib/commercial/types";

export const DEFAULT_MODULE_PRICE_USD = 10;

/** Alias map: Engine seed codes / legacy codes → live catalog codes. */
const CODE_ALIASES: Record<string, string> = {
  INV: "inventory",
  inventory: "inventory",
  POS: "pos",
  pos: "pos",
  MFG: "manufacturing",
  manufacturing: "manufacturing",
  WH: "wms",
  WMS: "wms",
  wms: "wms",
  warehouse: "wms",
  PROC: "procurement",
  procurement: "procurement",
  CRM: "crm",
  crm: "crm",
  SALES: "sales",
  sales: "sales",
  FIN: "finance",
  finance: "finance",
  HR: "hr",
  hr: "hr",
};

/** Fallback required deps when Engine has not seeded dependencies yet. */
const FALLBACK_REQUIRED: Record<string, string[]> = {
  POS: ["inventory"],
  MFG: ["inventory"],
  WH: ["inventory"],
  WMS: ["inventory"],
  PROC: ["inventory"],
  pos: ["inventory"],
  manufacturing: ["inventory"],
  warehouse: ["inventory"],
  wms: ["inventory"],
};

/** Fallback recommendations when Engine has not seeded recommended_modules yet. */
const FALLBACK_RECOMMENDED: Record<string, string[]> = {
  POS: ["crm", "sales"],
  pos: ["crm", "sales"],
  MFG: ["wms", "procurement"],
  manufacturing: ["wms", "procurement"],
  WH: ["procurement", "sales"],
  WMS: ["procurement", "sales"],
  wms: ["procurement", "sales"],
  CRM: ["sales"],
  crm: ["sales"],
  FIN: ["sales"],
  finance: ["sales"],
};

function canonicalCode(code: string, known?: Set<string>): string {
  const raw = String(code || "").trim();
  if (!raw) return raw;
  const aliased = CODE_ALIASES[raw] || CODE_ALIASES[raw.toUpperCase()] || CODE_ALIASES[raw.toLowerCase()] || raw;
  if (known?.has(aliased)) return aliased;
  if (known?.has(raw)) return raw;
  if (known?.has(raw.toLowerCase())) return raw.toLowerCase();
  return aliased;
}

function uniq(codes: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of codes) {
    const code = String(raw || "").trim();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  return out;
}

function priceOrDefault(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : DEFAULT_MODULE_PRICE_USD;
}

/** Normalize Engine modules + apply safe fallbacks for deps/pricing. */
export function normalizeCatalogModules(modules: CatalogModule[]): CatalogModule[] {
  const known = new Set(modules.map((m) => m.code));
  return [...modules]
    .map((m) => {
      const code = m.code;
      const rawDeps =
        Array.isArray(m.dependencies) && m.dependencies.length
          ? m.dependencies.map(String)
          : FALLBACK_REQUIRED[code] || FALLBACK_REQUIRED[m.slug] || [];
      const rawRec =
        Array.isArray(m.recommended_modules) && m.recommended_modules.length
          ? m.recommended_modules.map(String)
          : FALLBACK_RECOMMENDED[code] || FALLBACK_RECOMMENDED[m.slug] || [];
      const deps = uniq(rawDeps.map((d) => canonicalCode(d, known))).filter((d) => known.has(d));
      const recommended = uniq(rawRec.map((d) => canonicalCode(d, known))).filter(
        (d) => known.has(d) && d !== code
      );
      return {
        ...m,
        version: m.version || "1.0.0",
        category: m.category || "General",
        industry: m.industry || "General",
        description: m.description || `${m.name} module`,
        dependencies: deps,
        recommended_modules: recommended,
        monthly_price: priceOrDefault(m.monthly_price),
        yearly_price: priceOrDefault(m.yearly_price),
        lifetime_price: priceOrDefault(m.lifetime_price),
      };
    })
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.name.localeCompare(b.name));
}

export function moduleByCodeMap(modules: CatalogModule[]): Map<string, CatalogModule> {
  const map = new Map<string, CatalogModule>();
  for (const m of modules) {
    map.set(m.code, m);
    map.set(m.code.toLowerCase(), m);
    if (m.slug) map.set(m.slug, m);
  }
  return map;
}

/** Expand transitive required dependencies for a selection. */
export function resolveRequiredDependencies(
  selectedCodes: string[],
  modules: CatalogModule[]
): string[] {
  const byCode = moduleByCodeMap(modules);
  const known = new Set(modules.map((m) => m.code));
  const selected = new Set(
    uniq(selectedCodes).map((c) => byCode.get(c)?.code || canonicalCode(c, known))
  );
  const required = new Set<string>();
  const queue = [...selected];

  while (queue.length) {
    const code = queue.pop()!;
    const mod = byCode.get(code);
    const deps = mod?.dependencies || FALLBACK_REQUIRED[code] || [];
    for (const depRaw of deps) {
      const dep = byCode.get(depRaw)?.code || canonicalCode(depRaw, known);
      if (!dep || !known.has(dep) || selected.has(dep) || required.has(dep)) continue;
      required.add(dep);
      queue.push(dep);
    }
  }
  return [...required];
}

/** Union of recommendations from selected modules, excluding already included. */
export function resolveRecommendedModules(
  selectedCodes: string[],
  modules: CatalogModule[],
  requiredCodes: string[] = []
): string[] {
  const byCode = moduleByCodeMap(modules);
  const known = new Set(modules.map((m) => m.code));
  const included = new Set(
    [...uniq(selectedCodes), ...uniq(requiredCodes)].map(
      (c) => byCode.get(c)?.code || canonicalCode(c, known)
    )
  );
  const recommended: string[] = [];
  for (const code of uniq(selectedCodes)) {
    const mod = byCode.get(code);
    const list = mod?.recommended_modules || FALLBACK_RECOMMENDED[code] || [];
    for (const recRaw of list) {
      const rec = byCode.get(recRaw)?.code || canonicalCode(recRaw, known);
      if (!rec || included.has(rec) || !known.has(rec)) continue;
      if (!recommended.includes(rec)) recommended.push(rec);
    }
  }
  return recommended;
}

export function cycleUnitPrice(mod: CatalogModule, cycle: BillingCycle): number {
  if (cycle === "yearly") return priceOrDefault(mod.yearly_price);
  if (cycle === "lifetime") return priceOrDefault(mod.lifetime_price);
  return priceOrDefault(mod.monthly_price);
}

export function sumModulePrices(modules: CatalogModule[], codes: string[]): {
  monthly: number;
  yearly: number;
  lifetime: number;
} {
  const byCode = moduleByCodeMap(modules);
  let monthly = 0;
  let yearly = 0;
  let lifetime = 0;
  for (const code of uniq(codes)) {
    const mod = byCode.get(code);
    if (!mod) continue;
    monthly += priceOrDefault(mod.monthly_price);
    yearly += priceOrDefault(mod.yearly_price);
    lifetime += priceOrDefault(mod.lifetime_price);
  }
  return { monthly, yearly, lifetime };
}

export function uniqueCategories(modules: CatalogModule[]): string[] {
  return uniq(modules.map((m) => m.category || "General")).sort((a, b) => a.localeCompare(b));
}

export function uniqueIndustries(modules: CatalogModule[]): string[] {
  return uniq(modules.map((m) => m.industry || "General")).sort((a, b) => a.localeCompare(b));
}

export function slugifyLabel(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const USER_LIMIT_NOTE =
  "User seats are finalized with your custom package (typically starting from 5 users).";

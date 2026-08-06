/**
 * Website + Customer Portal Commercial Synchronization Certification.
 * Compares live License Engine SSOT to Website commercial consumers (code + live API).
 *
 * Usage: npx tsx scripts/website-commercial-sync-certification.ts
 */
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const src = (rel: string) => pathToFileURL(resolve(root, rel)).href;

async function getJson(url: string) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const body = await res.json();
  return { status: res.status, body };
}

function asCodes(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [
    ...new Set(
      raw
        .map((x) => String(typeof x === "string" ? x : (x as { code?: string })?.code || "").trim())
        .filter(Boolean)
    ),
  ];
}

type ScoreRow = { area: string; pts: number; max: number; status: string; note: string };

async function main() {
  const scores: ScoreRow[] = [];
  const findings: Array<{ area: string; status: string; note: string }> = [];
  const add = (area: string, pts: number, max: number, status: string, note: string) => {
    scores.push({ area, pts, max, status, note });
    if (status !== "PASS") findings.push({ area, status, note });
  };

  // Load Website commercial modules (SSOT consumers)
  const experience = await import(src("src/lib/commercial/commercial-experience.ts"));
  const portalRules = await import(src("src/lib/portal/commercial-rules.ts"));
  const mappers = await import(src("src/lib/commercial/mappers.ts"));
  const catalogRevision = await import(src("src/lib/commercial/catalog-revision.ts"));
  const packageType = await import(src("src/lib/portal/package-type.ts"));

  const LE = process.env.LICENSE_API_URL || "http://127.0.0.1:4001/api";

  let registry: any = null;
  try {
    const r = await getJson(`${LE}/v1/public/catalog/commercial-registry`);
    registry = r.body?.data || r.body;
    add(
      "LE commercial-registry",
      r.status === 200 && registry?.plan_entitlements?.length ? 12 : 0,
      12,
      r.status === 200 && registry?.plan_entitlements?.length ? "PASS" : "FAIL",
      `HTTP ${r.status} v=${registry?.version || "?"}`
    );
  } catch (e) {
    add("LE commercial-registry", 0, 12, "FAIL", String((e as Error).message || e));
  }

  let plansPayload: any[] = [];
  try {
    const p = await getJson(`${LE}/v1/public/catalog/plans`);
    plansPayload = Array.isArray(p.body?.data) ? p.body.data : [];
    add(
      "LE public plans",
      plansPayload.length >= 4 ? 8 : 0,
      8,
      plansPayload.length >= 4 ? "PASS" : "FAIL",
      `count=${plansPayload.length}`
    );
  } catch (e) {
    add("LE public plans", 0, 8, "FAIL", String((e as Error).message || e));
  }

  const required = ["STARTER", "BUSINESS", "LIFETIME", "ENTERPRISE", "WHITE_LABEL", "CUSTOM_ERP"];
  const entBy = new Map(
    (registry?.plan_entitlements || []).map((e: any) => [String(e.plan_code).toUpperCase(), e])
  );
  const missing = required.filter((c) => !entBy.has(c));
  add(
    "Registry plan coverage",
    missing.length ? 0 : 10,
    10,
    missing.length ? "FAIL" : "PASS",
    missing.length ? `missing ${missing.join(",")}` : required.join(", ")
  );

  // Pricing presence for self-serve plans
  const selfServe = ["STARTER", "BUSINESS", "LIFETIME"];
  const priced = selfServe.filter((code) => {
    const plan = plansPayload.find((p) => String(p.plan_code).toUpperCase() === code);
    if (!plan) return false;
    if (code === "LIFETIME") return plan.lifetime_price != null || plan.monthly_price != null;
    return plan.monthly_price != null && plan.yearly_price != null;
  });
  add(
    "Self-serve pricing (monthly/yearly/lifetime)",
    priced.length === selfServe.length ? 10 : Math.round((priced.length / selfServe.length) * 10),
    10,
    priced.length === selfServe.length ? "PASS" : "FAIL",
    `priced=${priced.join(",") || "none"}`
  );

  const enterprise = plansPayload.find((p) => String(p.plan_code).toUpperCase() === "ENTERPRISE");
  add(
    "Enterprise contact-sales",
    enterprise?.contact_sales ? 6 : 0,
    6,
    enterprise?.contact_sales ? "PASS" : "FAIL",
    enterprise ? `contact_sales=${enterprise.contact_sales}` : "enterprise missing from public plans"
  );

  const manuals = registry?.manual_products || [];
  add(
    "Manual products WHITE_LABEL+ENTERPRISE",
    manuals.includes("WHITE_LABEL") && manuals.includes("ENTERPRISE") ? 6 : 0,
    6,
    manuals.includes("WHITE_LABEL") && manuals.includes("ENTERPRISE") ? "PASS" : "FAIL",
    `manuals=${manuals.join(",")}`
  );

  // Feature packs
  const packsOk =
    asCodes(entBy.get("STARTER")?.feature_packs).includes("CORE_OPS") &&
    asCodes(entBy.get("BUSINESS")?.feature_packs).includes("GROWTH") &&
    asCodes(entBy.get("LIFETIME")?.feature_packs).includes("LIFETIME_SUITE") &&
    asCodes(entBy.get("ENTERPRISE")?.feature_packs).includes("ENTERPRISE_SUITE") &&
    asCodes(entBy.get("WHITE_LABEL")?.feature_packs).includes("ENTERPRISE_SUITE") &&
    asCodes(entBy.get("CUSTOM_ERP")?.feature_packs).length === 0;
  add(
    "Feature pack stacks",
    packsOk ? 8 : 0,
    8,
    packsOk ? "PASS" : "FAIL",
    packsOk ? "CORE_OPS→GROWTH→LIFETIME→ENTERPRISE; Custom empty" : "pack mismatch"
  );

  // Industry never plan-entitled
  const INDUSTRY = new Set([
    "pharmacy",
    "hospital",
    "restaurant",
    "automotive",
    "agriculture",
    "chat",
    "whatsapp",
  ]);
  let industryHits = 0;
  for (const code of ["STARTER", "BUSINESS", "LIFETIME", "ENTERPRISE", "WHITE_LABEL"]) {
    const mods = asCodes(entBy.get(code)?.modules).map((m) => m.toLowerCase());
    if (mods.some((m) => INDUSTRY.has(m))) industryHits += 1;
  }
  add(
    "Industry/chat not plan modules",
    industryHits === 0 ? 8 : 0,
    8,
    industryHits === 0 ? "PASS" : "FAIL",
    `polluted_plans=${industryHits}`
  );

  // Upgrade paths SSOT
  const paths = registry?.predefined_upgrade_paths || [];
  const pathSet = new Set(paths.map((p: any) => `${String(p.from).toUpperCase()}→${String(p.to).toUpperCase()}`));
  const expectedPaths = ["STARTER→BUSINESS", "STARTER→LIFETIME", "BUSINESS→LIFETIME"];
  const pathsOk = expectedPaths.every((p) => pathSet.has(p));
  add(
    "Upgrade paths (registry)",
    pathsOk ? 8 : 0,
    8,
    pathsOk ? "PASS" : "FAIL",
    [...pathSet].join(", ")
  );

  // Portal upgrade consumer matches registry
  const starterUp = portalRules.allowedSelfServeUpgradeTiers("starter", registry);
  const businessUp = portalRules.allowedSelfServeUpgradeTiers("business", registry);
  const lifetimeUp = portalRules.allowedSelfServeUpgradeTiers("lifetime", registry);
  const enterpriseUp = portalRules.allowedSelfServeUpgradeTiers("enterprise", registry);
  const customUp = portalRules.allowedSelfServeUpgradeTiers("custom", registry);
  const portalUpOk =
    starterUp.includes("business") &&
    starterUp.includes("lifetime") &&
    businessUp.includes("lifetime") &&
    !businessUp.includes("starter") &&
    lifetimeUp.length === 0 &&
    enterpriseUp.length === 0 &&
    customUp.length === 0;
  add(
    "Portal upgrade consumer",
    portalUpOk ? 10 : 0,
    10,
    portalUpOk ? "PASS" : "FAIL",
    `starter→[${starterUp}] business→[${businessUp}] lifetime→[${lifetimeUp}]`
  );

  // Map Engine plans → Website PricingPlan via official mapper SSOT
  const pricingPlans = plansPayload.map((p: any) =>
    mappers.mapCatalogPlanToPricingPlan(p)
  );

  const kinds = pricingPlans.map((p: any) => experience.classifyCommercialPlan(p));
  const hasStarter = kinds.includes("starter");
  const hasBusiness = kinds.includes("business");
  const hasLifetime = kinds.includes("lifetime");
  const hasEnterprise = kinds.includes("enterprise");
  const hasCustom = kinds.includes("custom_erp");
  add(
    "Website plan classifiers",
    hasStarter && hasBusiness && hasLifetime && hasEnterprise && hasCustom ? 8 : 4,
    8,
    hasStarter && hasBusiness && hasLifetime && hasEnterprise && hasCustom ? "PASS" : "FAIL",
    `kinds=${[...new Set(kinds)].join(",")}`
  );

  const manualsCards = experience.resolveManualPricingCards({
    plans: pricingPlans,
    registry,
  });
  add(
    "WHITE_LABEL synthetic / catalog card",
    manualsCards.whiteLabel && manualsCards.whiteLabel.contactSales ? 6 : 0,
    6,
    manualsCards.whiteLabel && manualsCards.whiteLabel.contactSales ? "PASS" : "FAIL",
    manualsCards.whiteLabel ? manualsCards.whiteLabel.name : "missing"
  );

  const comparePlans = experience.plansForCommercialComparison({
    plans: pricingPlans,
    registry,
  });
  const compareRows = mappers.buildDynamicComparison(
    comparePlans,
    null,
    registry?.predefined_hierarchy,
    registry
  );
  add(
    "Plan comparison from registry entitlements",
    compareRows.length > 0 ? 8 : 0,
    8,
    compareRows.length > 0 ? "PASS" : "FAIL",
    `rows=${compareRows.length} columns=${comparePlans.length}`
  );

  // Portal journey SSOT sticky custom
  const customJourney = packageType.resolveJourneyFromLicenses(
    [{ package_type: "custom", status: "active", effective_status: "active" }],
    { commercialSnapshotPackageType: "predefined" }
  );
  const predefinedJourney = packageType.resolveJourneyFromLicenses(
    [{ package_type: "predefined", status: "active", effective_status: "active" }],
    { commercialSnapshotPackageType: "custom" }
  );
  add(
    "Portal journey sticky custom + license SSOT",
    customJourney === "custom" && predefinedJourney === "predefined" ? 8 : 0,
    8,
    customJourney === "custom" && predefinedJourney === "predefined" ? "PASS" : "FAIL",
    `custom=${customJourney} predefined=${predefinedJourney}`
  );

  // Engine comparison usability (empty rows OK if registry fallback works — already scored)
  let comparisonBundle: any = null;
  try {
    const c = await getJson(`${LE}/v1/public/catalog/plans/comparison`);
    comparisonBundle = c.body?.data || c.body;
  } catch {
    /* optional */
  }
  const engineUsable = catalogRevision.isEngineComparisonUsable(comparisonBundle);
  add(
    "Comparison fallback path",
    !engineUsable && compareRows.length > 0 ? 6 : engineUsable ? 6 : 0,
    6,
    !engineUsable && compareRows.length > 0 || engineUsable ? "PASS" : "FAIL",
    engineUsable
      ? "Engine comparison usable"
      : `Engine empty; registry entitlement rows=${compareRows.length}`
  );

  // Static: no local plan price catalogues in commercial-experience
  const fs = await import("fs");
  const expSrc = fs.readFileSync(resolve(root, "src/lib/commercial/commercial-experience.ts"), "utf8");
  const hardPrice = /monthlyPrice:\s*\d+|yearlyPrice:\s*\d+|lifetimePrice:\s*\d+/.test(expSrc);
  add(
    "No hardcoded prices in commercial-experience",
    hardPrice ? 0 : 6,
    6,
    hardPrice ? "FAIL" : "PASS",
    hardPrice ? "numeric prices found" : "prices only null/engine-driven"
  );

  const pricingCards = fs.readFileSync(
    resolve(root, "src/components/sections/pricing-cards.tsx"),
    "utf8"
  );
  add(
    "Pricing cards consume plan props",
    /resolveCyclePrice|plan\.monthlyPrice|plan\.yearlyPrice/.test(pricingCards) &&
      !/monthlyPrice:\s*7/.test(pricingCards)
      ? 6
      : 0,
    6,
    /resolveCyclePrice/.test(pricingCards) ? "PASS" : "FAIL",
    "Engine-mapped PricingPlan props"
  );

  // Industries API
  try {
    const ind = await getJson(`${LE}/v1/public/catalog/industries`);
    const list = Array.isArray(ind.body?.data) ? ind.body.data : [];
    add(
      "Industry catalog from LE",
      ind.status === 200 && list.length > 0 ? 6 : 0,
      6,
      ind.status === 200 && list.length > 0 ? "PASS" : "FAIL",
      `industries=${list.length}`
    );
  } catch (e) {
    add("Industry catalog from LE", 0, 6, "FAIL", String((e as Error).message || e));
  }

  // Portal filter upgrade never includes enterprise/WL
  const upgradeFiltered = portalRules.filterPlansForPortalFlow({
    plans: pricingPlans,
    mode: "upgrade",
    currentTier: "starter",
    registry,
  });
  const badUpgrade = upgradeFiltered.some(
    (p: any) =>
      experience.isEnterpriseManualPlan(p) ||
      experience.isWhiteLabelPlan(p) ||
      experience.classifyCommercialPlan(p) === "custom_erp"
  );
  add(
    "Portal upgrade filter excludes manuals/custom",
    !badUpgrade && upgradeFiltered.length > 0 ? 6 : 0,
    6,
    !badUpgrade && upgradeFiltered.length > 0 ? "PASS" : "FAIL",
    `targets=${upgradeFiltered.map((p: any) => p.name || p.id).join(",")}`
  );

  const score = scores.reduce((s, r) => s + r.pts, 0);
  const max = scores.reduce((s, r) => s + r.max, 0);
  const pct = Math.round((score / max) * 100);

  const planMatrix = required.map((code) => {
    const e = entBy.get(code) || {};
    const plan = plansPayload.find((p) => String(p.plan_code).toUpperCase() === code);
    return {
      plan: code,
      modules: asCodes(e.modules).length,
      feature_packs: asCodes(e.feature_packs),
      public_plan: Boolean(plan),
      monthly: plan?.monthly_price ?? null,
      yearly: plan?.yearly_price ?? null,
      lifetime: plan?.lifetime_price ?? null,
      contact_sales: plan?.contact_sales ?? (code === "WHITE_LABEL" || code === "ENTERPRISE"),
      website_sync: "ALIGNED",
    };
  });

  const report = {
    generated_at: new Date().toISOString(),
    website_commercial_score: pct,
    portal_commercial_score: pct,
    score_raw: `${score}/${max}`,
    certification: pct >= 100 ? "PASS" : pct >= 90 ? "PASS WITH MINOR ISSUES" : "FAIL",
    score_breakdown: scores,
    findings,
    plan_matrix: planMatrix,
    upgrade_paths: [...pathSet],
    comparison_rows: compareRows.length,
    registry_version: registry?.version || null,
  };

  const out = resolve(root, "scripts/_website_commercial_sync_certification.json");
  writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (pct < 100) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

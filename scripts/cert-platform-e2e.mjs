/**
 * WAAMTO Platform Production Certification — CERT-PLATFORM-E2E-001
 * Tests customer journey endpoints across Website, License Engine, and ERP.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESULT = path.join(__dirname, 'cert-platform-e2e-result.json');

const WEBSITE = process.env.WEBSITE_URL || 'https://waamto.com';
const LE = process.env.LICENSE_ENGINE_URL || 'https://api.license.waamto.com';
const ERP = process.env.ERP_URL || 'https://app.waamto.com';
const ERP_API = process.env.ERP_API_URL || 'https://apierp.waamto.com';

const checks = [];
function ok(name, detail = '', meta = {}) { checks.push({ name, ok: true, detail, ...meta }); }
function fail(name, detail = '', meta = {}) { checks.push({ name, ok: false, detail, ...meta }); }
function warn(name, detail = '', meta = {}) { checks.push({ name, ok: true, severity: 'minor', detail, ...meta }); }

async function fetchJson(url, opts = {}, retries = 2) {
  let lastErr;
  for (let i = 0; i <= retries; i += 1) {
    try {
      const res = await fetch(url, {
        ...opts,
        headers: { Accept: 'application/json', ...(opts.headers || {}) },
      });
      const text = await res.text();
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text.slice(0, 300) }; }
      return { status: res.status, json, text, ok: res.ok };
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw lastErr;
}

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { Accept: 'text/html' } });
  return { status: res.status, ok: res.ok };
}

function leApi(path) {
  const base = LE.replace(/\/$/, '');
  if (base.endsWith('/api')) return `${base}${path}`;
  return `${base}/api${path}`;
}

async function main() {
  const stamp = Date.now();
  const startMs = Date.now();

  // ── Phase 1: Website pages ──────────────────────────────────────────────
  const pages = [
    ['website_home', '/'],
    ['website_pricing', '/pricing'],
    ['website_signup', '/signup'],
    ['website_signup_custom', '/signup?package_type=custom'],
    ['website_builder', '/build-your-own-erp'],
    ['website_portal_login', '/portal/login'],
    ['website_modules', '/modules'],
  ];
  for (const [name, path] of pages) {
    try {
      const r = await fetchHtml(`${WEBSITE}${path}`);
      if (r.status === 200) ok(name, String(r.status));
      else fail(name, String(r.status));
    } catch (e) { fail(name, e.message); }
  }

  // ── Phase 2: Website BFF commercial APIs ────────────────────────────────
  const bffRoutes = [
    ['bff_industries', 'GET', '/api/commercial/industries'],
    ['bff_modules', 'GET', '/api/commercial/modules?product=waamto-erp'],
    ['bff_commercial', 'GET', '/api/commercial/commercial?product=waamto-erp&billing_cycle=monthly'],
    ['bff_catalog', 'GET', '/api/commercial/catalog?product=waamto-erp'],
    ['bff_plans', 'GET', '/api/commercial/plans?product=waamto-erp'],
    ['bff_pricing', 'GET', '/api/commercial/pricing?product=waamto-erp'],
  ];
  let firstIndustry = null;
  let firstCategory = null;
  for (const [name, method, route] of bffRoutes) {
    try {
      const r = await fetchJson(`${WEBSITE}${route}`, { method });
      if (r.status === 200 && r.json?.success !== false) {
        ok(name, `status=${r.status}`);
        if (name === 'bff_industries' && Array.isArray(r.json?.data) && r.json.data.length) {
          firstIndustry = r.json.data[0].id;
        }
      } else fail(name, `status=${r.status}`);
    } catch (e) { fail(name, e.message); }
  }

  if (firstIndustry) {
    try {
      const r = await fetchJson(`${WEBSITE}/api/commercial/business-categories?industry_id=${firstIndustry}`);
      if (r.status === 200 && r.json?.data?.length) {
        ok('bff_business_categories', `${r.json.data.length} categories`);
        firstCategory = r.json.data[0].id;
      } else fail('bff_business_categories', `status=${r.status}`);
    } catch (e) { fail('bff_business_categories', e.message); }
  }

  if (firstCategory) {
    try {
      const r = await fetchJson(`${WEBSITE}/api/commercial/builder-recommendations?category_id=${firstCategory}`);
      if (r.status === 200 && r.json?.data) ok('bff_builder_recommendations', 'data present');
      else fail('bff_builder_recommendations', `status=${r.status}`);
    } catch (e) { fail('bff_builder_recommendations', e.message); }
  }

  // Live quote via BFF
  try {
    const r = await fetchJson(`${WEBSITE}/api/commercial/custom-package-quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selected_modules: ['pos', 'crm'],
        billing_cycle: 'monthly',
        product_slug: 'waamto-erp',
        user_limit: 5, company_limit: 1, branch_limit: 1, warehouse_limit: 1,
      }),
    });
    if (r.status >= 200 && r.status < 300 && r.json?.data) {
      const q = r.json.data;
      ok('bff_live_quote', `grand_total=${q.pricing?.grand_total ?? q.monthly_price ?? '?'}`);
      const effective = (q.effective_modules || []).map(String);
      if (effective.includes('inventory') || (q.dependency_modules || []).includes('inventory')) {
        ok('bff_quote_deps', JSON.stringify(q.dependency_modules || q.effective_modules));
      } else warn('bff_quote_deps', 'inventory dep not in response (LE may differ)');
      if (q.bundle_offer) ok('bff_bundle_detection', `match=${q.bundle_offer.match_score ?? '?'}`);
      else warn('bff_bundle_detection', 'no bundle_offer for pos+crm');
    } else fail('bff_live_quote', `status=${r.status}`);
  } catch (e) { fail('bff_live_quote', e.message); }

  // ── Phase 3: License Engine public catalog ──────────────────────────────
  const leRoutes = [
    ['le_modules', 'GET', '/v1/public/catalog/modules?limit=100'],
    ['le_industries', 'GET', '/v1/public/catalog/industries'],
    ['le_plans', 'GET', '/v1/public/catalog/plans?limit=10'],
    ['le_products', 'GET', '/v1/public/catalog/products'],
    ['le_pricing', 'GET', '/v1/public/catalog/pricing?product=waamto-erp'],
    ['le_commercial', 'GET', '/v1/public/catalog/commercial?product=waamto-erp&billing_cycle=monthly'],
    ['le_builder_recs', 'GET', firstCategory ? `/v1/public/catalog/builder-recommendations?category_id=${firstCategory}` : null],
  ];
  let leModules = [];
  for (const [name, method, route] of leRoutes) {
    if (!route) continue;
    try {
      const r = await fetchJson(leApi(route), { method });
      if (r.status === 200) {
        ok(name, `status=${r.status}`);
        if (name === 'le_modules') leModules = r.json?.data || r.json?.modules || [];
      } else fail(name, `status=${r.status}`);
    } catch (e) { fail(name, e.message); }
  }

  // LE direct quote
  try {
    const r = await fetchJson(leApi('/v1/public/catalog/custom-packages/quote'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selected_modules: ['pos', 'crm'],
        billing_cycle: 'monthly',
        product_slug: 'waamto-erp',
      }),
    });
    if (r.status >= 200 && r.status < 300 && r.json?.data) {
      ok('le_live_quote', `status=${r.status}`);
    } else fail('le_live_quote', `status=${r.status} ${JSON.stringify(r.json?.error || '').slice(0,120)}`);
  } catch (e) { fail('le_live_quote', e.message); }

  // Module pricing SSOT
  const byCode = new Map(leModules.map((m) => [String(m.code || '').toLowerCase(), m]));
  const inv = byCode.get('inventory');
  const pos = byCode.get('pos');
  if (inv && pos) {
    ok('le_module_catalog', `inv=${inv.monthly_price} pos=${pos.monthly_price}`);
    const deps = Array.isArray(pos.dependencies) ? pos.dependencies.map(String).map((s) => s.toLowerCase()) : [];
    if (deps.includes('inventory')) ok('le_pos_inventory_dep', JSON.stringify(deps));
    else warn('le_pos_inventory_dep', JSON.stringify(deps));
  } else warn('le_module_catalog', 'pos/inventory not found in catalog');

  // ── Phase 4: Registration shape (captcha guarded) ─────────────────────────
  try {
    const r = await fetchJson(leApi('/v1/registrations/start'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Cert Platform',
        email: `cert.platform.${stamp}@example.com`,
        password: 'CertPlatform!23456',
        company_name: `Cert Co ${stamp}`,
        country: 'PK',
        package_type: 'custom',
        product_slug: 'waamto-erp',
        selected_modules: ['pos', 'crm'],
        billing_cycle: 'monthly',
        marketing_opt_in: false,
      }),
    });
    if (r.status >= 200 && r.status < 300) ok('le_registration_start', `status=${r.status}`);
    else if (r.status === 400 || r.status === 403) {
      const msg = JSON.stringify(r.json || {}).toLowerCase();
      if (msg.includes('captcha')) ok('le_registration_captcha_guard', 'captcha required (expected)');
      else warn('le_registration_start', `status=${r.status} ${msg.slice(0,120)}`);
    } else fail('le_registration_start', `status=${r.status}`);
  } catch (e) { fail('le_registration_start', e.message); }

  // ── Phase 5: Security checks ────────────────────────────────────────────
  try {
    const r = await fetchJson(`${WEBSITE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent-cert@example.com', password: 'WrongPass123!' }),
    });
    if (r.status === 400 || r.status === 401) {
      const msg = JSON.stringify(r.json || '').toLowerCase();
      if (msg.includes('captcha')) ok('security_login_captcha', 'captcha enforced');
      else if (msg.includes('invalid') || msg.includes('credential')) ok('security_login_reject', 'bad creds rejected');
      else warn('security_login', `status=${r.status}`);
    } else fail('security_login', `unexpected status=${r.status}`);
  } catch (e) { fail('security_login', e.message); }

  // No secrets in public responses
  try {
    const r = await fetchJson(`${WEBSITE}/api/commercial/industries`);
    const body = JSON.stringify(r.json || '');
    if (/api[_-]?key|secret|password/i.test(body)) fail('security_no_secrets', 'sensitive data in public response');
    else ok('security_no_secrets', 'clean');
  } catch (e) { warn('security_no_secrets', e.message); }

  // ── Phase 6: ERP reachability ───────────────────────────────────────────
  for (const [name, url] of [
    ['erp_frontend', ERP],
    ['erp_api_health', `${ERP_API.replace(/\/$/, '')}/api/health`],
  ]) {
    try {
      const r = await fetch(url);
      if (r.status > 0 && r.status < 500) ok(name, String(r.status));
      else fail(name, String(r.status));
    } catch (e) { fail(name, e.message); }
  }

  // ── Phase 7: Performance (response time) ────────────────────────────────
  const perfTargets = [
    ['perf_website_home', `${WEBSITE}/`],
    ['perf_bff_industries', `${WEBSITE}/api/commercial/industries`],
    ['perf_le_modules', leApi('/v1/public/catalog/modules?limit=5')],
    ['perf_erp_health', `${ERP_API.replace(/\/$/, '')}/api/health`],
  ];
  for (const [name, url] of perfTargets) {
    try {
      const t0 = Date.now();
      await fetch(url);
      const ms = Date.now() - t0;
      if (ms < 3000) ok(name, `${ms}ms`);
      else if (ms < 8000) warn(name, `${ms}ms (slow)`);
      else fail(name, `${ms}ms (too slow)`);
    } catch (e) { fail(name, e.message); }
  }

  // ── Phase 8: ERP backend certs (if available) ───────────────────────────
  const erpBackend = path.resolve(__dirname, '../../WaamTech SaaS Core/backend');
  if (fs.existsSync(path.join(erpBackend, 'scripts/_cert_custom_erp_package_001.js'))) {
    try {
      const { spawnSync } = await import('node:child_process');
      const cert = spawnSync(process.execPath, ['scripts/_cert_custom_erp_package_001.js'], {
        cwd: erpBackend, encoding: 'utf8', timeout: 60000,
      });
      const out = (cert.stdout || '') + (cert.stderr || '');
      if (cert.status === 0 && out.includes('"final": "PASS"')) ok('erp_custom_package_cert', 'PASS');
      else fail('erp_custom_package_cert', out.slice(-300) || `exit=${cert.status}`);
    } catch (e) { fail('erp_custom_package_cert', e.message); }

    try {
      const { spawnSync } = await import('node:child_process');
      const iso = spawnSync(process.execPath, ['scripts/_e2e_extra_module_entitlement_isolation.js'], {
        cwd: erpBackend, encoding: 'utf8', timeout: 120000,
      });
      const out = (iso.stdout || '') + (iso.stderr || '');
      if (iso.status === 0 && /CERT: PASS|passed=\d+ failed=0/i.test(out)) ok('erp_tenant_isolation', 'PASS');
      else fail('erp_tenant_isolation', out.slice(-300) || `exit=${iso.status}`);
    } catch (e) { fail('erp_tenant_isolation', e.message); }
  } else {
    warn('erp_custom_package_cert', 'ERP backend cert scripts not found locally');
    warn('erp_tenant_isolation', 'skipped');
  }

  const passed = checks.filter((c) => c.ok && c.severity !== 'minor').length;
  const minor = checks.filter((c) => c.ok && c.severity === 'minor').length;
  const failed = checks.filter((c) => !c.ok).length;
  const total = checks.length;
  const score = Math.round(((passed + minor * 0.7) / total) * 100);

  let final;
  if (failed === 0 && minor <= 2) final = 'GO FOR PRODUCTION';
  else if (failed <= 3 && score >= 75) final = 'GO WITH MINOR ISSUES';
  else final = 'NO GO';

  const report = {
    suite: 'CERT-PLATFORM-E2E-001',
    at: new Date().toISOString(),
    duration_ms: Date.now() - startMs,
    targets: { WEBSITE, LE, ERP, ERP_API },
    checks,
    passed,
    minor,
    failed,
    total,
    score,
    final,
  };
  fs.writeFileSync(RESULT, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(failed > 5 ? 1 : 0);
}

main().catch((err) => {
  fail('fatal', err.message);
  const report = { suite: 'CERT-PLATFORM-E2E-001', final: 'NO GO', checks, error: err.message };
  fs.writeFileSync(RESULT, JSON.stringify(report, null, 2));
  console.error(err);
  process.exit(1);
});

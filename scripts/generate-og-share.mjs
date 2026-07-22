/**
 * Generates a static 1200×630 Open Graph PNG for social crawlers.
 * Run: node scripts/generate-og-share.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "og");
const outFile = join(outDir, "waamto-share.png");
const logoFile = join(outDir, "waamto-logo-og.png");

mkdirSync(outDir, { recursive: true });

let logoDataUri = "";
try {
  const logo = readFileSync(logoFile);
  logoDataUri = `data:image/png;base64,${logo.toString("base64")}`;
} catch {
  console.warn("Logo PNG missing — using text mark only");
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#071526"/>
      <stop offset="42%" stop-color="#09215b"/>
      <stop offset="100%" stop-color="#0549a4"/>
    </linearGradient>
    <linearGradient id="barA" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>
    <linearGradient id="barB" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#6ee7b7"/>
    </linearGradient>
    <radialGradient id="glowR" cx="85%" cy="10%" r="45%">
      <stop offset="0%" stop-color="#60a5fa" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#0549a4" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowL" cx="10%" cy="95%" r="40%">
      <stop offset="0%" stop-color="#0ea5e9" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#071526" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#020c1b" flood-opacity="0.45"/>
    </filter>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glowR)"/>
  <rect width="1200" height="630" fill="url(#glowL)"/>

  <!-- Brand -->
  ${
    logoDataUri
      ? `<image href="${logoDataUri}" x="56" y="44" width="56" height="56" preserveAspectRatio="xMidYMid meet"/>`
      : `<rect x="56" y="44" width="52" height="52" rx="14" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.22)"/>
         <text x="82" y="78" text-anchor="middle" fill="#fff" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="700">W</text>`
  }
  <text x="126" y="68" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="-0.5">Waamto</text>
  <text x="126" y="92" fill="#bfdbfe" font-family="Segoe UI, Arial, sans-serif" font-size="14" font-weight="500">by WaamTech Technologies</text>

  <rect x="900" y="50" width="244" height="40" rx="20" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.18)"/>
  <text x="1022" y="75" text-anchor="middle" fill="#e0f2fe" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="600" letter-spacing="1.2">CLOUD ERP PLATFORM</text>

  <!-- Headline -->
  <text x="56" y="200" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="50" font-weight="700" letter-spacing="-1.2">Modern Cloud ERP</text>
  <text x="56" y="252" fill="#bfdbfe" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="600" letter-spacing="-0.4">Built for Growing Businesses</text>
  <text x="56" y="300" fill="#e2e8f0" font-family="Segoe UI, Arial, sans-serif" font-size="15" font-weight="500" opacity="0.92">Finance · CRM · HR · Inventory · POS · Manufacturing · Projects · Payroll</text>

  <rect x="56" y="330" width="390" height="48" rx="14" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.20)"/>
  <text x="76" y="361" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="700">One Platform. Unlimited Growth.</text>

  <!-- Glass dashboard -->
  <g filter="url(#shadow)">
    <rect x="660" y="140" width="480" height="330" rx="22" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.22)"/>
    <rect x="660" y="140" width="480" height="44" rx="22" fill="rgba(7,21,38,0.45)"/>
    <rect x="660" y="162" width="480" height="22" fill="rgba(7,21,38,0.45)"/>
    <circle cx="684" cy="162" r="5" fill="#f87171"/>
    <circle cx="702" cy="162" r="5" fill="#fbbf24"/>
    <circle cx="720" cy="162" r="5" fill="#34d399"/>
    <text x="742" y="167" fill="#e2e8f0" font-family="Segoe UI, Arial, sans-serif" font-size="12" font-weight="600" opacity="0.75">Waamto · Operations Dashboard</text>

    <rect x="678" y="200" width="90" height="250" rx="12" fill="rgba(7,21,38,0.55)" stroke="rgba(255,255,255,0.08)"/>
    <rect x="688" y="214" width="70" height="28" rx="8" fill="rgba(59,130,246,0.35)"/>
    <text x="723" y="233" text-anchor="middle" fill="#eff6ff" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="600">Sales</text>
    <rect x="688" y="250" width="70" height="28" rx="8" fill="rgba(255,255,255,0.06)"/>
    <text x="723" y="269" text-anchor="middle" fill="#e2e8f0" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="600" opacity="0.7">Stock</text>
    <rect x="688" y="286" width="70" height="28" rx="8" fill="rgba(255,255,255,0.06)"/>
    <text x="723" y="305" text-anchor="middle" fill="#e2e8f0" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="600" opacity="0.7">CRM</text>
    <rect x="688" y="322" width="70" height="28" rx="8" fill="rgba(255,255,255,0.06)"/>
    <text x="723" y="341" text-anchor="middle" fill="#e2e8f0" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="600" opacity="0.7">HR</text>

    <!-- KPI cards -->
    <rect x="784" y="200" width="106" height="70" rx="12" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)"/>
    <text x="796" y="222" fill="#e2e8f0" font-family="Segoe UI, Arial, sans-serif" font-size="10" font-weight="600" opacity="0.65">REVENUE</text>
    <text x="796" y="248" fill="#93c5fd" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700">₨ 2.4M</text>

    <rect x="900" y="200" width="106" height="70" rx="12" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)"/>
    <text x="912" y="222" fill="#e2e8f0" font-family="Segoe UI, Arial, sans-serif" font-size="10" font-weight="600" opacity="0.65">ORDERS</text>
    <text x="912" y="248" fill="#86efac" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700">1,284</text>

    <rect x="1016" y="200" width="106" height="70" rx="12" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)"/>
    <text x="1028" y="222" fill="#e2e8f0" font-family="Segoe UI, Arial, sans-serif" font-size="10" font-weight="600" opacity="0.65">STOCK</text>
    <text x="1028" y="248" fill="#fcd34d" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700">98%</text>

    <!-- Chart panel -->
    <rect x="784" y="284" width="338" height="166" rx="12" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.12)"/>
    <rect x="800" y="308" width="48" height="8" rx="4" fill="rgba(255,255,255,0.12)"/>
    <rect x="860" y="306" width="220" height="10" rx="5" fill="url(#barA)"/>
    <rect x="800" y="336" width="48" height="8" rx="4" fill="rgba(255,255,255,0.12)"/>
    <rect x="860" y="334" width="170" height="10" rx="5" fill="url(#barB)"/>
    <rect x="800" y="364" width="48" height="8" rx="4" fill="rgba(255,255,255,0.12)"/>
    <rect x="860" y="362" width="250" height="10" rx="5" fill="url(#barA)"/>
    <rect x="800" y="392" width="48" height="8" rx="4" fill="rgba(255,255,255,0.12)"/>
    <rect x="860" y="390" width="130" height="10" rx="5" fill="url(#barB)"/>
    <rect x="800" y="420" width="48" height="8" rx="4" fill="rgba(255,255,255,0.12)"/>
    <rect x="860" y="418" width="200" height="10" rx="5" fill="url(#barA)"/>
  </g>

  <!-- Footer -->
  <line x1="56" y1="560" x2="1144" y2="560" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
  <text x="56" y="592" fill="#bfdbfe" font-family="Segoe UI, Arial, sans-serif" font-size="14" font-weight="500" opacity="0.85">Secure · Modular · Built for scale</text>
  <text x="1144" y="592" text-anchor="end" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700">www.waamto.com</text>
</svg>`;

const png = await sharp(Buffer.from(svg))
  .resize(1200, 630, { fit: "fill" })
  .png({ quality: 90, compressionLevel: 8 })
  .toBuffer();

writeFileSync(outFile, png);
console.log(`Wrote ${outFile} (${png.length} bytes)`);

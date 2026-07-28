/**
 * User-provided payment brand PNGs → square WebP checkout icons.
 * Sources: assets/payment-brands/{name}.png
 * Run: node scripts/import-payment-brand-icons.mjs
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const localAssets = path.join(process.cwd(), "assets", "payment-brands");
const cursorAssets = path.join(
  process.cwd(),
  "..",
  ".cursor",
  "projects",
  "e-01-WT-SASS-Products-ERP-Website",
  "assets"
);
const outDir = path.join(process.cwd(), "public", "payments");

/** Display slot ~40px; 128px WebP @ q70 for sharp 2× */
const SIZE = 128;

const sources = {
  jazzcash: "jazzcash.png",
  easypaisa: "easypaisa.png",
  paypal: "paypal.png",
  stripe: "stripe.png",
  card: "card.png",
  bank: "bank.png",
  wise: "wise.png",
};

const cursorAssetsMap = {
  jazzcash:
    "c__Users_wtsas_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-bbe04bf8-3415-4c65-a026-b4b13dd0d587.png",
  easypaisa:
    "c__Users_wtsas_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-c4363407-8409-4b1a-98b4-9c5867c3dd6c.png",
  paypal:
    "c__Users_wtsas_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-f02cffe2-755e-47bd-83a6-15dd41e49341.png",
  stripe:
    "c__Users_wtsas_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-a72ee428-9181-47e2-bf2b-3de4fea2acaf.png",
  card: "c__Users_wtsas_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-86cc6eef-3717-4514-b2e2-cf30e56ba73e.png",
  bank: "c__Users_wtsas_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-7dedd37c-3b35-471f-9a06-916a80bf6eb6.png",
  wise: "c__Users_wtsas_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-8f27ab31-6979-43e6-ba4d-c4cc41628b13.png",
};

/** Logos that should stay on a dark canvas */
const DARK_BG = new Set(["jazzcash", "stripe"]);

function resolveInput(name) {
  const local = path.join(localAssets, sources[name]);
  if (fs.existsSync(local)) return local;
  const cursor = path.join(cursorAssets, cursorAssetsMap[name]);
  if (fs.existsSync(cursor)) return cursor;
  return null;
}

async function toSquareWebp(name, inputPath, outputPath) {
  const bg = DARK_BG.has(name)
    ? { r: 0, g: 0, b: 0, alpha: 1 }
    : { r: 255, g: 255, b: 255, alpha: 1 };

  let pipeline = sharp(inputPath).rotate();

  try {
    pipeline = pipeline.trim({ threshold: 12 });
  } catch {
    /* trim not applicable */
  }

  await pipeline
    .resize(SIZE, SIZE, {
      fit: "contain",
      background: bg,
      withoutEnlargement: false,
    })
    .webp({ quality: 70, effort: 4 })
    .toFile(outputPath);
}

fs.mkdirSync(localAssets, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

// Drop removed method
const stale = path.join(outDir, "ufone.webp");
if (fs.existsSync(stale)) fs.unlinkSync(stale);

for (const name of Object.keys(sources)) {
  const input = resolveInput(name);
  const out = path.join(outDir, `${name}.webp`);
  if (!input) {
    console.error("MISSING source for", name);
    process.exitCode = 1;
    continue;
  }
  await toSquareWebp(name, input, out);
  const kb = (fs.statSync(out).size / 1024).toFixed(1);
  console.log(`OK ${name}.webp (${kb} KB) ← ${path.basename(input)}`);
}

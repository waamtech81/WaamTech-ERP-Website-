/**
 * Generate payment method brand marks as WebP (checkout icons).
 * Run: node scripts/generate-payment-icons.mjs
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const outDir = path.join(process.cwd(), "public", "payments");
fs.mkdirSync(outDir, { recursive: true });

const icons = {
  paypal: {
    w: 320,
    h: 80,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="80" viewBox="0 0 320 80">
      <rect width="320" height="80" rx="12" fill="#003087"/>
      <text x="160" y="50" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="28" font-weight="700" fill="#ffffff">PayPal</text>
    </svg>`,
  },
  stripe: {
    w: 320,
    h: 80,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="80" viewBox="0 0 320 80">
      <rect width="320" height="80" rx="12" fill="#635BFF"/>
      <text x="160" y="50" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="28" font-weight="700" fill="#ffffff">stripe</text>
    </svg>`,
  },
  card: {
    w: 320,
    h: 80,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="80" viewBox="0 0 320 80">
      <rect width="320" height="80" rx="12" fill="#1e293b"/>
      <rect x="24" y="22" width="56" height="36" rx="6" fill="#1A1F71"/>
      <text x="52" y="45" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" font-weight="700" fill="#fff">VISA</text>
      <circle cx="250" cy="40" r="16" fill="#EB001B" opacity="0.95"/>
      <circle cx="268" cy="40" r="16" fill="#F79E1B" opacity="0.95"/>
      <text x="160" y="48" text-anchor="middle" font-family="Arial,sans-serif" font-size="15" font-weight="600" fill="#e2e8f0">Debit / Credit</text>
    </svg>`,
  },
  jazzcash: {
    w: 320,
    h: 80,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="80" viewBox="0 0 320 80">
      <rect width="320" height="80" rx="12" fill="#B5121B"/>
      <text x="160" y="48" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="26" font-weight="700" fill="#ffffff">JazzCash</text>
    </svg>`,
  },
  easypaisa: {
    w: 320,
    h: 80,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="80" viewBox="0 0 320 80">
      <rect width="320" height="80" rx="12" fill="#00A651"/>
      <text x="160" y="48" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="24" font-weight="700" fill="#ffffff">EasyPaisa</text>
    </svg>`,
  },
  ufone: {
    w: 320,
    h: 80,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="80" viewBox="0 0 320 80">
      <rect width="320" height="80" rx="12" fill="#F58220"/>
      <text x="160" y="48" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="26" font-weight="700" fill="#ffffff">Ufone Money</text>
    </svg>`,
  },
  bank: {
    w: 320,
    h: 80,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="80" viewBox="0 0 320 80">
      <rect width="320" height="80" rx="12" fill="#0473EA"/>
      <text x="160" y="36" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" font-weight="600" fill="#dbeafe">Standard Chartered</text>
      <text x="160" y="58" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" fill="#eff6ff">Bank transfer</text>
    </svg>`,
  },
  wise: {
    w: 320,
    h: 80,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="80" viewBox="0 0 320 80">
      <rect width="320" height="80" rx="12" fill="#9FE870"/>
      <text x="160" y="50" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="30" font-weight="700" fill="#163300">Wise</text>
    </svg>`,
  },
};

for (const [name, spec] of Object.entries(icons)) {
  const out = path.join(outDir, `${name}.webp`);
  await sharp(Buffer.from(spec.svg))
    .resize(spec.w, spec.h, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 70 })
    .toFile(out);
  console.log("wrote", out);
}

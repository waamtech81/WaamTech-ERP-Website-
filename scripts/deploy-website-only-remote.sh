#!/usr/bin/env bash
# Website-only rebuild after file sync. Does NOT touch license engine / other apps.
set -euo pipefail
export NVM_DIR="${HOME}/.nvm"
# shellcheck source=/dev/null
[ -s "${NVM_DIR}/nvm.sh" ] && . "${NVM_DIR}/nvm.sh"
nvm use 22 >/dev/null 2>&1 || true

SITE=/home/admin/waamto-website
cd "$SITE"

echo "==> Source checks"
test -f src/lib/portal/license-access.ts
test -f src/lib/portal/payment-methods.ts
test -f src/components/portal/portal-payment-methods.tsx
test -f src/app/api/portal/billing/subscribe/route.ts
test -f src/components/auth/password-strength.tsx
test -f src/components/portal/portal-plans.tsx
grep -q "Account actions" src/components/portal/portal-dashboard.tsx
grep -q "WAAMTO ERP Cloud" src/components/portal/portal-settings.tsx
grep -q "session cookie" src/lib/auth/session.ts || grep -q "Omit maxAge" src/lib/auth/session.ts
echo PASS_SOURCE

echo "==> Clear caches + install (include build deps) + build"
rm -rf .next node_modules/.cache
# Build needs Tailwind PostCSS (devDependency). Do not use --omit=dev here.
npm ci 2>/dev/null || npm install
npm run build

echo "==> Restart waamto-website ONLY"
pm2 restart waamto-website --update-env
pm2 save || true

# Optional: prune after successful build to keep prod leaner (safe — next start doesn't need Tailwind)
# npm prune --omit=dev || true

sleep 2
curl -s -o /dev/null -w "home:%{http_code}\n" https://waamto.com/ || true
curl -s -o /dev/null -w "login:%{http_code}\n" https://waamto.com/login || true
curl -s -o /dev/null -w "portal:%{http_code}\n" https://waamto.com/portal || true
pm2 list | grep waamto-website || true
echo DEPLOY_WEBSITE_ONLY_OK

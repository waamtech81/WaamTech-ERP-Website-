#!/usr/bin/env bash
set -euo pipefail
export NVM_DIR="${HOME}/.nvm"
. "${NVM_DIR}/nvm.sh"
nvm use 22 >/dev/null

SITE=/home/admin/waamto-website
cd "$SITE"

test -f src/lib/geo-ip.ts
test -f src/app/api/geo/route.ts
grep -q countryFromIp src/middleware.ts
grep -q /api/geo src/components/providers/locale-provider.tsx
echo PASS_SOURCE

rm -rf .next node_modules/.cache
npm run build
pm2 restart waamto-website --update-env
pm2 save || true
sleep 2
curl -s -o /dev/null -w "home:%{http_code}\n" https://waamto.com/
curl -s -o /dev/null -w "login:%{http_code}\n" https://waamto.com/login
curl -s -o /dev/null -w "geo:%{http_code}\n" https://waamto.com/api/geo
curl -s https://waamto.com/api/geo | head -c 300; echo
pm2 list | grep waamto-website || true
echo DEPLOY_WEBSITE_OK
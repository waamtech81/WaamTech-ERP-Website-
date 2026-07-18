#!/usr/bin/env bash
set -euo pipefail
export NVM_DIR="${HOME}/.nvm"
. "${NVM_DIR}/nvm.sh"
nvm use 22 >/dev/null

SITE=/home/admin/waamto-website
cd "$SITE"

test -f src/components/layout/site-shell-client.tsx
test -f src/app/portal/plans/page.tsx
test -f src/app/portal/checkout/page.tsx
grep -q window.location.assign src/app/login/page.tsx
grep -q wt_portal_theme src/components/portal/portal-shell.tsx
echo PASS_SOURCE

rm -rf .next node_modules/.cache
npm run build
pm2 restart waamto-website --update-env
pm2 save || true
sleep 2
curl -s -o /dev/null -w "home:%{http_code}\n" https://waamto.com/
curl -s -o /dev/null -w "login:%{http_code}\n" https://waamto.com/login
curl -s -o /dev/null -w "portal_redirect:%{http_code}\n" https://waamto.com/portal
pm2 list | grep waamto-website || true
echo DEPLOY_WEBSITE_OK
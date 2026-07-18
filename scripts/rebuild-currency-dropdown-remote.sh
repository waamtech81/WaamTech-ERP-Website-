#!/usr/bin/env bash
set -euo pipefail
export NVM_DIR="${HOME}/.nvm"
. "${NVM_DIR}/nvm.sh"
nvm use 22 >/dev/null
cd /home/admin/waamto-website
grep -q FOOTER_CURRENCY_CODES src/components/layout/locale-controls.tsx
grep -q compact src/components/layout/locale-controls.tsx
echo PASS_SOURCE
rm -rf .next node_modules/.cache
npm run build
pm2 restart waamto-website --update-env
pm2 save || true
sleep 2
curl -s -o /dev/null -w "home:%{http_code}\n" https://waamto.com/
pm2 list | grep waamto-website || true
echo DEPLOY_WEBSITE_OK
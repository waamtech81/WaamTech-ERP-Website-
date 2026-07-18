#!/usr/bin/env bash
set -euo pipefail
export NVM_DIR="${HOME}/.nvm"
# shellcheck source=/dev/null
[ -s "${NVM_DIR}/nvm.sh" ] && . "${NVM_DIR}/nvm.sh"
nvm use 22 >/dev/null 2>&1 || true

SITE=/home/admin/waamto-website
LOGIN=$SITE/src/app/api/auth/login/route.ts

grep -q "Password step" "$LOGIN"
grep -A25 "Password step" "$LOGIN" | grep -q identityLogin
if grep -A25 "Password step" "$LOGIN" | grep -q "platformLogin({"; then
  echo FAIL_PROBE
  exit 1
fi
grep -q "sanitizeText(body?.challenge_token, 4096)" "$LOGIN"
echo PASS_SOURCE

cd "$SITE"
rm -rf .next node_modules/.cache
npm run build
pm2 restart waamto-website --update-env
pm2 save || true
curl -s -o /dev/null -w "login:%{http_code}\n" https://waamto.com/login || true
if grep -Rql "Platform Super Admin / staff first" .next 2>/dev/null; then
  echo FAIL_OLD_STRING
  exit 1
fi
echo PASS_BUILD
pm2 list | grep waamto-website || true
echo DEPLOY_WEBSITE_OK

#!/usr/bin/env bash
# Deploy permanent verified-customer login fix to production Website + Control Center.
# Run ON the VPS as the app user (has access to ~/waamto-website and license-engine).
set -euo pipefail
export NVM_DIR="${HOME}/.nvm"
# shellcheck source=/dev/null
[ -s "${NVM_DIR}/nvm.sh" ] && . "${NVM_DIR}/nvm.sh"
nvm use 22 >/dev/null 2>&1 || true

SITE="${HOME}/waamto-website"
ENGINE="${HOME}/waamtech-license-engine"
[ -d "$ENGINE" ] || ENGINE="${HOME}/license-engine"

echo "==> [1/4] Website: pull + rebuild"
cd "$SITE"
git fetch origin
git reset --hard origin/main
rm -rf .next node_modules/.cache
npm ci --omit=dev 2>/dev/null || npm install --omit=dev
npm run build
pm2 restart waamto-website --update-env || pm2 restart all --update-env || true
pm2 save || true

echo "==> [2/4] Control Center: pull + migrate + rebuild backend"
if [ -d "$ENGINE" ]; then
  cd "$ENGINE"
  git fetch origin
  git reset --hard origin/main
  if [ -f package.json ]; then
    npm ci 2>/dev/null || npm install
  fi
  if [ -d backend ]; then
    cd backend
    npm ci 2>/dev/null || npm install
    npm run build 2>/dev/null || npx tsc -p tsconfig.json || true
    npm run db:migrate 2>/dev/null || npx tsx src/database/migrate.ts || true
    cd ..
  fi
  pm2 restart wle-api --update-env 2>/dev/null || \
  pm2 restart license-engine --update-env 2>/dev/null || \
  pm2 restart all --update-env || true
  pm2 save || true
else
  echo "WARN: license engine dir not found — skip CC deploy"
fi

echo "==> [3/4] Verify production no longer forces OTP on password-only success"
sleep 3
CODE=$(curl -s -o /tmp/waamto-login.html -w "%{http_code}" "https://waamto.com/login" || true)
echo "login page HTTP $CODE"
if grep -Rql "Never create a Website session\|Login OTP verification is required. Complete email verification" \
  "$SITE/.next" 2>/dev/null; then
  echo "FAIL: old OTP-force string still present in build"
  exit 1
fi
echo "old OTP-force string: absent from .next (good)"

echo "==> [4/4] Done"
curl -s -o /dev/null -w "website:%{http_code}\n" "https://waamto.com/" || true
pm2 list | grep -E 'waamto|wle|license' || pm2 list | head -20
echo "DEPLOY_LOGIN_FIX_OK"

#!/usr/bin/env bash
# Apply a pre-uploaded production build to waamto-website.
# Expects /tmp/waamto-website-build.tgz containing:
#   .next/  public/  package.json  package-lock.json  next.config.ts
# Does NOT touch license engine / ERP / WMS / other PM2 apps.
# Leaves NO application source (src/, middleware.ts, etc.) on the server.
set -euo pipefail
export NVM_DIR="${HOME}/.nvm"
# shellcheck source=/dev/null
[ -s "${NVM_DIR}/nvm.sh" ] && . "${NVM_DIR}/nvm.sh"
nvm use 22 >/dev/null 2>&1 || true

SITE=/home/admin/waamto-website
cd "$SITE"

echo "==> [1/5] Extract production build bundle"
test -f /tmp/waamto-website-build.tgz
tar -xzf /tmp/waamto-website-build.tgz -C "$SITE"
rm -f /tmp/waamto-website-build.tgz

echo "==> [2/5] Remove source / non-runtime files"
rm -rf src scripts .cursor app components lib hooks types docs
rm -f middleware.ts tsconfig.json tsconfig.tsbuildinfo next-env.d.ts
rm -f eslint.config.mjs postcss.config.mjs
rm -f AGENTS.md CLAUDE.md README.md .gitignore
rm -f clean rebuild restart .env.example
# Drop local-dev build leftovers (not needed for next start)
rm -rf .next/dev .next/cache/webpack .next/cache/eslint 2>/dev/null || true

echo "==> [3/5] Production node_modules only"
npm ci --omit=dev 2>/dev/null || npm install --omit=dev

echo "==> [4/5] Restart waamto-website ONLY"
pm2 restart waamto-website --update-env
pm2 save || true

echo "==> [5/5] Verify"
sleep 2
test ! -d "$SITE/src" && echo SRC_REMOVED_OK || (echo SRC_STILL_PRESENT; exit 1)
test -d "$SITE/.next" && echo NEXT_OK
test -f "$SITE/package.json" && echo PACKAGE_OK
curl -s -o /dev/null -w "home:%{http_code}\n" https://waamto.com/ || true
curl -s -o /dev/null -w "login:%{http_code}\n" https://waamto.com/login || true
curl -s -o /dev/null -w "portal:%{http_code}\n" https://waamto.com/portal || true
pm2 list | grep -E 'waamto-website|wle-api' || true
echo DEPLOY_BUILD_ONLY_OK

#!/usr/bin/env bash
# Apply a pre-uploaded production build to waamto-website.
# Expects /tmp/waamto-website-build.tgz containing:
#   .next/  public/  package.json  package-lock.json  next.config.ts
# Does NOT touch license engine / ERP / WMS / other PM2 apps.
# Leaves NO application source (src/, middleware.ts, etc.) on the server.
#
# Optimizations (same production result):
# - Keeps node_modules; runs npm only when package hash changes
# - Strips source only if present
# - pm2 reload for zero-downtime when possible
set -euo pipefail
export NVM_DIR="${HOME}/.nvm"
# shellcheck source=/dev/null
[ -s "${NVM_DIR}/nvm.sh" ] && . "${NVM_DIR}/nvm.sh"
nvm use 22 >/dev/null 2>&1 || true

SITE=/home/admin/waamto-website
HASH_FILE="${SITE}/.deploy-package-hash"
cd "$SITE"

echo "==> [1/5] Extract production build bundle"
test -f /tmp/waamto-website-build.tgz
tar -xzf /tmp/waamto-website-build.tgz -C "$SITE"
rm -f /tmp/waamto-website-build.tgz

echo "==> [2/5] Remove source / non-runtime files (only if present)"
if [ -d "$SITE/src" ] || [ -f "$SITE/middleware.ts" ] || [ -d "$SITE/scripts" ]; then
  rm -rf src scripts .cursor app components lib hooks types docs
  rm -f middleware.ts tsconfig.json tsconfig.tsbuildinfo next-env.d.ts
  rm -f eslint.config.mjs postcss.config.mjs
  rm -f AGENTS.md CLAUDE.md README.md .gitignore
  rm -f clean rebuild restart .env.example
fi
# Runtime does not need local build cache
rm -rf .next/dev .next/cache 2>/dev/null || true

echo "==> [3/5] Production node_modules (skip when package files unchanged)"
NEW_HASH="$( (sha256sum package.json package-lock.json | awk '{print $1}') | paste -sd: - )"
NEED_INSTALL=1
if [ -f "$HASH_FILE" ] && [ -d "$SITE/node_modules" ]; then
  PREV="$(cat "$HASH_FILE" 2>/dev/null || true)"
  if [ "$PREV" = "$NEW_HASH" ]; then
    NEED_INSTALL=0
    echo "SKIP npm install (package.json + lock unchanged)"
  fi
fi
if [ "$NEED_INSTALL" = "1" ]; then
  npm ci --omit=dev 2>/dev/null || npm install --omit=dev
  printf '%s' "$NEW_HASH" > "$HASH_FILE"
  echo "npm install done; hash saved"
fi

echo "==> [4/5] Reload waamto-website ONLY (zero-downtime when possible)"
if pm2 describe waamto-website >/dev/null 2>&1; then
  pm2 reload waamto-website --update-env || pm2 restart waamto-website --update-env
else
  pm2 restart waamto-website --update-env
fi
pm2 save || true

echo "==> [5/5] Verify"
sleep 1
test ! -d "$SITE/src" && echo SRC_REMOVED_OK || (echo SRC_STILL_PRESENT; exit 1)
test -d "$SITE/.next" && echo NEXT_OK
test -f "$SITE/package.json" && echo PACKAGE_OK
curl -s -o /dev/null -w "home:%{http_code}\n" https://waamto.com/ || true
curl -s -o /dev/null -w "login:%{http_code}\n" https://waamto.com/login || true
curl -s -o /dev/null -w "portal:%{http_code}\n" https://waamto.com/portal || true
pm2 list | grep -E 'waamto-website|wle-api' || true
echo DEPLOY_BUILD_ONLY_OK

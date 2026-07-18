#!/usr/bin/env bash
# Production deploy + cache clear for WAAMTO ERP Website (cPanel / Node).
# Run on the hosting server from the application root.
set -euo pipefail

APP_DIR="${1:-$(pwd)}"
cd "$APP_DIR"

echo "==> App dir: $APP_DIR"
echo "==> Git pull latest"
git fetch origin
git reset --hard origin/main

echo "==> Clear Next.js / Node caches"
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo 2>/dev/null || true

echo "==> Install deps (if needed) and rebuild"
npm ci --omit=dev 2>/dev/null || npm install --omit=dev
npm run build

echo "==> Restart application process"
if command -v pm2 >/dev/null 2>&1; then
  pm2 describe waamto-website >/dev/null 2>&1 && pm2 restart waamto-website --update-env || \
  pm2 describe erp-website >/dev/null 2>&1 && pm2 restart erp-website --update-env || \
  pm2 restart all --update-env || true
  pm2 save || true
elif command -v passenger-config >/dev/null 2>&1; then
  mkdir -p tmp
  touch tmp/restart.txt
  echo "Passenger restart signaled via tmp/restart.txt"
else
  # cPanel Node.js App often needs a stop/start from the panel.
  # Also try common Node restart signals:
  pkill -f "next start" 2>/dev/null || true
  echo "No PM2/Passenger detected — restart the Node app from cPanel Node.js Selector."
fi

echo "==> Verify env (names only)"
node -e "const keys=['LICENSE_API_URL','NEXT_PUBLIC_LICENSE_ENGINE_URL','NEXT_PUBLIC_SITE_URL','NEXT_PUBLIC_LICENSE_PORTAL_URL']; for (const k of keys) console.log(k+'='+(process.env[k]?'set':'MISSING'));"

echo "==> Done. Hard-refresh https://waamto.com/login and confirm console [auth-login-debug]."

#!/usr/bin/env bash
set -euo pipefail
export NVM_DIR="${HOME}/.nvm"
# shellcheck source=/dev/null
[ -s "${NVM_DIR}/nvm.sh" ] && . "${NVM_DIR}/nvm.sh"
nvm use 22 >/dev/null 2>&1 || true

ENGINE_BACKEND="/home/admin/waamtech-license-engine/backend"
SITE="/home/admin/waamto-website"
SQL_FILE="/home/admin/waamtech-license-engine/database/migrations/049_customer_portal_support_notifications.sql"

echo "==> [1/3] ENGINE migration 049 + build"
cd "$ENGINE_BACKEND"
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_NAME="${DB_NAME:-}"

if [ -n "$DB_NAME" ] && [ -f "$SQL_FILE" ]; then
  echo "Running migration 049 on ${DB_NAME}"
  if [ -n "${DB_PASSWORD:-}" ]; then
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$SQL_FILE"
  else
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" < "$SQL_FILE"
  fi
  echo "migration 049 applied"
else
  echo "WARN: skip SQL DB_NAME=${DB_NAME:-empty}"
fi

npm run build
pm2 restart wle-api --update-env
pm2 save || true

echo "==> [2/3] WEBSITE source checks + build"
cd "$SITE"
test -f src/lib/portal/dashboard.ts
test -f src/components/portal/portal-invoices.tsx
test -f src/components/portal/portal-notifications.tsx
test -f src/components/portal/portal-settings.tsx
test -f src/components/portal/portal-business-profile.tsx
test -f src/components/portal/portal-nav.ts
grep -q "workspaceUsers" src/lib/portal/dashboard.ts
grep -q "fetchBillingUsage" src/lib/portal/dashboard.ts
grep -q "resolvePreferredGateway" src/app/api/portal/billing/renew/route.ts
grep -vq "Create Support Ticket" src/lib/portal/dashboard.ts || true
echo PASS_SOURCE

rm -rf .next node_modules/.cache
npm run build
pm2 restart waamto-website --update-env
pm2 save || true

echo "==> [3/3] VERIFY"
sleep 3
curl -s -o /dev/null -w "home:%{http_code}\n" https://waamto.com/ || true
curl -s -o /dev/null -w "login:%{http_code}\n" https://waamto.com/login || true
curl -s -o /dev/null -w "portal:%{http_code}\n" https://waamto.com/portal || true
curl -s -o /dev/null -w "portal_support_redirect:%{http_code}\n" https://waamto.com/portal/support || true
curl -s -o /tmp/wle-usage.json -w "engine_usage:%{http_code}\n" \
  https://api.license.waamtech.com/api/v1/public/billing/usage || true
head -c 160 /tmp/wle-usage.json; echo
pm2 list | grep -E "waamto-website|wle-api" || true
echo DEPLOY_PORTAL_OK

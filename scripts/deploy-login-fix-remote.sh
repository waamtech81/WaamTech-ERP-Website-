#!/usr/bin/env bash
set -euo pipefail
export NVM_DIR="${HOME}/.nvm"
# shellcheck source=/dev/null
[ -s "${NVM_DIR}/nvm.sh" ] && . "${NVM_DIR}/nvm.sh"
nvm use 22 >/dev/null 2>&1 || true

ENGINE_BACKEND="/home/admin/waamtech-license-engine/backend"
SITE="/home/admin/waamto-website"
SQL_FILE="/home/admin/waamtech-license-engine/database/migrations/048_backfill_identity_email_verified.sql"

echo "==> ENGINE migration + build"
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
  echo "Running migration 048 on ${DB_NAME}"
  if [ -n "${DB_PASSWORD:-}" ]; then
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$SQL_FILE"
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -N -e \
      "SELECT 'null_verified', COUNT(*) FROM customer_identities WHERE deleted_at IS NULL AND status='active' AND email_verified_at IS NULL; SELECT 'locked_active', COUNT(*) FROM customer_identities WHERE deleted_at IS NULL AND status='active' AND locked_until IS NOT NULL AND locked_until > NOW();"
  else
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" < "$SQL_FILE"
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" -N -e \
      "SELECT 'null_verified', COUNT(*) FROM customer_identities WHERE deleted_at IS NULL AND status='active' AND email_verified_at IS NULL; SELECT 'locked_active', COUNT(*) FROM customer_identities WHERE deleted_at IS NULL AND status='active' AND locked_until IS NOT NULL AND locked_until > NOW();"
  fi
else
  echo "WARN: skip SQL DB_NAME=${DB_NAME:-empty}"
fi

npm run build
pm2 restart wle-api --update-env
pm2 save || true

echo "==> WEBSITE pull + build"
cd "$SITE"
git fetch origin
git reset --hard origin/main
rm -rf .next node_modules/.cache
npm ci --omit=dev 2>/dev/null || npm install --omit=dev
npm run build
pm2 restart waamto-website --update-env
pm2 save || true

echo "==> VERIFY source policy"
LOGIN_ROUTE="$SITE/src/app/api/auth/login/route.ts"
grep -q "Password step" "$LOGIN_ROUTE"
grep -A25 "Password step" "$LOGIN_ROUTE" | grep -q "identityLogin"
if grep -A25 "Password step" "$LOGIN_ROUTE" | grep -q "platformLogin({"; then
  echo "FAIL: password step still probes platformLogin"
  exit 1
fi
grep -q "sanitizeText(body?.challenge_token, 4096)" "$LOGIN_ROUTE"
grep -q "already own a customer" \
  "$ENGINE_BACKEND/src/modules/registrations/identity.service.ts"

echo "PASS: identity-only password step + JWT 4096 + Engine self-heal"
curl -s -o /dev/null -w "login_page:%{http_code}\n" https://waamto.com/login || true
pm2 list | grep -E "waamto-website|wle-api" || true
echo "DEPLOY_LOGIN_FIX_COMPLETE"

#!/usr/bin/env bash
set -euo pipefail
LOGIN=/home/admin/waamto-website/src/app/api/auth/login/route.ts
ID=/home/admin/waamtech-license-engine/backend/src/modules/registrations/identity.service.ts

echo "== source checks =="
grep -n "Password step" "$LOGIN"
grep -A30 "Password step" "$LOGIN" | grep identityLogin
if grep -A30 "Password step" "$LOGIN" | grep -q "platformLogin({"; then
  echo FAIL_PASSWORD_PROBES_PLATFORM
  exit 1
fi
grep -n "4096" "$LOGIN" | head -3
grep -n "already own a customer\|Correct password clears" "$ID" | head -10
echo PASS_SOURCE

echo "== health =="
sleep 3
curl -s -o /dev/null -w "home:%{http_code}\n" https://waamto.com/
curl -s -o /dev/null -w "login_page:%{http_code}\n" https://waamto.com/login

echo "== login API unknown user (must not return OTP challenge) =="
RESP=$(curl -s -X POST https://waamto.com/api/auth/login \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://waamto.com' \
  -H 'Referer: https://waamto.com/login' \
  -d '{"username":"nonexistent-verify-fix@example.com","password":"WrongPass123!"}')
echo "$RESP" | head -c 500
echo
echo "$RESP" | grep -q '"success":false'
if echo "$RESP" | grep -qi 'requiresOtp\|requires_email_verification":true\|challenge_token'; then
  echo FAIL_OTP_ON_UNKNOWN
  exit 1
fi
echo PASS_NO_OTP_ON_FAILURE

echo "== db verified/lock counts =="
cd /home/admin/waamtech-license-engine/backend
set -a
# shellcheck disable=SC1091
. ./.env
set +a
mysql -h "${DB_HOST:-127.0.0.1}" -P "${DB_PORT:-3306}" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -N -e \
  "SELECT 'null_verified', COUNT(*) FROM customer_identities WHERE deleted_at IS NULL AND status='active' AND email_verified_at IS NULL; SELECT 'locked_active', COUNT(*) FROM customer_identities WHERE deleted_at IS NULL AND status='active' AND locked_until IS NOT NULL AND locked_until > UTC_TIMESTAMP();"

pm2 list | grep -E "waamto-website|wle-api"
echo VALIDATE_OK

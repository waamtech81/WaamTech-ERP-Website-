#!/usr/bin/env bash
# Update only PAYPAL_* keys in Webdock waamto-website .env.local from local .env.local
set -euo pipefail
LOCAL_ENV="$1"
REMOTE_ENV="/home/admin/waamto-website/.env.local"
TMP="/tmp/waamto-paypal-env.$$"
if [ ! -f "$LOCAL_ENV" ]; then
  echo "Missing local env: $LOCAL_ENV" >&2
  exit 1
fi
grep '^PAYPAL_' "$LOCAL_ENV" > "$TMP"
python3 - <<'PY' "$REMOTE_ENV" "$TMP"
import pathlib, sys
remote = pathlib.Path(sys.argv[1])
updates = {}
for line in pathlib.Path(sys.argv[2]).read_text().splitlines():
    if not line.strip() or line.strip().startswith('#') or '=' not in line:
        continue
    k, v = line.split('=', 1)
    updates[k.strip()] = v.strip()
lines = remote.read_text().splitlines() if remote.exists() else []
out = []
seen = set()
for line in lines:
    if '=' in line and not line.lstrip().startswith('#'):
        key = line.split('=', 1)[0].strip()
        if key in updates:
            out.append(f"{key}={updates[key]}")
            seen.add(key)
            continue
    out.append(line)
for key, val in updates.items():
    if key not in seen:
        out.append(f"{key}={val}")
remote.write_text('\n'.join(out).rstrip() + '\n')
print('UPDATED_PAYPAL_ENV_OK', ','.join(sorted(updates.keys())))
PY
rm -f "$TMP"

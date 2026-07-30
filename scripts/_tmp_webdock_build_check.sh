#!/usr/bin/env bash
echo "WEBSITE_BUILD=$(cat /home/admin/waamto-website/.next/BUILD_ID 2>/dev/null || echo missing)"
echo "WEBSITE_MTIME=$(stat -c %y /home/admin/waamto-website/.next/BUILD_ID 2>/dev/null || echo missing)"
echo "ERP_BUILD=$(cat /home/admin/waamto-erp/frontend/.next/BUILD_ID 2>/dev/null || echo missing)"
echo "ERP_MTIME=$(stat -c %y /home/admin/waamto-erp/frontend/.next/BUILD_ID 2>/dev/null || echo missing)"
echo "WLE_BUILD=$(cat /home/admin/waamtech-license-engine/frontend/.next/BUILD_ID 2>/dev/null || echo missing)"
echo "WLE_MTIME=$(stat -c %y /home/admin/waamtech-license-engine/frontend/.next/BUILD_ID 2>/dev/null || echo missing)"
if [ -f /home/admin/waamtech-license-engine/backend/dist/server.js ]; then
  echo "WLE_DIST_MTIME=$(stat -c %y /home/admin/waamtech-license-engine/backend/dist/server.js)"
fi

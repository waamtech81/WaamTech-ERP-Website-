#!/usr/bin/env bash
# DEPRECATED for source-based rebuilds.
# Production now uses build-artifact deploy only (no src on Webdock).
# Prefer: scripts/deploy-website-build-only.ps1 (local build → upload → this apply script)
# or:     scripts/deploy-build-only-remote.sh after uploading /tmp/waamto-website-build.tgz
set -euo pipefail
echo "ERROR: Source rebuild on Webdock is disabled."
echo "Build locally, then run: scripts/deploy-website-build-only.ps1"
echo "Or upload /tmp/waamto-website-build.tgz and run: /home/admin/deploy-build-only.sh"
exit 1

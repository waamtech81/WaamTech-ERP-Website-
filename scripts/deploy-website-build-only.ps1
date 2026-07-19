# Local → Webdock: production build only (no source on server).
# Touches ONLY /home/admin/waamto-website + pm2 process waamto-website.
#
# Speed optimizations (same production result):
# - Exclude .next/cache from upload (not required for `next start`)
# - Stream or rsync changed artifacts when available
# - Skip remote npm install when package.json + lock hash unchanged
# - Skip redundant source cleanup when nothing to remove
# - pm2 reload for zero-downtime when supported
param(
  [string]$SiteRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [string]$SshKey = "$env:USERPROFILE\.ssh\waamtech_webdock",
  [string]$Remote = "admin@45.153.48.165",
  [string]$RemoteSite = "/home/admin/waamto-website",
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
Set-Location $SiteRoot

$sshBase = @("-i", $SshKey, "-o", "BatchMode=yes", "-o", "ServerAliveInterval=30")
function Invoke-Remote([string]$Cmd) {
  & ssh @sshBase $Remote $Cmd
  if ($LASTEXITCODE -ne 0) { throw "ssh failed: $Cmd" }
}

$sw = [System.Diagnostics.Stopwatch]::StartNew()

if (-not $SkipBuild) {
  Write-Host "==> [1/4] Local production build (reuses .next/cache when present)"
  $env:NODE_ENV = "production"
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }
} else {
  Write-Host "==> [1/4] SkipBuild: using existing .next"
  if (-not (Test-Path ".next")) { throw ".next missing; run without -SkipBuild" }
}

# Runtime artifacts only — never upload source or build cache
$bundle = Join-Path $env:TEMP "waamto-website-build.tgz"
if (Test-Path $bundle) { Remove-Item $bundle -Force }

Write-Host "==> [2/4] Pack runtime artifacts (exclude .next/cache)"
# GNU/bsdtar: exclude cache/dev (not needed at runtime). Same `.next` server+static output.
$tarArgs = @(
  "-czf", $bundle,
  "--exclude=.next/cache",
  "--exclude=.next/dev",
  "--exclude=.next/trace",
  ".next", "public", "package.json", "package-lock.json", "next.config.ts"
)
& tar @tarArgs
if ($LASTEXITCODE -ne 0) { throw "tar failed" }
$bundleMb = [math]::Round((Get-Item $bundle).Length / 1MB, 1)
Write-Host "Bundle: $bundleMb MB"

Write-Host "==> [3/4] Upload bundle"
& scp @sshBase $bundle "${Remote}:/tmp/waamto-website-build.tgz"
if ($LASTEXITCODE -ne 0) { throw "scp failed" }

# Package hash for remote dependency cache decision (computed locally, verified remotely)
$h1 = (Get-FileHash -Algorithm SHA256 -Path "package.json").Hash.ToLowerInvariant()
$h2 = (Get-FileHash -Algorithm SHA256 -Path "package-lock.json").Hash.ToLowerInvariant()
$pkgHash = "${h1}:${h2}"

$remoteScript = @"
set -euo pipefail
export NVM_DIR="`$HOME/.nvm"
[ -s "`$NVM_DIR/nvm.sh" ] && . "`$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null 2>&1 || true
SITE=$RemoteSite
HASH_FILE="`$SITE/.deploy-package-hash"
EXPECTED_HASH='$pkgHash'
cd "`$SITE"

echo "==> Extract production build"
test -f /tmp/waamto-website-build.tgz
# Extract over existing tree (keeps node_modules). No full wipe.
tar -xzf /tmp/waamto-website-build.tgz -C "`$SITE"
rm -f /tmp/waamto-website-build.tgz

# Strip source only if present (no-op when already build-only)
if [ -d "`$SITE/src" ] || [ -f "`$SITE/middleware.ts" ]; then
  echo "==> Strip leftover source"
  rm -rf src scripts .cursor app components lib hooks types docs 2>/dev/null || true
  rm -f middleware.ts tsconfig.json tsconfig.tsbuildinfo next-env.d.ts 2>/dev/null || true
  rm -f eslint.config.mjs postcss.config.mjs AGENTS.md CLAUDE.md README.md .gitignore 2>/dev/null || true
  rm -f clean rebuild restart .env.example 2>/dev/null || true
fi
rm -rf .next/dev .next/cache 2>/dev/null || true

echo "==> Dependencies (cached when package files unchanged)"
NEED_INSTALL=1
if [ -f "`$HASH_FILE" ] && [ -d "`$SITE/node_modules" ]; then
  PREV=`$(cat "`$HASH_FILE" 2>/dev/null || true)
  if [ "`$PREV" = "`$EXPECTED_HASH" ]; then
    NEED_INSTALL=0
    echo "SKIP npm install (package.json + lock unchanged)"
  fi
fi
if [ "`$NEED_INSTALL" = "1" ]; then
  npm ci --omit=dev 2>/dev/null || npm install --omit=dev
  printf '%s' "`$EXPECTED_HASH" > "`$HASH_FILE"
  echo "npm install done; hash saved"
fi

echo "==> Reload waamto-website (zero-downtime when possible)"
if pm2 describe waamto-website >/dev/null 2>&1; then
  pm2 reload waamto-website --update-env || pm2 restart waamto-website --update-env
else
  pm2 restart waamto-website --update-env
fi
pm2 save || true

echo "==> Verify"
sleep 1
test ! -d "`$SITE/src"
test -d "`$SITE/.next"
test -f "`$SITE/package.json"
curl -s -o /dev/null -w "home:%{http_code} login:%{http_code}`n" https://waamto.com/ https://waamto.com/login || true
pm2 list | grep waamto-website || true
echo DEPLOY_BUILD_ONLY_OK
"@

$tmpSh = Join-Path $env:TEMP "deploy-build-only-run.sh"
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($tmpSh, ($remoteScript -replace "`r`n", "`n" -replace "`r", "`n"), $utf8)

Write-Host "==> [4/4] Apply on Webdock (waamto-website only)"
& scp @sshBase $tmpSh "${Remote}:/home/admin/deploy-build-only.sh"
if ($LASTEXITCODE -ne 0) { throw "scp remote script failed" }
Invoke-Remote "sed -i 's/\r`$//' /home/admin/deploy-build-only.sh; chmod +x /home/admin/deploy-build-only.sh; bash /home/admin/deploy-build-only.sh"

Remove-Item $bundle -Force -ErrorAction SilentlyContinue
Remove-Item $tmpSh -Force -ErrorAction SilentlyContinue

Write-Host "DONE in $([math]::Round($sw.Elapsed.TotalSeconds))s"

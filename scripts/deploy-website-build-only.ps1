# Local → Webdock: production build only (no source on server).
# Touches ONLY /home/admin/waamto-website + pm2 process waamto-website.
param(
  [string]$SiteRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [string]$SshKey = "$env:USERPROFILE\.ssh\waamtech_webdock",
  [string]$Remote = "admin@45.153.48.165",
  [string]$RemoteSite = "/home/admin/waamto-website"
)

$ErrorActionPreference = "Stop"
Set-Location $SiteRoot

Write-Host "==> [1/4] Local production build"
$env:NODE_ENV = "production"
npm run build
if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }

$bundle = Join-Path $env:TEMP "waamto-website-build.tgz"
if (Test-Path $bundle) { Remove-Item $bundle -Force }

Write-Host "==> [2/4] Pack runtime artifacts (.next public package* next.config)"
tar -czf $bundle .next public package.json package-lock.json next.config.ts
if ($LASTEXITCODE -ne 0) { throw "tar failed" }
Write-Host "Bundle: $([math]::Round((Get-Item $bundle).Length / 1MB, 1)) MB"

Write-Host "==> [3/4] Upload bundle"
scp -i $SshKey -o BatchMode=yes $bundle "${Remote}:/tmp/waamto-website-build.tgz"
if ($LASTEXITCODE -ne 0) { throw "scp failed" }

$remoteScript = @"
set -euo pipefail
export NVM_DIR="`$HOME/.nvm"
[ -s "`$NVM_DIR/nvm.sh" ] && . "`$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null 2>&1 || true
SITE=$RemoteSite
cd "`$SITE"
tar -xzf /tmp/waamto-website-build.tgz -C "`$SITE"
rm -f /tmp/waamto-website-build.tgz
rm -rf src scripts .cursor app components lib hooks types docs
rm -f middleware.ts tsconfig.json tsconfig.tsbuildinfo next-env.d.ts
rm -f eslint.config.mjs postcss.config.mjs AGENTS.md CLAUDE.md README.md .gitignore
rm -f clean rebuild restart .env.example
rm -rf .next/dev .next/cache/webpack .next/cache/eslint 2>/dev/null || true
npm ci --omit=dev 2>/dev/null || npm install --omit=dev
pm2 restart waamto-website --update-env
pm2 save || true
sleep 2
test ! -d "`$SITE/src"
test -d "`$SITE/.next"
curl -s -o /dev/null -w "home:%{http_code} login:%{http_code}`n" https://waamto.com/ https://waamto.com/login || true
pm2 list | grep waamto-website || true
echo DEPLOY_BUILD_ONLY_OK
"@

$tmpSh = Join-Path $env:TEMP "deploy-build-only-run.sh"
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($tmpSh, ($remoteScript -replace "`r`n", "`n" -replace "`r", "`n"), $utf8)

Write-Host "==> [4/4] Extract on Webdock, strip source, restart waamto-website only"
scp -i $SshKey -o BatchMode=yes $tmpSh "${Remote}:/home/admin/deploy-build-only.sh"
ssh -i $SshKey -o BatchMode=yes -o ServerAliveInterval=30 $Remote "sed -i 's/\r`$//' /home/admin/deploy-build-only.sh; chmod +x /home/admin/deploy-build-only.sh; bash /home/admin/deploy-build-only.sh"
if ($LASTEXITCODE -ne 0) { throw "remote deploy failed" }
Write-Host "DONE"

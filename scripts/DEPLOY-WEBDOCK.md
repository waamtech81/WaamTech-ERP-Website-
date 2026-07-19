# Webdock Website deploy policy

**Last confirmed:** 2026-07-20

## Policy (do not break)

- Source code = **local + Git only**
- Webdock production = **production build artifacts only**
- Never keep full project source (`src/`, etc.) on the server
- Never touch other projects (ERP / WMS / License Engine / other PM2 apps) unless explicitly requested

## What lives on Webdock

`/home/admin/waamto-website/` may contain only:

- `.next/`
- `public/`
- `package.json` / `package-lock.json`
- `next.config.ts`
- `node_modules/` (production deps, `--omit=dev`)
- `.env.production` / `.env.local` (server secrets — do not wipe casually)

Must **not** contain: `src/`, `app/`, `components/`, `lib/`, `middleware.ts`, `scripts/` (app source), `tsconfig*`, eslint/postcss configs, docs, `.next/dev`.

## Deploy command (preferred)

From the Website repo root on the local machine:

```powershell
.\scripts\deploy-website-build-only.ps1
```

This:

1. Runs `npm run build` locally (reuses local `.next/cache` when present)  
2. Packs `.next` + `public` + package files + `next.config.ts` (**excludes** `.next/cache` — not needed for `next start`)  
3. Uploads the bundle  
4. Extracts on Webdock **without wiping** `node_modules`  
5. Runs `npm ci --omit=dev` **only when** `package.json` / `package-lock.json` hash changed  
6. Reloads **waamto-website** only (`pm2 reload`, fallback `restart`)  

Optional: `-SkipBuild` to reuse an existing local `.next` (same commit / already built).

## Manual fallback

1. Local: `npm run build` then tar those runtime files → `/tmp/waamto-website-build.tgz` on server  
2. Remote: `bash /home/admin/deploy-build-only.sh` (from `scripts/deploy-build-only-remote.sh`)

## Forbidden

- SCP/rsync of `src/` to Webdock  
- `npm run build` on Webdock from full source tree as the normal process  
- Using the disabled source rebuild script as a real deploy path  

## Pre-deploy checklist for agents

- [ ] Read this file  
- [ ] Deploy build only (no source sync)  
- [ ] Scope = `waamto-website` only  
- [ ] After deploy: confirm `NO_SRC` on server  

# Architecture Freeze — Waamto Website v1.0

| Field | Value |
|-------|--------|
| **Status** | **ARCHITECTURE FROZEN v1.0** |
| **Project** | Waamto Website (`waamto-website` / ERP Website) |
| **Certified** | 2026-07-20 |
| **Authority** | Binding for all future Website work until an explicit Architecture Version Upgrade |

---

## 1. Purpose

Lock the current Website architecture so development stays inside the existing shape.  
This document is the **reference** for all future Website development.

## 2. System role (immutable under v1.0)

| Responsibility | Owner |
|----------------|--------|
| Public marketing site + Customer Portal UI | **Waamto Website** |
| Portal BFF (`/api/portal/*`, `/api/auth/*` proxies) | **Waamto Website** |
| Licenses, billing, invoices, identity, orgs, commercial | **License Engine** (not Website) |
| Product ERP / tickets / workspace operations | **SaaS ERP** (not Website) |

Do **not** move these responsibilities between projects under v1.0.

## 3. Frozen scope

Frozen as of this version:

- Folder / App Router project structure
- Customer Portal section set and navigation shape (`portal-nav` / allowed portal surfaces)
- Portal BFF routes under `/api/portal/*` and auth routes under `/api/auth/*`
- Integration pattern: browser → Website BFF → License Engine / commercial clients (no browser→Engine secrets)
- Dashboard aggregate via `lib/portal/dashboard` + `/api/portal/dashboard`
- Renew / upgrade / checkout flows as currently wired
- Authentication session cookie approach for the portal
- Production deploy model: **build artifacts only** on Webdock (see `scripts/DEPLOY-WEBDOCK.md`)
- Public site routing and marketing page structure as currently shipped

Related portal detail freeze (still in force): `.cursor/rules/portal-architecture-freeze.mdc`

## 4. Allowed after freeze (no architecture change)

- New features **inside** the frozen surfaces and contracts
- Bug fixes
- Performance improvements
- Security improvements
- UI/UX enhancements

## 5. Excluded / forbidden without Architecture Version Upgrade

- Redesigning folders, modules, APIs, DB ownership, auth flow, licensing flow, provisioning, multi-tenant model, routing, or project structure
- Moving License Engine or ERP responsibilities into the Website
- Adding a Website-owned commercial database or second backend for licenses/billing
- Portal support-ticket / live-chat product (ERP owns product support)
- Breaking public or internal API contracts / backward compatibility
- Automatic “architecture v2” refactors

## 6. Upgrade rule

Any architectural change requires an **explicit Architecture Version Upgrade** (e.g. v1.1, v2.0) requested and approved by the product owner. Agents must **not** invent upgrades.

## 7. Confirmation

**Waamto Website architecture is FROZEN at v1.0.**

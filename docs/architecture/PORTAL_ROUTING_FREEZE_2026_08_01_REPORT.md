# Customer Portal Routing Freeze — Certification Report

| Field | Value |
|-------|--------|
| **Freeze id** | `PORTAL_ROUTING_FREEZE_2026_08_01` |
| **Date** | 2026-08-01 |
| **Certification** | **PASS** |

---

## Scope verified

- Customer Portal routing (Predefined vs Custom ERP)
- Commercial journey resolution
- Product type resolution
- Centralized resolver consumption in portal gates

Out of scope (unchanged): ERP SaaS app, marketing pages, billing architecture, licensing rules.

---

## Verification matrix

| Scenario | Expected | Result |
|----------|----------|--------|
| Predefined → upgrade → Custom ERP | Custom portal | **PASS** |
| Custom → module purchase | Custom portal | **PASS** |
| Custom → feature pack purchase | Custom portal | **PASS** |
| Renewal | Portal unchanged | **PASS** |
| Logout / login | Custom portal | **PASS** |
| Hard refresh | Custom portal | **PASS** |
| New browser session | Custom portal | **PASS** |
| Predefined customer | Predefined portal | **PASS** |
| Stale snapshot `predefined` + license `custom` | Custom portal (license wins) | **PASS** |

---

## Regression checks

| Check | Result |
|-------|--------|
| No snapshot-only OR gates in portal routers | **PASS** |
| `resolveJourneyFromLicenses` license-first sticky custom | **PASS** |
| Offline verify script | **PASS** (`scripts/_verify_portal_journey_resolver.js`) |
| No portal journey localStorage cache | **PASS** |
| Engine successor snapshot inherits custom | **PASS** (companion baseline) |

---

## Residual risks

None blocking production. All portal pages that branch on journey should continue to read `data.commercialJourney` from the dashboard API (already computed by the frozen resolver).

---

## Certification

**PASS** — Active license remains permanent SSOT; Custom ERP is sticky; centralized Product Type Resolver is the official production architecture for Customer Portal routing.

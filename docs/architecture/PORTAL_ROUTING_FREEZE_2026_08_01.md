# Customer Portal Routing — PRODUCTION FREEZE

| Field | Value |
|-------|--------|
| **Status** | **FROZEN — PRODUCTION BASELINE** |
| **Product** | WAAMTO ERP Website (Customer Portal) + License Engine snapshot contract |
| **Freeze id** | `PORTAL_ROUTING_FREEZE_2026_08_01` |
| **Freeze date** | **2026-08-01** |
| **Parent freezes** | Architecture Freeze v1.0 · Portal architecture freeze |
| **Report** | [PORTAL_ROUTING_FREEZE_2026_08_01_REPORT.md](./PORTAL_ROUTING_FREEZE_2026_08_01_REPORT.md) |

---

## 1. Purpose

Lock **Customer Portal routing** (Predefined ERP vs Custom ERP commercial journey) as the official production baseline.

Portal type must **never** be inferred from modules, feature packs, cart, upgrade history, snapshot order, or client cache.

---

## 2. Frozen resolution chain

```
Active License (primary)
  → package_type
  → resolveJourneyFromLicenses()          [SSOT — lib/portal/package-type.ts]
  → dashboard.commercialJourney           [lib/portal/dashboard.ts]
  → resolvePortalJourneyFromDashboard()   [consumer entry point]
  → Portal routers / nav / section gates
```

Commercial snapshot `package_type` / `package_mode` is **secondary** — used only when the active license has no `package_type`.

---

## 3. Frozen rules

### Rule 1 — Active license is the only authority

Primary license `package_type` from License Engine is the permanent SSOT for portal journey.

### Rule 2 — Custom ERP is sticky

Once `package_type = custom`, the portal remains Custom ERP until an administrator explicitly changes the active commercial product/license.

Purchasing modules, feature packs, or renewals must **never** change portal type.

### Rule 3 — Centralized resolver only

All portal routing gates must consume `commercialJourney` from the dashboard aggregate (or `resolvePortalJourneyFromDashboard()`).

No page may independently infer Predefined vs Custom from snapshot fields, module counts, or feature pack counts.

### Rule 4 — Snapshot is secondary

If snapshot and active license disagree, **active license wins**. Snapshot cannot downgrade a custom license to predefined routing.

### Rule 5 — No duplicate routing logic

Future portal pages must extend `resolveJourneyFromLicenses` / `resolvePortalJourneyFromDashboard`. No scattered conditions.

---

## 4. Frozen Website artifacts

| Artifact | Role |
|----------|------|
| `src/lib/portal/package-type.ts` | Product type + journey SSOT |
| `src/lib/portal/dashboard.ts` | Computes `commercialJourney` on dashboard read |
| `src/components/portal/portal-dashboard-router.tsx` | Dashboard route gate |
| `src/components/portal/portal-journey-section.tsx` | Shared section route gate |
| `src/components/portal/portal-plans-gate.tsx` | Predefined plans block for Custom ERP |
| `src/components/portal/portal-access.ts` | Nav journey gate |
| `scripts/_verify_portal_journey_resolver.js` | Offline resolver verification |

---

## 5. Required License Engine companion baseline

These Engine changes preserve `package_type: custom` on successor snapshots so the license SSOT cannot be corrupted after addon/renewal payments:

| Artifact | Role |
|----------|------|
| `commercial-snapshot.service.ts` | Inherit custom package type on successor snapshots |
| `subscription-modification.service.ts` | Addon-after-payment preserves custom package type |
| `payment-automation.service.ts` | Custom package type on renewals; skip duplicate addon snapshot |

Does **not** freeze billing architecture, licensing rules, or checkout flow shape.

---

## 6. Explicitly forbidden inference sources

Portal routing must **never** depend on:

- Purchased module count
- Feature pack count
- Installed / runtime / provisioned modules
- Upgrade history
- Cart contents
- Snapshot order or stale snapshot alone
- UI state, session cache, or localStorage journey flags

---

## 7. Change policy

| Allowed | Forbidden without approved architecture CR |
|---------|-----------------------------------------------|
| Critical bug fixes preserving frozen rules | New parallel journey detectors |
| Security fixes | Module/feature-pack-based routing |
| Documentation updates | Snapshot-first routing that overrides custom license |
| Resolver tests | Per-page snapshot OR-checks for journey |

**Future portal routing changes require an approved architecture change request.**

---

## 8. Related freezes

- `docs/architecture/ARCHITECTURE_FREEZE_V1_0.md`
- `.cursor/rules/portal-architecture-freeze.mdc`
- `.cursor/rules/portal-routing-freeze-2026-08-01.mdc`

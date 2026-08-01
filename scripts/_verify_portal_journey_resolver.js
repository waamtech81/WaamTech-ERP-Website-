/**
 * Offline verification — portal journey resolver (Custom ERP sticky SSOT).
 * Run: node scripts/_verify_portal_journey_resolver.js
 */

const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

function resolvePortalCommercialJourney(packageType) {
  const raw = String(packageType || "")
    .trim()
    .toLowerCase();
  if (raw === "custom" || raw === "custom_erp" || raw === "builder") return "custom";
  return "predefined";
}

function isCustomErpPackageType(packageType) {
  return resolvePortalCommercialJourney(packageType) === "custom";
}

function primaryPortalLicense(licenses) {
  if (!licenses?.length) return null;
  const active = licenses.find((l) =>
    ["active", "trial", "grace", "pending"].includes(
      String(l.effective_status || l.status).toLowerCase()
    )
  );
  return active || licenses[0] || null;
}

function resolveJourneyFromLicenses(licenses, opts = {}) {
  const primary = primaryPortalLicense(licenses);
  const licenseType = primary?.package_type;
  const licenseJourney =
    licenseType != null && String(licenseType).trim() !== ""
      ? resolvePortalCommercialJourney(licenseType)
      : null;

  if (licenseJourney === "custom") return "custom";

  // Explicit predefined license wins — snapshot is secondary only when license unset.
  if (licenseJourney === "predefined") return "predefined";

  const snapType = opts.commercialSnapshotPackageType;
  const snapMode = opts.commercialSnapshotPackageMode;
  if (isCustomErpPackageType(snapType) || isCustomErpPackageType(snapMode)) return "custom";

  if (snapType != null && String(snapType).trim() !== "") {
    return resolvePortalCommercialJourney(snapType);
  }
  if (snapMode != null && String(snapMode).trim() !== "") {
    return resolvePortalCommercialJourney(snapMode);
  }

  return "predefined";
}

const customLicense = [{ id: "1", status: "active", package_type: "custom" }];
const predefinedLicense = [{ id: "1", status: "active", package_type: "predefined" }];
const starterLicense = [{ id: "1", status: "active", package_type: "starter" }];

// Scenario: Custom license + stale predefined snapshot (addon purchase bug)
assert(
  resolveJourneyFromLicenses(customLicense, {
    commercialSnapshotPackageType: "predefined",
    commercialSnapshotPackageMode: "business_profile",
  }) === "custom",
  "Custom license must stay custom when snapshot reverts to predefined"
);

// Scenario: Predefined customer unchanged
assert(
  resolveJourneyFromLicenses(predefinedLicense, {
    commercialSnapshotPackageType: "predefined",
  }) === "predefined",
  "Predefined customer stays predefined"
);

// Scenario: Predefined license must NOT be overridden by stale custom snapshot
assert(
  resolveJourneyFromLicenses(predefinedLicense, {
    commercialSnapshotPackageType: "custom",
    commercialSnapshotPackageMode: "custom",
  }) === "predefined",
  "Predefined license must win over custom snapshot"
);

// Scenario: Plan slug package_type (starter/business/etc.) stays predefined vs custom snap
assert(
  resolveJourneyFromLicenses(starterLicense, {
    commercialSnapshotPackageType: "custom",
  }) === "predefined",
  "Starter (predefined journey) must win over custom snapshot"
);

// Scenario: No license package_type — snapshot custom
assert(
  resolveJourneyFromLicenses([{ id: "1", status: "active", package_type: null }], {
    commercialSnapshotPackageType: "custom",
  }) === "custom",
  "Snapshot custom when license unset"
);

// Scenario: Upgrade path — license becomes custom
assert(
  resolveJourneyFromLicenses(
    [{ id: "1", status: "active", package_type: "custom" }],
    { commercialSnapshotPackageType: "custom" }
  ) === "custom",
  "Custom upgrade stays custom"
);

console.log("PASS — portal journey resolver scenarios");

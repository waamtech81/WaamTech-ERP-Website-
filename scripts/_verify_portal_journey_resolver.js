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

  const snapType = opts.commercialSnapshotPackageType;
  const snapMode = opts.commercialSnapshotPackageMode;
  if (isCustomErpPackageType(snapType) || isCustomErpPackageType(snapMode)) return "custom";

  if (licenseJourney === "predefined") return "predefined";

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

// /services/complianceService.mjs

const DAY_MS = 1000 * 60 * 60 * 24;

const MAIN_COMPLIANCE_FIELDS = [
  { key: "passportExpiry", label: "Passport" },
  { key: "drivingLicenseExpiry", label: "Driving License" },
  { key: "rightToWorkExpiry", label: "Right To Work" }
];

const getValidTimestamp = (value) => {
  if (!value) return null;

  const ts = new Date(value).getTime();
  return isNaN(ts) ? null : ts;
};

export const checkDriverCompliance = (driver, warningDays = 7) => {
  const now = Date.now();

  // Decide which fields to check dynamically
  const shouldSkipRTW =
    driver?.isUKnational === true || driver?.rtkNoLimit === true;

  const complianceFields = shouldSkipRTW ?
    MAIN_COMPLIANCE_FIELDS.filter(f => f.key !== "rightToWorkExpiry") :
    MAIN_COMPLIANCE_FIELDS

  const failedDocs = [];
  const warningDocs = [];

  for (const field of complianceFields) {
    const ts = getValidTimestamp(driver[field.key]);
    if (!ts) continue;

    const daysRemaining = Math.floor((ts - now) / DAY_MS);

    if (daysRemaining < 0) {
      failedDocs.push({
        type: field.label,
        expiry: ts,
        daysRemaining
      });
    } else if (daysRemaining <= warningDays) {
      warningDocs.push({
        type: field.label,
        expiry: ts,
        daysRemaining
      });
    }
  }

  if (failedDocs.length > 0) {
    return { status: "FAILED", docs: failedDocs };
  }

  if (warningDocs.length > 0) {
    return { status: "WARNING", docs: warningDocs };
  }

  return { status: "COMPLIANT", docs: [] };
};
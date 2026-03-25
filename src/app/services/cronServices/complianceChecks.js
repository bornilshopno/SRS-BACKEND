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
        daysRemaining,
      });
    } else if (daysRemaining <= warningDays) {
      warningDocs.push({
        type: field.label,
        expiry: ts,
        daysRemaining,
      });
    }
  }

  let status = "COMPLIANT";
  if (failedDocs.length > 0) status = "FAILED";
  else if (warningDocs.length > 0) status = "WARNING";

  return {
    status,
    failedDocs,
    warningDocs
  };
};




export const getNonCompliantDrivers = (drivers, warningDays = 7) => {
  const result = {
    FAILED: [],
    WARNING: []
  };

  for (const driver of drivers) {
    const compliance = checkDriverCompliance(driver, warningDays);

    if (compliance.failedDocs.length > 0) {
      result.FAILED.push({
        driver: {
          name: driver.name,
          srsDriverNumber: driver.srsDriverNumber,
          email: driver.email,
          emailStatus: driver.complianceEmailStatus.lastSentAt,
        },
        docs: compliance.failedDocs
      });
    } if (compliance.warningDocs.length > 0) {
      result.WARNING.push({
        driver: {
          name: driver.name,
          srsDriverNumber: driver.srsDriverNumber,
          email: driver.email,
          emailStatus: driver.complianceEmailStatus.lastSentAt,
        },
        docs: compliance.warningDocs
      });
    }
  }

  return result;
};
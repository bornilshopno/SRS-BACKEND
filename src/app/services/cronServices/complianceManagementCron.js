// /cron/complianceManagementCron.mjs

import cron from "node-cron";
import { getCollection } from "../../../utils/getCollection.js";
import { getNonCompliantDrivers } from "./complianceChecks.js";
import { sendManagementReportEmail } from "../emailServices/managementEmailService.js";



async function getUsersCollection() {
  return await getCollection("users");
}

const runManagementReportJob = async () => {
  try {
    const usersCollection = await getUsersCollection();

    const drivers = await usersCollection
      .find({
        role: "driver",
        isDriverApproved: true,
        isDriverTerminated: false
      })
      .toArray();

    const { FAILED, WARNING } = getNonCompliantDrivers(drivers, 7);
    // console.log("FAILEDWARNING", FAILED, WARNING)

    // if (FAILED.length === 0 && WARNING.length === 0) {
    //   console.log("✅ No compliance issues");
    //   return;
    // }

  // const res=  await sendManagementReportEmail({ FAILED, WARNING }); //must be uncommented

    console.log("📊 Management report sent",);
  } catch (err) {
    console.error("❌ Management cron error:", err);
  }
};

// ⏰ Example: 6 PM UK (after driver emails)
cron.schedule(
//   "0 18 * * *", // minute, hour, date, month, dayNumber of JS
  "0 0 * * 4",
  () => {
    console.log("⏳ Running management report cron...");
    runManagementReportJob();
  },
  {
    timezone: "Europe/London"
  }
);

export default {};
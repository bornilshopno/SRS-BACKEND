// /cron/complianceCron.mjs

import cron from "node-cron";
import { getCollection } from "../../../utils/getCollection.js";
import { checkDriverCompliance } from "./complianceChecks.js";
import { sendComplianceEmail } from "../emailServices/brevoEmailService.js";


async function getUsersCollection() {
  return await getCollection("users");
}

const runComplianceJob = async () => {
const allusers=await getUsersCollection()

  try {
    const drivers = await allusers
      .find({
        role: "driver",
        isDriverApproved: true,
        isDriverTerminated: false
      })
      .toArray();
    //   console.log("drivers", drivers)

    for (const driver of drivers) {
      const result = checkDriverCompliance(driver, 7);

      // console.log("complianceDrivers", result.status)

      if (result.status === "COMPLIANT") continue;


    //  const res= await sendComplianceEmail({
    //     to: driver.email,
    //     name: driver.name,
    //     status: result.status,
    //     docs: [  ...result.failedDocs,  ...result.warningDocs]
    //   });


      // ✅ Update email tracking
      await allusers.updateOne(
        { _id: driver._id },
        {
          $set: {
            [`complianceEmailStatus.${result.status}`]: true,
            "complianceEmailStatus.lastSentAt": Date.now()
          }
        }
      );
    }

    console.log("✅ Compliance job completed");
  } catch (err) {
    console.error("❌ Compliance job error:", err);
  }
};

// ⏰ TEST (every day 5 PM UK time)
cron.schedule(
//   "* * * * *", // minute, hour, date, month, dayNumber of JS
  "0 0 * * 5",
  () => {
    console.log("⏳ Running compliance cron...");
    runComplianceJob();
  },
  {
    timezone: "Europe/London"
  }
);

export default {};
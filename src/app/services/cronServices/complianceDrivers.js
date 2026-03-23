// /cron/complianceCron.mjs

import cron from "node-cron";
import { getCollection } from "../../../utils/getCollection.js";
import { checkDriverCompliance } from "../emailServices/complianceMailing.js";
import { sendComplianceEmail } from "../emailServices/brevoEmailService.js";
// import { MongoClient } from "mongodb";

async function getUsersCollection() {
  return await getCollection("users");
}

// const uri = process.env.MONGO_URI;
// const client = new MongoClient(uri);

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

      console.log("complianceDrivers", result.status)

      if (result.status === "COMPLIANT") continue;

      // 🚫 Prevent duplicate emails
      if (
        driver.complianceEmailStatus &&
        driver.complianceEmailStatus[result.status]
      ) {
        continue;
      }

     const res= await sendComplianceEmail({
        to: driver.email,
        name: driver.name,
        status: result.status,
        docs: result.docs
      });
console.log("Res compliance drivers", res)
      // ✅ Update email tracking
      await allusers.updateOne(
        { _id: driver._id },
        {
          $set: {
            [`complianceEmailStatus.${result.status}`]: true,
            "complianceEmailStatus.lastSentAt": new Date()
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
  "0 * * * *",
  () => {
    console.log("⏳ Running compliance cron...");
    runComplianceJob();
  },
  {
    timezone: "Europe/London"
  }
);

export default {};
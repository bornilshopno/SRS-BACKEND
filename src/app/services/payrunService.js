// PayrunService.js

import { calculateAdjustments } from "../../utils/calculateAdjustments.js";
import { getCollection } from "../../utils/getCollection.js";
import { mergeDriverWiseTrips } from "../../utils/mergeDriverWiseTrips.js";

async function getThisCollection() {
  return await getCollection("payruns");
}

/* --------------------------------------------------
   CREATE or UPDATE Weekly Payrun
-----------------------------------------------------*/
export async function createWeeklyPayrunService(payload) {
  const collection = await getThisCollection();

  const { year, week, driverWiseTrips } = payload;

  console.log("driverWiseTrips", driverWiseTrips)
  const yearNum = Number(year);
  const weekNum = Number(week);

  // 1️⃣ Check if week document exists
  const doc = await collection.findOne({ year: yearNum, week: weekNum });

  // 2️⃣ Create new week doc
  if (!doc) {
    const newDoc = {
      year: yearNum,
      week: weekNum,
      driverWiseWeeklyTrips: driverWiseTrips, // ✅ correct structure
    };

    const result = await collection.insertOne(newDoc);

    return {
      createdPayrun: true,
      _id: result.insertedId,
      weekData: newDoc.driverWiseWeeklyTrips,
    };
  }

  // 3️⃣ Merge into existing driverWiseWeeklyTrips
  const existingTrips = doc.driverWiseWeeklyTrips || {};

  const mergedTrips = mergeDriverWiseTrips(
    doc.driverWiseWeeklyTrips || {},
    driverWiseTrips
  );

  // 4️⃣ Persist merged data
  await collection.findOneAndUpdate(
    { year: yearNum, week: weekNum },
    { $set: { driverWiseWeeklyTrips: mergedTrips } },
    { returnDocument: "after" }
  );

  return {
    updatedPayrun: true,
    week: weekNum,
    year: yearNum,
    weekData: mergedTrips,
  };
}
/* --------------------------------------------------
   GET Weekly Payrun
-----------------------------------------------------*/
export async function getWeeklyPayrunService(year, week) {

  const collection = await getThisCollection();


  if (year && week) {
    const query = {
      year: Number(year),
      week: Number(week)
    };

    const payrunData = await collection.findOne(query)
    // console.log("payrunGet", year, week)
    if (!payrunData) return []
    return payrunData
  }

  const fullPayRunData = await collection.find().toArray()
  return fullPayRunData



}

/* --------------------------------------------------
   Update Hold Status in Payrun
-----------------------------------------------------*/

export async function updateHoldStatus(payload) {
  const collection = await getThisCollection();
  const { isHold, year, week, driverId } = payload;

  const yearNum = Number(year);
  const weekNum = Number(week);



  const result = await collection.findOneAndUpdate(
    {
      year: yearNum, week: weekNum,
      [`driverWiseWeeklyTrips.${driverId}`]: { $exists: true }
    },// optional safety: only update if driver already exists

    {
      $set: {
        [`driverWiseWeeklyTrips.${driverId}.isHold`]: isHold
      }
    },
    { returnDocument: "after" }
  )
  console.log("result in payrun service", result)
  return {
    updatedPayrun: true,
    week: weekNum,
    year: yearNum,
    // weekData: updatedDriverData,
  }
}

/* --------------------------------------------------
   Update Weekly Payrun
-----------------------------------------------------*/


export async function updateWeeklyPayrunService(payload) {
  const collection = await getThisCollection();
  const { year, week, payrunTrips } = payload;

  const yearNum = Number(year);
  const weekNum = Number(week);

  const updateDoc = {};

  for (const driverId in payrunTrips) {
    updateDoc[`driverWiseWeeklyTrips.${driverId}`] = payrunTrips[driverId];
  }

  const result = await collection.findOneAndUpdate(
    { year: yearNum, week: weekNum },
    { $set: updateDoc },
    { returnDocument: "after" }
  );

  return {
    updatedPayrun: true,
    week: weekNum,
    year: yearNum,
    weekData: result.value?.driverWiseWeeklyTrips,
  };
}

/* --------------------------------------------------
  Patch Weekly Payrun when Invoice Revised
-----------------------------------------------------*/
export async function PatchWeeklyPayrunService(payload) {
  const collection = await getThisCollection();

  const { year, week, driverId, updatedWeekData } = payload;

  if (!year || !week || !driverId || !Array.isArray(updatedWeekData)) {
    return {
      success: false,
      status: 400,
      message: "Invalid payload"
    };
  }

  const updatePath = `driverWiseWeeklyTrips.${driverId}.weekData`;

  try {
    const result = await collection.updateOne(
      { year: Number(year), week: Number(week) },
      {
        $set: {
          [updatePath]: updatedWeekData,
          [`driverWiseWeeklyTrips.${driverId}.isSaved`]: true
        }
      }
    );

    if (result.matchedCount === 0) {
      return {
        success: false,
        status: 404,
        message: "Payrun not found for given year/week"
      };
    }

    if (result.modifiedCount === 0) {
      return {
        success: false,
        status: 404,
        message: "Driver not found in this payrun/No change in Weekdata"
      };
    }

    return {
      success: true,
      status: 200,
      message: "Driver weekData updated successfully"
    };

  } catch (err) {
    console.error("PatchWeeklyPayrunService error:", err);
    return {
      success: false,
      status: 500,
      message: "Internal server error",
      error: err.message
    };
  }
}


///////////////////////////////////

export async function paymentApply(req, res) {
  const session = client.startSession();

  try {
    const {
      driverId,
      weeklyTotal,
      vatAmount,
      year,
      week,
      payrunId
    } = req.body;

    let result;

    await session.withTransaction(async () => {

      /* 1️⃣ Fetch active adjustments */
      const adjustments = await adjustmentsCollection
        .find(
          {
            driverId,
            isActive: true,
            remaining: { $gt: 0 },
            $expr: {
              $or: [
                { $lt: ["$startYear", year] },
                {
                  $and: [
                    { $eq: ["$startYear", year] },
                    { $lte: ["$startWeek", week] }
                  ]
                }
              ]
            }
          },
          { session }
        )
        .toArray();

      /* 2️⃣ Fetch active loans */
      const loans = await loansCollection
        .find(
          {
            driverId,
            isActive: true,
            remaining: { $gt: 0 }
          },
          { session }
        )
        .toArray();

      /* 3️⃣ Run calculation (SAME as preview) */
      result = calculateAdjustments({
        weeklyTotal,
        vatAmount,
        ctpAdjustments: adjustments.filter(
          a => a.type === "CTP" && a.direction === "ADD"
        ),
        dbsAdjustments: adjustments.filter(a => a.type === "DBS"),
        penaltyAdjustments: adjustments.filter(a => a.type === "PENALTY"),
        loans
      });

      /* 4️⃣ Update CTP */
      for (const c of result.breakdown.ctp) {
        await adjustmentsCollection.updateOne(
          { _id: c.adjustmentId },
          {
            $inc: { remaining: -c.added },
            $set: { carryForward: c.carryForward }
          },
          { session }
        );
      }

      /* 5️⃣ Update DBS & penalties */
      for (const d of [...result.breakdown.dbs, ...result.breakdown.penalties]) {
        await adjustmentsCollection.updateOne(
          { _id: d.adjustmentId },
          {
            $inc: { remaining: -d.deducted },
            $set: { carryForward: d.carryForward }
          },
          { session }
        );
      }

      /* 6️⃣ Update loans */
      for (const l of result.breakdown.loans) {
        await loansCollection.updateOne(
          { _id: l.loanId },
          {
            $inc: { remaining: -l.deducted },
            $set: { carryForward: l.carryForward }
          },
          { session }
        );
      }

      /* 7️⃣ Update payrun */
      await payrunsCollection.updateOne(
        { _id: payrunId },
        {
          $set: {
            weeklyTotal,
            vatAmount,
            earnings: result.earningsBeforeDeductions,
            deductions: result.totals,
            netPay: result.netPay,
            appliedAt: new Date()
          }
        },
        { session }
      );
    });

    res.json({ success: true, result });

  } catch (err) {
    console.error("paymentApply error:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    await session.endSession();
  }
}

// PayrunService.js

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
    if (!payrunData) return []
    return payrunData
  }

  const fullPayRunData = await collection.find().toArray()
  return fullPayRunData

  

}

/* --------------------------------------------------
   Update Weekly Payrun
-----------------------------------------------------*/

// export async function updateWeeklyPayrunService(payload) {
//   const collection = await getThisCollection();
//   const { year, week, payrunTrips } = payload;

//   const yearNum = Number(year);
//   const weekNum = Number(week);


//   const payrun = await collection.findOne({ year: yearNum, week: weekNum });
//   const updatedTrips= payrun.driverWiseWeeklyTrips || {}

// for (const driverId in payrunTrips ){
//   updatedTrips[driverId]= payrunTrips[driverId]
// }

// const result = await collection.findOneAndUpdate(
//      { year: yearNum, week: weekNum },
//     { $set: { driverWiseWeeklyTrips: updatedTrips } },
//     { returnDocument: "after" }
// )

//   return {
//     updatedPayrun: true,
//     week: weekNum,
//     year: yearNum,
//     weekData: updatedTrips,
//   }
// }

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

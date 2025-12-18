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
   CREATE or UPDATE Weekly Payrun
-----------------------------------------------------*/
export async function getWeeklyPayrunService(year, week) {

  const collection = await getThisCollection();

  if (year && week) {
    const query = {
      year: Number(year),
      week: Number(week)
    };

    const payrunData=await collection.findOne(query)
    if(!payrunData) return []
    return payrunData
  }

const fullPayRunData=await collection.find().toArray()
return fullPayRunData

 
}
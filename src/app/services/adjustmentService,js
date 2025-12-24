import { getCollection } from "../../utils/getCollection.js";



async function getThisCollection() {
  return await getCollection("adjustments");
}


export async function createAdjustment(payload) {

  const data = { ...payload, createdAt: Date.now() }
  const collection = await getThisCollection();
  try {
    const result = await collection.insertOne(data)
    return { insertedId: result.insertedId, createdAdjustment: data, success:true }
  } catch (error) {
  return{ message:"Failed to Update System" }
  }


}



// {
//   _id,
//   driverId,

//   type: "CTP" | "DBS" | "PENALTY" | "BONUS",

//   totalAmount: Number,          // full amount
//   installmentAmount: Number,    // weekly deduction/addition
//   remainingAmount: Number,

//   direction: "ADD" | "DEDUCT",

//   startWeek: Number,
//   startYear: Number,

//   reason?: String,

//   createdBy: adminId,
//   createdAt: Date,

//   isActive: Boolean
// }

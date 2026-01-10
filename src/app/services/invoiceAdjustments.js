import { getCollection } from "../../utils/getCollection.js";

async function getTheCollection(collection) {
  return await getCollection(collection);
}


export const updatePayrunInvoiceStatus=async(driverWiseInvoiceData, week, year)=> {
    const payrunCollection= await getTheCollection("payruns")
  try {
    // 1️⃣ Build the $set object dynamically
    const setUpdates = {};
    driverWiseInvoiceData.forEach(inv => {
      setUpdates[`driverWiseWeeklyTrips.${inv.driverId}.invoiceCreated`] = true;
    });

    // 2️⃣ Update the payrun document for the specific week/year
    const result = await payrunCollection.updateOne(
      { week, year },
      { $set: setUpdates }
    );

    console.log("result from invoice adjustment", setUpdates, result)
    return result

   
  } catch (err) {
    console.error("Failed to update payrun invoice status:", err);
  }
}
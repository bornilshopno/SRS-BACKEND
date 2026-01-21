// src/services/invoice.service.mjs

import { getCollection } from '../../utils/getCollection.js';
import { sendInvoiceEmail } from './emailService.js'
import { updatePayrunInvoiceStatus } from './invoiceAdjustments.js';
import { generateInvoicePdf } from './pdfService.js'
import { ObjectId } from "mongodb";

async function getInvoiceCollection() {
  return await getCollection("invoices");
}

async function getDriverCollection() {
  return await getCollection("users");
}
/**
 * Process and send invoices
 * One email per invoice
 * Failures are isolated
 */

/**
 * @param {Array<Object>} invoices
 * @returns {Object} summary
 */
export const processInvoices = async (invoices = []) => {
  const results = {
    total: invoices.length,
    sent: 0,
    failed: 0,
    details: []
  }

  for (const invoice of invoices) {
    try {

      const driverCollection = await getDriverCollection();
      const driverInfo = await driverCollection.findOne({ _id: new ObjectId(invoice.driverId) });
      const driver = {
        name: driverInfo.name,
        niNumber: driverInfo.nationalInsuranceNumber,
        address: driverInfo.address,
        vatNumber: driverInfo.vatNumber,
      }


      const pdfBuffer = await generateInvoicePdf({ ...invoice, ...driver })

      await sendInvoiceEmail({
        to: invoice.email,
        subject: `Invoice ${invoice.reference}`,
        html: `<p>Dear ${driver.name},</p><p>Please find your invoice attached.</p>`,
        pdfBuffer,
        filename: `invoice-${invoice.reference}.pdf`
      })

      results.sent++
      results.details.push({
        invoiceNumber: invoice.reference,
        status: 'sent'
      })
    } catch (error) {
      results.failed++
      results.details.push({
        invoiceNumber: invoice?.reference,
        status: 'failed',
        error: error.message
      })
    }
  }

  return results
}

export const createInvoiceData = async (week, year, driverWiseInvoiceData) => {
  const collection = await getInvoiceCollection();
  const yearNum = Number(year);
  const weekNum = Number(week);
  console.log("InvoiceServiceCreate", driverWiseInvoiceData)
  // 1️⃣ Check if week document exists
  const doc = await collection.findOne({ year: yearNum, week: weekNum });

  // 2️⃣ Create new week doc
  if (!doc) {
    const newDoc = {
      year: yearNum,
      week: weekNum,
      driverWiseInvoiceData,
    };

    const result = await collection.insertOne(newDoc);
    console.log("InvoiceServiceCreate", "no doc invoice updated")
    const payrunResult = updatePayrunInvoiceStatus(driverWiseInvoiceData, week, year)
    console.log("InvoiceServiceCreate", "no Doc payrun result")
    const mailResult = await processInvoices(driverWiseInvoiceData)
    console.log("InvoiceServiceCreate", "no Doc mail result", mailResult)
    return {
      createdInvoice: true,
      _id: result.insertedId,
      invoices: newDoc.driverWiseInvoiceData,
      payrunUpdate: payrunResult
    };
  }

  // 3️⃣ Merge into existing 
  const existingInvoices = doc.driverWiseInvoiceData || [];
  console.log("exisitng Invoices")
  /* Create a map using driverId */
  const invoiceMap = new Map();

  /* Add existing invoices first */
  for (const inv of existingInvoices) {
    invoiceMap.set(inv.driverId.toString(), inv);
  }

  /* Override / add incoming invoices */
  for (const inv of driverWiseInvoiceData) {
    invoiceMap.set(inv.driverId.toString(), inv);
  }

  /* Final merged array */
  const mergedInvoices = Array.from(invoiceMap.values());

  console.log("mergedInvoie")

  // 4️⃣ Persist merged data
  await collection.findOneAndUpdate(
    { year: yearNum, week: weekNum },
    { $set: { driverWiseInvoiceData: mergedInvoices } },
    { returnDocument: "after" }
  );

  //payRunUpdate
  const payrunResult = updatePayrunInvoiceStatus(driverWiseInvoiceData, week, year)
  console.log("payrun updated from MERGE invoice service")

  const mailResult = await processInvoices(mergedInvoices)
  console.log("MERGE mail result", mailResult)

  return {
    updatedInvoice: true,
    week: weekNum,
    year: yearNum,
    invoices: mergedInvoices,
    payrunUpdate: payrunResult
  };
}

// export const generateWeeklyInvoice=async(year, week)=>{
// const collection = await getInvoiceCollection();

//   if (year && week) {
//     const query = {
//       year: Number(year),
//       week: Number(week)
//     };

//     const invoices = await collection.findOne(query)
//     // console.log("payrunGet", year, week)
//     if (!invoices) return []
//     return invoices
//   }

//   const fullInvoiceData = await collection.find().toArray()
//   return fullInvoiceData

// }



export const generateWeeklyInvoice = async (year, week, driverId) => {
  const collection = await getInvoiceCollection();

  const pipeline = [];

  // ✅ optional match
  if (year && week) {
    pipeline.push({
      $match: {
        year: Number(year),
        week: Number(week),
      },
    });
  }

  pipeline.push(
    // 1️⃣ lookup users
    {
      $lookup: {
        from: "users",
        let: {
          driverIds: {
            $map: {
              input: "$driverWiseInvoiceData",
              as: "d",
              in: { $toObjectId: "$$d.driverId" },
            },
          },
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ["$_id", "$$driverIds"],
              },
            },
          },
          {
            $project: {
              site: 1,
              srsDriverNumber: 1,
              name: 1,
              profileImage: 1
            },
          },
        ],
        as: "drivers",
      },
    },

    // 2️⃣ inject user fields into driverWiseInvoiceData
    {
      $addFields: {
        driverWiseInvoiceData: {
          $map: {
            input: "$driverWiseInvoiceData",
            as: "d",
            in: {
              $mergeObjects: [
                "$$d",
                {
                  $let: {
                    vars: {
                      matchedDriver: {
                        $first: {
                          $filter: {
                            input: "$drivers",
                            as: "u",
                            cond: {
                              $eq: [
                                "$$u._id",
                                { $toObjectId: "$$d.driverId" },
                              ],
                            },
                          },
                        },
                      },
                    },
                    in: {
                      site: "$$matchedDriver.site",
                      srsDriverNumber: "$$matchedDriver.srsDriverNumber",
                      name: "$$matchedDriver.name",
                      profileImage: "$$matchedDriver.profileImage",
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },

    // 3️⃣ cleanup
    {
      $project: {
        drivers: 0,
      },
    }
  );

  const invoices = await collection.aggregate(pipeline).toArray();

  if (driverId) {

    const result = await invoices?.[0].driverWiseInvoiceData?.find(i => i.driverId === driverId)
    return result ? result : {}


  }
  return invoices.length ? invoices : [];
};

export const sendEmailbyIdYearWeek = async (payload) => {
  const { driverId, year, week } = payload;
  const invoice = await generateWeeklyInvoice(year, week, driverId)
  const data =  [invoice] 
 const result= await processInvoices(data)
 console.log("mail",result)
 return {mail: result}

}
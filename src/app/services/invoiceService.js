// src/services/invoice.service.mjs

import { getCollection } from '../../utils/getCollection.js';
import { sendInvoiceEmail } from './emailService.js'
import { updatePayrunInvoiceStatus } from './invoiceAdjustments.js';
import { generateInvoicePdf } from './pdfService.js'


async function getTheCollection() {
  return await getCollection("invoices");
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
      // REQUIRED FIELDS EXPECTED IN invoice
      // invoice.email
      // invoice.invoiceNumber
      // invoice.customerName
      // invoice.items
      // invoice.totalAmount

      const pdfBuffer = await generateInvoicePdf(invoice)

      await sendInvoiceEmail({
        to: invoice.email,
        subject: `Invoice ${invoice.driverId}`,
        html: `<p>Dear Concern,</p><p>Please find your invoice attached.</p>`,
        pdfBuffer,
        filename: `invoice-${invoice.driverId}.pdf`
      })

      results.sent++
      results.details.push({
        invoiceNumber: invoice.driverId,
        status: 'sent'
      })
    } catch (error) {
      results.failed++
      results.details.push({
        invoiceNumber: invoice?.driverId,
        status: 'failed',
        error: error.message
      })
    }
  }

  return results
}

export const createInvoiceData = async (week, year, driverWiseInvoiceData) => {
  const collection = await getTheCollection();
  const yearNum = Number(year);
  const weekNum = Number(week);
console.log("InvoiceServiceCreate",driverWiseInvoiceData)
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
    const payrunResult= updatePayrunInvoiceStatus(driverWiseInvoiceData, week, year)
console.log("InvoiceServiceCreate", "no Doc payrun result")
   const mailResult= await processInvoices(driverWiseInvoiceData)
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
   const payrunResult= updatePayrunInvoiceStatus(driverWiseInvoiceData, week, year)
   console.log("payrun updated from invoice service")

   const mailResult=await processInvoices(mergedInvoices)

  return {
    updatedInvoice: true,
    week: weekNum,
    year: yearNum,
    invoices: mergedInvoices,
    payrunUpdate: payrunResult
  };
}

export const generateWeeklyInvoice=async(year, week)=>{
const collection = await getTheCollection();


  if (year && week) {
    const query = {
      year: Number(year),
      week: Number(week)
    };

    const invoices = await collection.findOne(query)
    // console.log("payrunGet", year, week)
    if (!invoices) return []
    return invoices
  }

  const fullInvoiceData = await collection.find().toArray()
  return fullInvoiceData

}

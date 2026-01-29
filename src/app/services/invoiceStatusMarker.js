// repositories/invoice.repo.js

import { getCollection } from "../../utils/getCollection.js";

async function getInvoiceCollection() {
  return await getCollection("invoices");
}

export const markInvoiceApplied = async (invoiceId) => {
  const collection = await getInvoiceCollection();
  await collection.updateOne(
    { _id: invoiceId },
    {
      $set: {
        adjustmentStatus: "APPLIED",
        lastProcessedAt: Date.now()
      }
    }
  );
};

export const markInvoiceFailed = async (invoiceId) => {
  const collection = await getInvoiceCollection();
  await collection.updateOne(
    { _id: invoiceId },
    {
      $set: {
        adjustmentStatus: "FAILED",
        lastProcessedAt: Date.now()
      }
    }
  );
};
